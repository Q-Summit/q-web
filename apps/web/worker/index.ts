// /media/* from R2 (run_worker_first); everything else → ASSETS.
// Cache API: full 200 cached, Range sliced to 206; keys include R2 etag so
// same-key overwrites miss. See docs/dev/local-development.md (Media).

import { extensionContentType } from "./media-content-types.mjs";

/** Extension map wins (HLS types); else R2 metadata; else octet-stream. */
function contentTypeFor(
  key: string,
  httpMetadataType: string | undefined,
): string {
  return (
    extensionContentType(key) ?? httpMetadataType ?? "application/octet-stream"
  );
}

/** Day TTL without immutable (admin may overwrite same key); m3u8 shorter. */
function cacheControlFor(key: string): string {
  return key.endsWith(".m3u8")
    ? "public, max-age=3600"
    : "public, max-age=86400, stale-while-revalidate=604800";
}

/** Cache API key = path + etag (strip client query). */
function cacheKeyFor(url: URL, etag: string): Request {
  const keyUrl = new URL(url.pathname, url.origin);
  keyUrl.searchParams.set("_etag", etag);
  return new Request(keyUrl.toString(), { method: "GET" });
}

function notFound(): Response {
  return new Response("Not found\n", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

/**
 * RFC 7233: unusable Range → ignore; valid but unsatisfiable → 416.
 */
type RangeSpec =
  | { kind: "ignore" }
  | { kind: "suffix"; suffix: number }
  | { kind: "bounded"; start: number; end: number | null };

function parseRangeHeader(header: string): RangeSpec {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (match[1] === "" && match[2] === "")) return { kind: "ignore" };
  if (match[1] === "") {
    // A zero-length suffix ("bytes=-0") can never be satisfied; ignoring
    // the header (RFC 7233 allows either) keeps cold-cache and warm-cache
    // responses identical, since the Cache API serves hits full-body.
    const suffix = Number(match[2]);
    return suffix === 0 ? { kind: "ignore" } : { kind: "suffix", suffix };
  }
  const start = Number(match[1]);
  const end = match[2] === "" ? null : Number(match[2]);
  // An explicit end before the start is a syntactically invalid spec,
  // which invalidates the whole header (ignore, not 416).
  if (end !== null && end < start) return { kind: "ignore" };
  return { kind: "bounded", start, end };
}

function resolveRange(
  spec: Exclude<RangeSpec, { kind: "ignore" }>,
  size: number,
): { offset: number; length: number } | null {
  if (spec.kind === "suffix") {
    // suffix is always > 0 here (a zero suffix is classified "ignore").
    const suffix = Math.min(spec.suffix, size);
    return { offset: size - suffix, length: suffix };
  }
  if (spec.start >= size) return null;
  const end = spec.end === null ? size - 1 : Math.min(spec.end, size - 1);
  return { offset: spec.start, length: end - spec.start + 1 };
}

/** Base response headers common to a full-body 200 (Content-Length added by caller). */
function mediaHeaders(key: string, object: R2Object): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set(
    "content-type",
    contentTypeFor(key, object.httpMetadata?.contentType),
  );
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", cacheControlFor(key));
  // /media/* bypasses _headers: set security here (esp. SVG sandbox).
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set(
    "content-security-policy",
    "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  );
  return headers;
}

async function handleMedia(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url);
  // Strip the leading "/media/" prefix; R2 keys are stored flat (no
  // leading slash), matching how MinIO/r2-sync.mjs write them. Malformed
  // percent-encoding (e.g. /media/%ZZ) makes decodeURIComponent throw a
  // URIError -- treat that as a missing key (404), not a Worker 500.
  let key: string;
  try {
    key = decodeURIComponent(url.pathname.replace(/^\/media\//, ""));
  } catch {
    return notFound();
  }
  if (!key) return notFound();

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed\n", {
      status: 405,
      headers: {
        allow: "GET, HEAD",
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  const rangeHeader = request.headers.get("range");
  const rangeSpec = rangeHeader ? parseRangeHeader(rangeHeader) : null;
  // A header we must ignore is treated exactly like no Range header at all,
  // on every path (metadata, cache hit, cache miss), so behavior can never
  // differ between a cold and a warm cache.
  const effectiveSpec =
    rangeSpec && rangeSpec.kind !== "ignore" ? rangeSpec : null;

  // HEAD: answer from R2 metadata only -- never a body, never the cache.
  // head() lets an unsatisfiable range 416 without fetching any bytes.
  if (request.method === "HEAD") {
    const head = await env.MEDIA.head(key);
    if (head === null) return notFound();
    const headers = mediaHeaders(key, head);
    if (effectiveSpec) {
      const range = resolveRange(effectiveSpec, head.size);
      if (!range) {
        return new Response("Range not satisfiable\n", {
          status: 416,
          headers: { "content-range": `bytes */${head.size}` },
        });
      }
      headers.set(
        "content-range",
        `bytes ${range.offset}-${range.offset + range.length - 1}/${head.size}`,
      );
      headers.set("content-length", String(range.length));
      return new Response(null, { status: 206, headers });
    }
    headers.set("content-length", String(head.size));
    return new Response(null, { status: 200, headers });
  }

  // GET. HEAD first for the current R2 etag so Cache API keys track object
  // bytes (overwrite → new etag → miss). The Range header is not part of
  // the key: one cached full 200 serves whole-body and range requests;
  // cache.match slices a 206 for range. Stored entries are always keyed by
  // a Range-less request; ignored Range headers are matched Range-less too.
  const head = await env.MEDIA.head(key);
  if (head === null) return notFound();

  const cache = caches.default;
  const cacheKey = cacheKeyFor(url, head.httpEtag);
  const matchRequest = effectiveSpec
    ? new Request(cacheKey.url, { method: "GET", headers: request.headers })
    : cacheKey;
  const cached = await cache.match(matchRequest);
  if (cached) return cached;

  // Miss: fetch the full object from R2 exactly once.
  const object = await env.MEDIA.get(key);
  if (object === null) return notFound();
  const headers = mediaHeaders(key, object);
  headers.set("content-length", String(object.size));
  const full = new Response(object.body, { status: 200, headers });

  if (!effectiveSpec) {
    // Cache the full body without delaying the user's response.
    ctx.waitUntil(cache.put(cacheKey, full.clone()));
    return full;
  }

  // Range on a cache miss: validate against the known size (416 without
  // delaying on the cache write), then cache the full 200 and re-match so
  // the Cache API returns the sliced 206. The put must complete before the
  // re-match, so it is awaited there (only the first range request per PoP
  // pays this; every later one is a pure cache hit).
  const range = resolveRange(effectiveSpec, object.size);
  if (!range) {
    ctx.waitUntil(cache.put(cacheKey, full.clone()));
    return new Response("Range not satisfiable\n", {
      status: 416,
      headers: { "content-range": `bytes */${object.size}` },
    });
  }
  await cache.put(cacheKey, full.clone());
  const sliced = await cache.match(matchRequest);
  if (sliced) return sliced;
  // Fallback: the object was cached but the Cache API did not slice it.
  // Serve the full 200 (correct, if larger than requested) rather than fail.
  return full;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/media/")) {
      return handleMedia(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
