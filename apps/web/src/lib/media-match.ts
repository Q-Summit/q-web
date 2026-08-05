/**
 * Shared filename matching for build-time media resolvers
 * (astro:assets index + public/media mirror). Keep rules in one place.
 */

/** Strip Webflow-style `-p-<n>` and bare `-(500|800|1080|1600)` size suffixes. */
export function stripSizeSuffix(filename: string): string {
  return filename
    .replace(/-p-\d+(?=\.[a-zA-Z0-9]+$)/, "")
    .replace(/-(?:500|800|1080|1600)(?=\.[a-zA-Z0-9]+$)/, "");
}

/** Lowercase, drop extension/separators, fold diacritics (NFKD). */
export function normalizeLooseFilename(filename: string): string {
  return filename
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_ ()]+/g, "");
}

/**
 * Match `requested` against `candidates` (exact → stripped → normalized →
 * substring). Returns the winning candidate filename, or undefined.
 */
export function matchMediaFilename(
  requested: string,
  candidates: readonly string[],
):
  | { file: string; kind: "exact" | "stripped" | "normalized" | "substring" }
  | undefined {
  const exact = new Set(candidates);
  if (exact.has(requested)) return { file: requested, kind: "exact" };

  const byStripped = new Map<string, string>();
  for (const file of candidates) {
    const stripped = stripSizeSuffix(file);
    if (!byStripped.has(stripped)) byStripped.set(stripped, file);
  }

  const strippedReq = stripSizeSuffix(requested);
  const viaStripped = exact.has(strippedReq)
    ? strippedReq
    : (byStripped.get(requested) ?? byStripped.get(strippedReq));
  if (viaStripped) return { file: viaStripped, kind: "stripped" };

  const byNormalized = new Map<string, string>();
  for (const file of candidates) {
    for (const name of new Set([file, stripSizeSuffix(file)])) {
      const n = normalizeLooseFilename(name);
      if (!byNormalized.has(n)) byNormalized.set(n, file);
    }
  }

  const target = normalizeLooseFilename(requested);
  const exactNorm = byNormalized.get(target);
  if (exactNorm) return { file: exactNorm, kind: "normalized" };

  for (const [candidateNormalized, file] of byNormalized) {
    if (
      candidateNormalized.includes(target) ||
      target.includes(candidateNormalized)
    ) {
      return { file, kind: "substring" };
    }
  }
  return undefined;
}
