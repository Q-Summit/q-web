/*
 * The audience pages under /whyq/<audience>/ (pages/whyq/[audience].astro).
 *
 * Together they are "Why Q?": there is no overview page any more (/whyq/
 * redirects to the audience tiles on the home page). They are provisional:
 * each one shows its audience's section of the page-whyq content on a
 * route of its own. The registry below is the one place that knows which routes
 * exist and which `whyq.audiences[].id` each one shows; the page, the llms
 * route table (lib/llms.ts) and the tests all read it.
 *
 * Pure (no node:fs, no astro imports), so it is unit tested.
 */
import type { NavLink } from "./content/site-settings";
import { normalizeInternalHref } from "./href";

export interface WhyqAudiencePage {
  /** URL segment: the page lives at /whyq/<slug>/. */
  slug: string;
  /** `whyq.audiences[].id` of the section this page shows. */
  audienceId: string;
}

export const WHYQ_AUDIENCE_PAGES: readonly WhyqAudiencePage[] = [
  { slug: "students", audienceId: "attendees" },
  { slug: "startups", audienceId: "startups" },
  { slug: "corporates", audienceId: "partners" },
  { slug: "investors", audienceId: "investors" },
];

/** Canonical (trailing-slash) path of an audience page. */
export function whyqAudiencePath(slug: string): string {
  return `/whyq/${slug}/`;
}

/** Neutral name for a page no nav entry names: "students" -> "Students". */
export function defaultAudienceLabel(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export interface WhyqAudienceNames {
  /** The audience's name: the nav child's label, else the capitalized slug. */
  label: string;
  /** Label of the nav item the page belongs to ("Why Q?"), when there is one. */
  parentLabel?: string;
}

/**
 * Names for one audience page, read from the site-settings nav so they are
 * editor-owned: the label of the submenu entry whose href is this route, and
 * the label of its parent item. Without a submenu entry (a nav that has no
 * children yet) the name falls back to the capitalized slug, and the parent
 * label to the nav item that links to /whyq/ itself, if any.
 */
export function whyqAudienceNames(
  slug: string,
  nav: readonly NavLink[],
): WhyqAudienceNames {
  const path = whyqAudiencePath(slug);
  for (const item of nav) {
    const child = (item.children ?? []).find(
      (entry) => normalizeInternalHref(entry.href) === path,
    );
    if (child) return { label: child.label, parentLabel: item.label };
  }
  const whyq = nav.find(
    (item) => normalizeInternalHref(item.href) === "/whyq/",
  );
  return { label: defaultAudienceLabel(slug), parentLabel: whyq?.label };
}
