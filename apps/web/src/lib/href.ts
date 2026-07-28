/*
 * Internal-link normalization for the trailing-slash site.
 *
 * astro.config.mjs pins `trailingSlash: "always"`, and the emitted
 * canonical/OG/sitemap URLs are all trailing-slashed. Internal hrefs have to
 * match that exact form, or every internal navigation and hover-prefetch hits
 * a Cloudflare 308 redirect to the canonical URL before it resolves.
 *
 * Kept in its own module (no node:fs, unlike content.ts) so it can be unit
 * tested in the Workers test pool and reused by any consumer that builds a
 * root-relative href.
 */

/**
 * Append the trailing slash to a root-relative page path; leave everything
 * else untouched. Idempotent.
 *
 *  - Only our own root-relative links ("/...") are normalized. External,
 *    protocol-relative ("//host/..."), mailto:, tel:, and in-page ("#...")
 *    links are returned unchanged.
 *  - The bare "/" and an already-slashed path are returned as-is.
 *  - A file-like path whose last segment contains a dot (e.g. /llms.txt,
 *    /robots.txt, /media/hero-poster.jpg) is a file, not a page route, so it
 *    is left alone.
 *  - A query string or fragment is split off first, so the slash lands on the
 *    path and the ?query / #fragment is preserved on the far side
 *    (/contact?ref=x -> /contact/?ref=x, /whyq#audience -> /whyq/#audience).
 */
export function normalizeInternalHref(href: string): string {
  // Only our own root-relative links; "//host" is protocol-relative external.
  if (!href.startsWith("/") || href.startsWith("//")) return href;

  // Separate any query/fragment so the slash lands on the path, not after it.
  const suffixStart = href.search(/[?#]/);
  const path = suffixStart === -1 ? href : href.slice(0, suffixStart);
  const suffix = suffixStart === -1 ? "" : href.slice(suffixStart);

  // Bare root or already canonical.
  if (path === "/" || path.endsWith("/")) return href;

  // File-like last segment (has an extension): a file, not a page route.
  const lastSegment = path.slice(path.lastIndexOf("/") + 1);
  if (lastSegment.includes(".")) return href;

  return `${path}/${suffix}`;
}
