// Single source of truth for media content types, imported by BOTH the
// Worker (worker/index.ts, TS/workerd) and the R2 sync script
// (scripts/preview/r2-sync.mjs, node ESM). Kept as .mjs (+ a .d.mts type file) so
// one file works from both toolchains without a build step.
//
// iOS Safari's native HLS player only plays the hero video ladder when the
// manifest (.m3u8) and fMP4 segments (.m4s) carry their real content types;
// served as application/octet-stream they silently fail. So this map -- not
// whatever type R2 happens to have stored -- is authoritative for known
// extensions (see extensionContentType and the Worker's contentTypeFor).

export const EXTENSION_CONTENT_TYPES = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ico": "image/x-icon",
  // HLS: manifest + fMP4 segments (the hero video ladder in /media/hero-hls/),
  // plus MPEG-TS segments and WebVTT captions for completeness.
  ".m3u8": "application/vnd.apple.mpegurl",
  ".m4s": "video/mp4",
  ".ts": "video/mp2t",
  ".vtt": "text/vtt",
};

/**
 * Content type for a key's extension, or undefined if the extension is not
 * in the map. Uses lastIndexOf rather than node's path.extname so the same
 * code runs under workerd (no node builtins) and node.
 */
export function extensionContentType(key) {
  const dot = key.lastIndexOf(".");
  if (dot === -1) return undefined;
  return EXTENSION_CONTENT_TYPES[key.slice(dot).toLowerCase()];
}
