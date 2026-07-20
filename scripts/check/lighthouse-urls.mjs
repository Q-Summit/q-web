/** Shared URL defaults for the local Lighthouse loop (no heavy deps). */

export const DEFAULT_LIGHTHOUSE_URLS = ["/", "/speaker/", "/our-team/"];

/**
 * @param {string | undefined | null} raw
 * @returns {string[]}
 */
export function parseLighthouseUrls(raw) {
  if (!raw || !raw.trim()) return [...DEFAULT_LIGHTHOUSE_URLS];
  return raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => (u.startsWith("/") ? u : `/${u}`));
}
