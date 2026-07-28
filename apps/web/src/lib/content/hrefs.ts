/**
 * Deep href normalization for content trees.
 */
import { normalizeInternalHref } from "../href";

export function normalizeHrefsDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeHrefsDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      out[key] =
        typeof entry === "string" && key.toLowerCase().endsWith("href")
          ? normalizeInternalHref(entry)
          : normalizeHrefsDeep(entry);
    }
    return out as unknown as T;
  }
  return value;
}
