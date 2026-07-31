// Tests for the /qm/* analytics ingestion proxy (worker/index.ts). The
// vitest workers project replaces the open internet with an echo
// outboundService (see ../vitest.config.ts), so each assertion reads back
// exactly the upstream request the Worker would have sent to PostHog EU --
// URL, headers, and body -- with zero real network access. The echo service
// also answers with a Set-Cookie so the cookie-stripping test is genuine.
import {
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import worker from "../worker/index";

interface UpstreamEcho {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
}

async function call(path: string, init?: RequestInit): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch(
    new Request(`https://q-summit.com${path}`, init),
    env,
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return res;
}

// The echo outboundService only ever answers for eu.i.posthog.com, so a
// request that resolved to any other host could not reach it: asserting on
// echo.url already proves the upstream host stayed pinned.
async function echoOf(path: string, init?: RequestInit): Promise<UpstreamEcho> {
  return (await call(path, init)).json();
}

describe("analytics proxy /qm/*", () => {
  it("forwards to the EU ingestion host with prefix stripped, query and body intact", async () => {
    const echo = await echoOf("/qm/e/?ip=0&compression=gzip-js", {
      method: "POST",
      body: '{"batch":[]}',
    });
    expect(echo.url).toBe(
      "https://eu.i.posthog.com/e/?ip=0&compression=gzip-js",
    );
    expect(echo.method).toBe("POST");
    expect(echo.body).toBe('{"batch":[]}');
  });

  it("forwards GET config requests without a body", async () => {
    const echo = await echoOf("/qm/flags/?v=2");
    expect(echo.url).toBe("https://eu.i.posthog.com/flags/?v=2");
    expect(echo.method).toBe("GET");
    expect(echo.body).toBeNull();
  });

  it("strips cookies and forwards only the CF-attested client IP", async () => {
    const echo = await echoOf("/qm/e/", {
      method: "POST",
      body: "{}",
      headers: {
        cookie: "session=abc",
        "CF-Connecting-IP": "203.0.113.7",
        // Client-controlled header: must be overwritten, never trusted.
        "X-Forwarded-For": "198.51.100.99",
      },
    });
    expect(echo.headers["cookie"]).toBeUndefined();
    expect(echo.headers["x-forwarded-for"]).toBe("203.0.113.7");
  });

  it("blanks X-Forwarded-For when Cloudflare did not attest an IP", async () => {
    const echo = await echoOf("/qm/e/", {
      method: "POST",
      body: "{}",
      headers: { "X-Forwarded-For": "198.51.100.99" },
    });
    expect(echo.headers["x-forwarded-for"]).toBe("");
  });

  it("strips the upstream Set-Cookie and sets security headers on this origin", async () => {
    // The echo outboundService answers with a Set-Cookie; the origin stays
    // cookieless (ADR-0003) only if the proxy drops it before returning.
    const res = await call("/qm/e/", { method: "POST", body: "{}" });
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("pins the upstream host and allowlists endpoints (no open relay)", async () => {
    // A path starting with "//" must never reparse into a different
    // authority, and only real PostHog endpoint families may pass; everything
    // else 404s before any upstream fetch.
    for (const path of [
      "/qm//evil.example.com/x?a=1",
      "/qm/\\evil.example.com/x",
      "/qm//user@evil.example.com/x",
      "/qm/static/array.js",
      "/qm/unknown/",
      "/qm/e",
      "/qm/",
    ]) {
      const res = await call(path, { method: "POST", body: "{}" });
      expect(res.status, `expected 404 for ${path}`).toBe(404);
    }
  });

  it("refuses an oversized body by declared Content-Length (cheap early reject)", async () => {
    const res = await call("/qm/e/", {
      method: "POST",
      body: "{}",
      headers: { "content-length": "5000000" },
    });
    expect(res.status).toBe(413);
  });

  it("refuses an oversized body by actual byte length, not just the header", async () => {
    // A body over the cap is rejected on its real size, so a missing or
    // spoofed Content-Length cannot slip a large payload through.
    const res = await call("/qm/e/", {
      method: "POST",
      body: "a".repeat(4_000_001),
    });
    expect(res.status).toBe(413);
  });

  it("answers only GET/POST, 405 on any other method", async () => {
    const res = await call("/qm/e/", { method: "DELETE" });
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, POST");
  });

  it("leaves non-proxy paths (including /qm-lookalikes) to the assets binding", async () => {
    expect(await (await call("/qmx")).text()).toBe("asset:/qmx");
    expect(await (await call("/qm")).text()).toBe("asset:/qm");
  });
});

describe("edge geo /qm/geo", () => {
  it("returns the Cloudflare edge country, uncached, without touching PostHog", async () => {
    const res = await call("/qm/geo", { cf: { country: "DE" } });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(await res.json()).toEqual({ country: "DE" });
  });

  it("collapses unknown / Tor countries to null", async () => {
    expect(
      await (await call("/qm/geo", { cf: { country: "XX" } })).json(),
    ).toEqual({
      country: null,
    });
    expect(
      await (await call("/qm/geo", { cf: { country: "T1" } })).json(),
    ).toEqual({
      country: null,
    });
  });

  it("returns null country when the edge did not resolve one", async () => {
    // No cf object (e.g. an odd request path); must not throw.
    expect(await (await call("/qm/geo")).json()).toEqual({ country: null });
  });

  it("answers only GET/HEAD, 405 on a write", async () => {
    const res = await call("/qm/geo", { method: "POST", body: "{}" });
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET, HEAD");
  });
});
