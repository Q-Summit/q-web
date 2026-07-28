import { AUDIT_FIELD_NAMES } from "../lib/audit";

const STRIP_ON_INGEST = new Set([
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
  // Audit stamps are server-owned; never re-ingest from packages.
  ...AUDIT_FIELD_NAMES,
]);

// Nested objects that are not media refs keep their `url`: it is content
// (Lexical link `fields.url`), and stripping it produces drafts that fail
// link validation. Top-level doc `url` stays stripped.
const NESTED_STRIP_ON_INGEST = new Set(
  [...STRIP_ON_INGEST].filter((k) => k !== "url"),
);

/**
 * Strip publish intent and force a draft payload for Local API writes.
 * Pair with `draft: true` on create/update so Payload writes the versions
 * table and does not unpublish the live main row.
 */
export function forceDraftData<T extends Record<string, unknown>>(
  data: T,
): T & {
  _status: "draft";
} {
  const stripped = stripSystemFields(data) as Record<string, unknown>;
  return { ...stripped, _status: "draft" } as T & { _status: "draft" };
}

/** Drop system / mass-assignment fields before upsert. */
export function stripSystemFields(value: unknown): unknown {
  return stripFields(value, STRIP_ON_INGEST);
}

function stripFields(value: unknown, keys: Set<string>): unknown {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => stripFields(v, keys));
  const obj = value as Record<string, unknown>;
  if (
    typeof obj.filename === "string" &&
    Object.keys(obj).every((k) => k === "filename" || k === "alt")
  ) {
    return obj;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keys.has(k)) continue;
    out[k] = stripFields(v, NESTED_STRIP_ON_INGEST);
  }
  return out;
}
