import type {
  CollectionBeforeChangeHook,
  CollectionSlug,
  Where,
} from "payload";
import { ValidationError } from "payload";

/**
 * content-sync's upsert identity for some collections spans two fields (see
 * src/content-sync/keys.ts: speakers name+group, team name+year, faqs
 * question+page), which Payload cannot express as a single-field
 * `unique: true`. Without enforcement, an editor can create two docs with the
 * same key through the ordinary admin UI; applyContentPackage's `find …
 * limit: 1` upsert then matches an arbitrary one of the two, silently
 * leaving the sibling stale.
 *
 * This factory builds a beforeChange hook that rejects a create/update whose
 * key fields collide with a DIFFERENT existing document, naming the
 * conflicting doc so the editor can go fix it. Single-field keys
 * (partners.name, testimonials.attribution, past-teams.year) use Payload's
 * native `unique: true` instead; see those collections.
 */
export function enforceUniqueKey(opts: {
  /** Collection slug this hook is attached to (must match). */
  slug: CollectionSlug;
  /** Key field names forming the compound identity, in display order. */
  fields: string[];
  /** Singular noun for the error message, e.g. "speaker", "team member", "FAQ". */
  entityLabel: string;
  /** Field used to name the conflicting doc in the error; falls back to its id. */
  titleField?: string;
}): CollectionBeforeChangeHook {
  return async ({ data, originalDoc, req }) => {
    const values = opts.fields.map((field) => {
      const incoming = (data as Record<string, unknown>)[field];
      return incoming !== undefined
        ? incoming
        : (originalDoc as Record<string, unknown> | undefined)?.[field];
    });
    // A missing key field is a required-field validation error elsewhere;
    // do not also throw a confusing duplicate error here.
    if (values.some((v) => v === undefined || v === null || v === "")) {
      return data;
    }

    const clauses: Where[] = opts.fields.map((field, i) => ({
      [field]: { equals: values[i] },
    }));
    const currentId = (originalDoc as { id?: unknown } | undefined)?.id;
    if (currentId !== undefined) {
      clauses.push({ id: { not_equals: currentId } });
    }

    // Tolerate drafts on both sides: a duplicate proposed as a draft is just
    // as much a content-sync hazard as a published one, and content-sync
    // itself always upserts with draft: true.
    const found = await req.payload.find({
      collection: opts.slug,
      where: { and: clauses },
      limit: 1,
      draft: true,
      depth: 0,
      overrideAccess: true,
    });

    const conflict = found.docs[0] as unknown as
      Record<string, unknown> | undefined;
    if (conflict) {
      const conflictLabel = opts.titleField
        ? String(conflict[opts.titleField] ?? conflict.id)
        : String(conflict.id);
      const keyDescription = opts.fields
        .map((field, i) => `${field} "${String(values[i])}"`)
        .join(" + ");
      const message =
        `Another ${opts.entityLabel} ("${conflictLabel}") already has ${keyDescription}. ` +
        "Edit that entry instead of creating a duplicate, or change one of the key fields.";
      // ValidationError (not APIError) so the admin UI pins the message to
      // the key fields inline, matching how native `unique: true` collisions
      // surface on single-field-key collections (partners.name, jobs.slug).
      throw new ValidationError({
        collection: opts.slug,
        errors: opts.fields.map((field) => ({ message, path: field })),
      });
    }

    return data;
  };
}
