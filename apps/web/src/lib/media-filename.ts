/*
 * Build-time media filename helpers: CMS photoFilename → /media/ object key.
 * Prefer locally mirrored -p-* variants; in prod/CI (empty public/media/)
 * prefer the sized R2 key so we never emit multi-MB unsuffixed originals.
 */

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const MEDIA_DIR = fileURLToPath(
  new URL("../../public/media/", import.meta.url),
);

/** CI fixture sentinels (`fixture-missing-*.webp`): skip missing-file warnings. */
export function isFixtureMediaSentinel(filename: string): boolean {
  return filename.startsWith("fixture-missing-");
}

/** ASCII-fold then safe chars only (matches media sync). */
export function sanitize(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._-]/g, "-");
}

/** Strip an existing `-p-<size>` before splicing a new suffix. */
export function stripExistingSizeSuffix(filename: string): string {
  return filename.replace(/-p-\d+(?=\.[a-zA-Z0-9]+$)/, "");
}

export function variant(photoFilename: string, suffix: string): string {
  const base = stripExistingSizeSuffix(photoFilename);
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : "";
  return sanitize(`${stem}${suffix}${ext}`);
}

/** First suffix under MEDIA_DIR that exists, or undefined. */
export function probeVariant(
  photoFilename: string,
  suffixes: readonly string[],
): string | undefined {
  for (const suffix of suffixes) {
    const candidate = variant(photoFilename, suffix);
    if (existsSync(`${MEDIA_DIR}${candidate}`)) {
      return candidate;
    }
  }
  return undefined;
}

/**
 * Object key for `/media/…`. Local mirror wins; otherwise `-p-800` (or keep
 * an already-sized filename).
 */
export function resolvePhotoMediaKey(
  photoFilename: string,
  suffixes: readonly string[] = ["-p-800", "-p-500", ""],
): string {
  const found = probeVariant(photoFilename, suffixes);
  if (found) return found;
  const cleaned = sanitize(photoFilename);
  if (/-p-\d+\./.test(cleaned)) return cleaned;
  return variant(photoFilename, "-p-800");
}

export function photoSrc(photoFilename: string): string {
  return `/media/${resolvePhotoMediaKey(photoFilename)}`;
}
