import type { MediaRef } from "./package-types";

const STRIP_KEYS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "sizes",
  "url",
  "thumbnailURL",
  "width",
  "height",
  "filesize",
  "mimeType",
  "focalX",
  "focalY",
  "prefix",
]);

// Nested objects that still have a `url` after the media-ref conversion are
// content (Lexical link `fields.url`), not uploads; stripping it there breaks
// links and fails draft validation on ingest.
const NESTED_STRIP_KEYS = new Set([...STRIP_KEYS].filter((k) => k !== "url"));

/**
 * Turn a Payload doc (depth 1) into package JSON: drop system fields, map
 * upload relations to `{ filename }`, keep Lexical/JSON as-is.
 */
export function serializeDoc(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(doc)) {
    if (STRIP_KEYS.has(key)) continue;
    out[key] = serializeValue(value);
  }
  return out;
}

function serializeValue(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(serializeValue);
  if (typeof value !== "object") return value;

  const obj = value as Record<string, unknown>;
  if (
    typeof obj.filename === "string" &&
    ("url" in obj || "mimeType" in obj || "filesize" in obj)
  ) {
    const ref: MediaRef = { filename: obj.filename };
    if (typeof obj.alt === "string" || obj.alt === null)
      ref.alt = obj.alt as string | null;
    return ref;
  }

  const nested: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (NESTED_STRIP_KEYS.has(k)) continue;
    nested[k] = serializeValue(v);
  }
  return nested;
}
