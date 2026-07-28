import type { CollectionSlug, NumberField } from "payload";

const HOW_TO_REORDER =
  "Lower numbers appear higher. Decimals are allowed (7.5 slots between 7 and 8), " +
  "so inserting never means renumbering. New entries land after the current last one.";

/**
 * Manual numeric sort position, shared by every ordered collection.
 *
 * Deliberately NOT Payload's `orderable: true` drag-and-drop: that stores
 * position in an internal `_order` column that content-sync packages do not
 * carry (ordering would silently stop round-tripping through pull/propose),
 * and the web mappers sort on numeric `order` (stableOrderCompare in
 * apps/web/src/lib/content.ts). The numeric field is the portable contract;
 * seeds space it in steps of 10 so editors can slot whole numbers between
 * neighbors without touching other docs.
 *
 * The default lands a new admin-created doc after the collection's current
 * last one (max order + 10) instead of piling every new doc at 0, where it
 * would jump to the top of the page. Seeds and content-sync packages always
 * send an explicit order, so the lookup only runs for admin-UI creates.
 */
export function orderField(opts: {
  collection: CollectionSlug;
  /** Scope note folded into the description, e.g. "within its tier". */
  scope?: string;
  required?: boolean;
}): NumberField {
  return {
    name: "order",
    type: "number",
    ...(opts.required ? { required: true } : {}),
    defaultValue: async ({ req }) => {
      if (!req?.payload) return 0;
      const last = await req.payload.find({
        collection: opts.collection,
        sort: "-order",
        limit: 1,
        depth: 0,
        draft: true,
        overrideAccess: true,
        select: { order: true },
      });
      const max = (last.docs[0] as { order?: number | null } | undefined)
        ?.order;
      return typeof max === "number" ? Math.floor(max) + 10 : 0;
    },
    admin: {
      position: "sidebar",
      description: `Sort position${opts.scope ? ` ${opts.scope}` : ""}, ascending. ${HOW_TO_REORDER}`,
    },
  };
}
