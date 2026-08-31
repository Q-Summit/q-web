/**
 * Maps Payload page globals → Astro routes for Live Preview iframes.
 * Keep in sync with apps/web `trailingSlash: "always"` routes.
 *
 * Local:  SITE_URL=http://localhost:4321  (Astro from `make dev`)
 * Prod:   SITE_URL=https://q-summit.com   (Vercel CMS env)
 *
 * The site client checks PUBLIC_CMS_URL (CMS origin) for postMessage:
 * Local:  http://localhost:3000
 * Prod:   https://cms.q-summit.de
 */
export const PATH_BY_GLOBAL: Record<string, string> = {
  "page-home": "/",
  "page-whyq": "/whyq/",
  "page-kickoff": "/kickoff/",
  "page-program": "/program/",
  "page-tickets": "/ticket-categories/",
  "page-contact": "/contact/",
  "page-hackathon": "/hackathon/",
  "page-our-team": "/our-team/",
  "page-past-teams": "/past-teams/",
  "page-partner": "/partner/",
  "page-speaker": "/speaker/",
  "page-jobs": "/job-listings/",
};

/** Globals that get the Live Preview iframe in admin. */
export const LIVE_PREVIEW_GLOBALS = Object.keys(PATH_BY_GLOBAL);

function siteOrigin(): string {
  // Prefer explicit SITE_URL; default to local Astro so `make dev` works
  // without extra config. Production must set SITE_URL on Vercel.
  return (process.env.SITE_URL ?? "http://localhost:4321").replace(/\/$/, "");
}

/**
 * Absolute Live Preview URL for a global slug (iframe + Preview button).
 */
export function livePreviewUrlForGlobal(
  slug: string | undefined,
): string | undefined {
  if (!slug) return undefined;
  const path = PATH_BY_GLOBAL[slug];
  if (!path) return undefined;
  // Query flag helps local debugging; the client also boots when iframed.
  return `${siteOrigin()}${path}?live-preview=1`;
}

/**
 * Public path a list-collection document renders on, for the admin Preview
 * button. Only collections with a stable public path are listed: faqs and
 * testimonials render inside another page's section with no address of their
 * own, so they get no Preview button rather than a misleading one.
 *
 * `jobs` is a function because each posting has its own URL; the rest render
 * as a section of one shared page.
 */
const PATH_BY_COLLECTION: Record<
  string,
  string | ((doc: Record<string, unknown>) => string | null)
> = {
  partners: "/partner/",
  speakers: "/speaker/",
  team: "/our-team/",
  "past-teams": "/past-teams/",
  jobs: (doc) =>
    typeof doc.slug === "string" && doc.slug
      ? `/job-listings/${doc.slug}/`
      : "/job-listings/",
};

/** Absolute preview URL for a list-collection document. */
export function previewUrlForCollection(
  slug: string,
  doc: Record<string, unknown>,
): string | null {
  const entry = PATH_BY_COLLECTION[slug];
  if (!entry) return null;
  const path = typeof entry === "function" ? entry(doc) : entry;
  return path ? `${siteOrigin()}${path}` : null;
}
