import type { FieldHook } from "payload";

/**
 * beforeDuplicate hooks for the fields that identify a document. Without
 * these, the admin Duplicate button cannot succeed on most collections:
 * compound-key fields (speakers name+group, team name+year, faqs
 * question+page) are copied verbatim and rejected by enforceUniqueKey, and
 * Payload's built-in rename for `unique: true` fields appends " - Copy",
 * which fails the field's own validate regex on jobs.slug. Defining a hook
 * here replaces Payload's built-in one (it only installs when the field has
 * none).
 */

/** Free-text identity field (name, question): "Jane Doe (copy)". */
export const copyLabelOnDuplicate: FieldHook = ({ value }) =>
  typeof value === "string" && value.trim() !== "" ? `${value} (copy)` : value;

/** Kebab-case slug: "acme-working-student-copy" keeps the validate regex happy. */
export const copySlugOnDuplicate: FieldHook = ({ value }) =>
  typeof value === "string" && value.trim() !== "" ? `${value}-copy` : value;
