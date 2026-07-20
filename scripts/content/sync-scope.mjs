// Keep in sync with apps/cms/src/content-sync/keys.ts (cms tests enforce parity).
export const SYNC_COLLECTIONS = [
  "partners",
  "jobs",
  "speakers",
  "team",
  "past-teams",
  "faqs",
  "testimonials",
];

export const SYNC_GLOBALS = [
  "site-settings",
  "page-home",
  "page-whyq",
  "page-program",
  "page-tickets",
  "page-contact",
  "page-hackathon",
  "page-our-team",
  "page-past-teams",
  "page-partner",
  "page-speaker",
  "page-jobs",
];

export const SYNC_DENY = ["users", "legal"];

/**
 * Apply endpoint cap: total collection docs + globals per package. Producers
 * warn above this so propose failures are predictable; scope with
 * --collections / --globals. Parity with MAX_DOCS in
 * apps/cms/src/content-sync/apply-package.ts is test-enforced.
 */
export const MAX_PACKAGE_DOCS = 200;

/** Default working directory for pull / package / propose (one path for agents). */
export const DEFAULT_PACKAGE_DIR = "scripts/content-packages/current";
