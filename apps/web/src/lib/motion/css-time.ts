/**
 * Read a CSS time value (a duration token, DESIGN.md MOTION-1) as
 * milliseconds.
 *
 * The production build minifies CSS times (`150ms` becomes `.15s`), while
 * the dev server keeps them as written, so a plain parseFloat reads 0.15
 * in production and 150 in dev. Every script that times itself from a
 * token goes through this (see ./time.ts). DOM-free, so it is unit tested.
 */
export function cssTimeMs(value: string, fallback: number): number {
  const v = value.trim();
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return fallback;
  if (v.endsWith("ms")) return n;
  if (v.endsWith("s")) return n * 1000;
  return fallback;
}
