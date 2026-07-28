// Tests for the /media/* Worker (worker/index.ts): R2 serving, RFC 7233
// Range handling, and the Cache API 200-cached / 206-sliced behavior the
// Worker depends on. Everything runs inside workerd via
// @cloudflare/vitest-pool-workers, so env.MEDIA is a real (local) R2 binding
// and caches.default is the real Cache API -- the same behavior as prod,
// not a mock. R2 storage is isolated per test by the pool; caches.default is
// NOT, so every test uses a unique key (uniq()) to avoid cross-test cache
// hits.
import {
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import worker from "../worker/index";

// ASCII so byte offsets equal character offsets, letting us assert sliced
// bodies with String.slice. 1080 bytes.
const BODY = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".repeat(30);
const SIZE = BODY.length;

// Unique key per call: caches.default persists across tests, so reusing a
// key would let one test's cached 200 satisfy another's request.
let seq = 0;
const uniq = (name: string) => `t${seq++}/${name}`;

const url = (key: string) => `https://media.q-summit.com/media/${key}`;

async function put(key: string, contentType?: string): Promise<void> {
  await env.MEDIA.put(
    key,
    BODY,
    contentType ? { httpMetadata: { contentType } } : undefined,
  );
}

// Run a request through the Worker and flush any ctx.waitUntil() work (the
// non-range cache write is deferred with waitUntil) before returning, so the
// cache is guaranteed populated for a following request.
async function call(key: string, init?: RequestInit): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch(new Request(url(key), init), env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

// Decode the body as text without workerd warning about non-text
// Content-Types (our fixture body is ASCII regardless of the declared type).
async function text(res: Response): Promise<string> {
  return new TextDecoder().decode(await res.arrayBuffer());
}

describe("full-body GET", () => {
  it("serves the whole object with 200 and a day-long revalidatable cache", async () => {
    const key = uniq("photo.jpg");
    await put(key, "image/jpeg");
    const res = await call(key);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-length")).toBe(String(SIZE));
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("cache-control")).toBe(
      "public, max-age=86400, stale-while-revalidate=604800",
    );
    expect(await text(res)).toBe(BODY);
  });

  it("gives .m3u8 playlists the HLS type and a short TTL", async () => {
    const key = uniq("master.m3u8");
    await put(key);
    const res = await call(key);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(
      "application/vnd.apple.mpegurl",
    );
    expect(res.headers.get("cache-control")).toBe("public, max-age=3600");
  });

  it("falls back to the stored content type for unknown extensions", async () => {
    const key = uniq("download.bin");
    await put(key, "application/pdf");
    const res = await call(key);
    expect(res.headers.get("content-type")).toBe("application/pdf");
  });

  it("defaults to octet-stream with no extension and no stored type", async () => {
    const key = uniq("blob");
    await put(key);
    const res = await call(key);
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
  });
});

describe("Range requests (RFC 7233)", () => {
  it("returns 206 for a bounded range", async () => {
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, { headers: { Range: "bytes=0-9" } });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe(`bytes 0-9/${SIZE}`);
    expect(res.headers.get("content-length")).toBe("10");
    expect(await text(res)).toBe(BODY.slice(0, 10));
  });

  it("clamps an open-ended range to the object size", async () => {
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, { headers: { Range: "bytes=1070-" } });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe(
      `bytes 1070-${SIZE - 1}/${SIZE}`,
    );
    expect(await text(res)).toBe(BODY.slice(1070));
  });

  it("serves a suffix range (last N bytes)", async () => {
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, { headers: { Range: "bytes=-5" } });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe(
      `bytes ${SIZE - 5}-${SIZE - 1}/${SIZE}`,
    );
    expect(await text(res)).toBe(BODY.slice(-5));
  });

  it("returns the full body for a suffix larger than the object", async () => {
    // GET slicing is delegated to the Cache API, which serves the full 200
    // (not a 206) when the suffix exceeds the object size. Either way the
    // client gets every byte -- that is the RFC-correct outcome.
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, { headers: { Range: `bytes=-${SIZE + 100}` } });
    expect([200, 206]).toContain(res.status);
    expect(await text(res)).toBe(BODY);
  });

  it("returns 416 for a start beyond the object size", async () => {
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, { headers: { Range: `bytes=${SIZE + 1}-` } });
    expect(res.status).toBe(416);
    expect(res.headers.get("content-range")).toBe(`bytes */${SIZE}`);
  });

  it.each([
    ["a garbage unit", "bytes=abc"],
    ["a non-bytes unit", "items=0-9"],
    ["a multi-range header", "bytes=0-9,20-29"],
    ["a zero-length suffix", "bytes=-0"],
    ["an end before the start", "bytes=100-50"],
    ["a bare token", "bananas"],
  ])("ignores %s and serves the full 200", async (_label, range) => {
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, { headers: { Range: range } });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-length")).toBe(String(SIZE));
    expect(await text(res)).toBe(BODY);
  });
});

describe("Cache API (etag-keyed 200; 206 sliced from it)", () => {
  it("returns 404 after the origin object is deleted (etag HEAD misses)", async () => {
    // Etag keying HEADs R2 on every GET. A deleted object cannot be served
    // from a leftover Cache API entry keyed by the old etag.
    const key = uniq("cache-full.jpg");
    await put(key, "image/jpeg");
    const cold = await call(key);
    expect(cold.status).toBe(200);
    await cold.arrayBuffer();
    await env.MEDIA.delete(key);
    const gone = await call(key);
    expect(gone.status).toBe(404);
  });

  it("serves new bytes after the same key is overwritten (etag miss)", async () => {
    const key = uniq("replaced.jpg");
    const first = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const second = "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
    await env.MEDIA.put(key, first, {
      httpMetadata: { contentType: "image/jpeg" },
    });
    const cold = await call(key);
    expect(cold.status).toBe(200);
    expect(await text(cold)).toBe(first);

    await env.MEDIA.put(key, second, {
      httpMetadata: { contentType: "image/jpeg" },
    });
    const warm = await call(key);
    expect(warm.status).toBe(200);
    expect(await text(warm)).toBe(second);
  });

  it("slices a 206 out of a cached full 200 (the prod edge behavior)", async () => {
    const key = uniq("cache-range.jpg");
    await put(key, "image/jpeg");
    const full = await call(key); // warms the cache with a 200
    await full.arrayBuffer();
    // Origin still present so HEAD succeeds; body comes from Cache API.
    const res = await call(key, { headers: { Range: "bytes=0-9" } });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe(`bytes 0-9/${SIZE}`);
    expect(await text(res)).toBe(BODY.slice(0, 10));
  });

  it("satisfies a cold range on a miss, then caches for reuse", async () => {
    const key = uniq("cache-range.jpg");
    await put(key, "image/jpeg");
    // First touch is a range request (no prior full GET): the Worker fetches
    // the object, caches the full 200, and slices the 206 from it.
    const cold = await call(key, { headers: { Range: "bytes=10-19" } });
    expect(cold.status).toBe(206);
    expect(await text(cold)).toBe(BODY.slice(10, 20));
    const warm = await call(key, { headers: { Range: "bytes=10-19" } });
    expect(warm.status).toBe(206);
    expect(await text(warm)).toBe(BODY.slice(10, 20));
  });
});

describe("HEAD", () => {
  it("returns metadata with no body", async () => {
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-length")).toBe(String(SIZE));
    expect((await res.arrayBuffer()).byteLength).toBe(0);
  });

  it("returns 206 metadata for a range with no body", async () => {
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, {
      method: "HEAD",
      headers: { Range: "bytes=0-9" },
    });
    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe(`bytes 0-9/${SIZE}`);
    expect(res.headers.get("content-length")).toBe("10");
    expect((await res.arrayBuffer()).byteLength).toBe(0);
  });

  it("returns 416 for an unsatisfiable range", async () => {
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, {
      method: "HEAD",
      headers: { Range: `bytes=${SIZE + 1}-` },
    });
    expect(res.status).toBe(416);
    expect(res.headers.get("content-range")).toBe(`bytes */${SIZE}`);
  });
});

describe("errors and routing", () => {
  it("returns 404 for a missing object", async () => {
    const res = await call(uniq("does-not-exist.jpg"));
    expect(res.status).toBe(404);
  });

  it("returns 404 for an empty key", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("https://media.q-summit.com/media/"),
      env,
      ctx,
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });

  it("returns 404 for malformed percent-encoding rather than 500", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("https://media.q-summit.com/media/%ZZ"),
      env,
      ctx,
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(404);
  });

  it("returns 405 with an Allow header for non-GET/HEAD methods", async () => {
    const key = uniq("clip.mp4");
    await put(key, "video/mp4");
    const res = await call(key, { method: "POST" });
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, HEAD");
  });

  it("passes non-/media/* requests through to the ASSETS binding", async () => {
    const ctx = createExecutionContext();
    const res = await worker.fetch(
      new Request("https://q-summit.com/program/"),
      env,
      ctx,
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("asset:/program/");
  });
});
