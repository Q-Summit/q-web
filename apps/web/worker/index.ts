// /media/* from R2, /qm/geo (edge country) and /qm/* to PostHog EU (all
// run_worker_first); everything else → ASSETS.
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

// Analytics ingestion proxy: /qm/* forwards to PostHog Cloud EU so event
// requests stay first-party (content blockers key on PostHog's domains, not
// on this site's own paths; see ADR-0003 and docs/dev/analytics.md). The SDK
// is bundled into the site's own JS (no-external build), so no /static/*
// script assets are requested at runtime and nothing is cached.
const POSTHOG_API_HOST = "eu.i.posthog.com";
// The endpoint families the bundled SDK can call: events (/e/), newer
// ingestion plus logs/metrics (/i/), remote config (/flags/, /array/), and
// batching (/batch/). Everything else 404s before an upstream URL is even
// built, so this route can never act as a general relay.
const POSTHOG_PATH = /^\/(e|i|flags|array|batch)\//;

// Beacons are best-effort and never block the page, so if PostHog is slow or
// down we degrade to an accepted-and-dropped 202 rather than hanging the
// subrequest or surfacing a 500. Ten seconds is well past a healthy round trip.
const UPSTREAM_TIMEOUT_MS = 10_000;
// Cap the buffered body: capture batches are small, and this is an
// unauthenticated same-origin route, so refuse absurd payloads outright.
const MAX_BODY_BYTES = 4_000_000;

async function handleAnalyticsProxy(request: Request): Promise<Response> {
  // The SDK only ever issues GET (config, flags) and POST (capture); refuse
  // any other method rather than relay an arbitrary verb to PostHog.
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response("Method not allowed\n", {
      status: 405,
      headers: { allow: "GET, POST" },
    });
  }
  const url = new URL(request.url);
  // url.pathname is already dot-segment-normalized by the URL parser (e.g.
  // /qm/e/../flags/ arrives as /qm/flags/), so the allowlist below runs on the
  // final path -- there is no pre-normalization window to slip a traversal
  // through, and the host is pinned regardless.
  const path = url.pathname.slice("/qm".length);
  if (!POSTHOG_PATH.test(path)) return notFound();
  // Buffer the body: streaming request.body through fetch corrupts POST
  // payloads on this path (a documented PostHog reverse-proxy gotcha). Enforce
  // the size cap on the real byte length, not the Content-Length header, which
  // is client-controlled and absent on a chunked request. The header, when
  // present, is a cheap early reject before buffering.
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
    return new Response("Payload too large\n", { status: 413 });
  }
  const body = request.method === "POST" ? await request.arrayBuffer() : null;
  if (body && body.byteLength > MAX_BODY_BYTES) {
    return new Response("Payload too large\n", { status: 413 });
  }
  // Host is pinned: the pathname/search setters cannot change the authority.
  // Never build this from `new URL(path, base)`: a path starting with "//"
  // would reparse as a scheme-relative URL and swap in an attacker-chosen
  // host, turning the route into an open same-origin relay.
  const upstream = new URL(`https://${POSTHOG_API_HOST}`);
  upstream.pathname = path;
  upstream.search = url.search;
  const headers = new Headers(request.headers);
  // The site sets no cookies (ADR-0003), so there is nothing legitimate to
  // forward; dropping the header keeps it that way even if some extension
  // injected one.
  headers.delete("cookie");
  // GeoIP at PostHog needs the visitor's IP, not this Worker's egress IP.
  // Always overwrite: an inbound X-Forwarded-For is client-controlled and
  // must never pass through as if it were trusted.
  headers.set("X-Forwarded-For", request.headers.get("CF-Connecting-IP") ?? "");
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstream, {
      method: request.method,
      headers,
      body,
      redirect: request.redirect,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    // Real upstream failure (network error, DNS, or the abort timeout firing)
    // rejects the fetch here: accept and drop. The client ignores the beacon
    // response, so this loses at most a few events, never the page. Logged (no
    // payload, no IP) so the drop rate is visible in Workers Logs. (Not unit
    // tested -- the workers-pool outbound stub cannot produce a rejecting fetch
    // for a pinned host; this path only fires against the real network.)
    console.error("qm: PostHog upstream unreachable");
    return new Response(null, {
      status: 202,
      headers: { "cache-control": "no-store" },
    });
  }
  // Worker responses bypass public/_headers (same as /media/*), so set the
  // security headers here; and an upstream Set-Cookie must never land on
  // this origin -- the cookieless posture is a compliance property.
  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.delete("set-cookie");
  resHeaders.set("x-content-type-options", "nosniff");
  resHeaders.set("referrer-policy", "strict-origin-when-cross-origin");
  resHeaders.set("cache-control", "no-store");
  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: resHeaders,
  });
}

// Coarse visitor country from Cloudflare's edge (`request.cf.country`, a
// 2-letter ISO code Cloudflare derives at the PoP -- NOT the IP, which never
// leaves the edge). The analytics client fetches this once and registers it
// as a PostHog super property, so events carry a country breakdown while
// staying cookieless and IP-free (PostHog's own IP GeoIP yields nothing in
// cookieless mode). "XX"/"T1" (unknown, Tor) collapse to null so they are not
// registered. Never cached: the value is per-visitor.
function handleGeo(request: Request): Response {
  // Read-only lookup: only GET/HEAD answer with data; a stray write or
  // preflight gets 405 rather than a 200 body.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed\n", {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }
  const raw = request.cf?.country;
  const country = raw && raw !== "XX" && raw !== "T1" ? raw : null;
  return new Response(JSON.stringify({ country }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });
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
    if (url.pathname === "/qm/geo") {
      return handleGeo(request);
    }
    if (url.pathname.startsWith("/qm/")) {
      return handleAnalyticsProxy(request);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
