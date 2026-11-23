/*
 * Search-result helpers: the schema.org BreadcrumbList a page carries so
 * Google can show its trail ("q-summit.com › Students & Young Pros")
 * instead of the bare URL. Every name is one the page already shows.
 *
 * Pure (no node:fs, no astro imports), so it is unit tested.
 */

export interface Crumb {
  name: string;
  /** Site-relative, trailing-slashed path ("/whyq/students/"). */
  path: string;
}

/** BreadcrumbList with absolute item URLs, against `site`. */
export function breadcrumbLd(
  site: URL | string | undefined,
  crumbs: readonly Crumb[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: new URL(crumb.path, site).href,
    })),
  };
}
