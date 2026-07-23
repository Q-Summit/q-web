// Stable upsert identity per collection (never numeric Payload ids across envs).

export const SYNC_COLLECTIONS = [
  "partners",
  "jobs",
  "speakers",
  "team",
  "past-teams",
  "faqs",
  "testimonials",
] as const;

export type SyncCollection = (typeof SYNC_COLLECTIONS)[number];

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
] as const;

export type SyncGlobal = (typeof SYNC_GLOBALS)[number];

/** Collections/globals that content-sync must never touch. */
export const SYNC_DENY = ["users", "legal"] as const;

/**
 * Every key field is required: a null/undefined value in the doc means the
 * doc cannot be matched (upsert error). Team once carried a nullable name for
 * nameless past-team year photos; those live in their own past-teams
 * collection now, keyed on year.
 */
export type UpsertKey =
  { kind: "field"; field: string } | { kind: "fields"; fields: string[] };

export const COLLECTION_KEYS: Record<SyncCollection, UpsertKey> = {
  partners: { kind: "field", field: "name" },
  jobs: { kind: "field", field: "slug" },
  speakers: { kind: "fields", fields: ["name", "group"] },
  team: { kind: "fields", fields: ["name", "year"] },
  "past-teams": { kind: "field", field: "year" },
  faqs: { kind: "fields", fields: ["question", "page"] },
  testimonials: { kind: "field", field: "attribution" },
};

export function isSyncCollection(slug: string): slug is SyncCollection {
  return (SYNC_COLLECTIONS as readonly string[]).includes(slug);
}

export function isSyncGlobal(slug: string): slug is SyncGlobal {
  return (SYNC_GLOBALS as readonly string[]).includes(slug);
}

export function isDeniedSlug(slug: string): boolean {
  return (SYNC_DENY as readonly string[]).includes(slug);
}
