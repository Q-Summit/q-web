/*
 * Helpers shared by the job board components.
 *
 * Company logos are copied verbatim from the site mirror into
 * public/media/ (gitignored); some Webflow filenames contain spaces or
 * parentheses, so the URL path segment must be encoded.
 */

import type { JobWorkload } from "../../lib/content";

export function logoSrc(filename: string): string {
  return `/media/${encodeURIComponent(filename)}`;
}

/** Stable kebab-case token used by the CSS-only workload filter. */
export function workloadSlug(workload: JobWorkload): string {
  return workload.toLowerCase().replace(/\s+/g, "-");
}
