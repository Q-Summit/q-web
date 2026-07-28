import type { CollectionConfig } from "payload";

import { orderField } from "../lib/order-field";
import { urlOrMailtoValidate } from "../lib/url-validate";
import { draftCollection } from "./base";

// Schema derived from site-mirror/extracted/partners.json (name, tier,
// websiteUrl, logo). Tier values mirror the Webflow partner categories one
// to one. Testimonials live in the standalone Testimonials collection (see
// Testimonials.ts), not here: a testimonial's company does not always
// correspond to an existing partner record.
export const Partners: CollectionConfig = draftCollection({
  slug: "partners",
  divisions: ["partner"],
  useAsTitle: "name",
  // No "logo" column on purpose. Payload only renders a thumbnail cell for the
  // `filename` field of an upload collection (see Media.ts); an upload FIELD on
  // another collection falls back to a relationship cell, which renders the
  // useless literal "<No Logo>". The logo is previewed large on the document
  // itself (.qs-logo-field) and can be browsed in the media library instead.
  defaultColumns: ["name", "tier", "websiteUrl", "order"],
  listSearchableFields: ["name", "websiteUrl"],
  defaultSort: ["tier", "order"],
  description:
    "Partner companies and logos (used on / and /partner/). Owned by Partner. " +
    "Page chrome for /partner/ is under Website pages → Partners.",
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          unique: true,
          admin: {
            width: "50%",
            description:
              "The company name exactly as it should read on the site. Two partners cannot share a name.",
          },
        },
        {
          name: "websiteUrl",
          type: "text",
          required: true,
          admin: {
            width: "50%",
            placeholder: "https://example.com",
            description:
              'Full address including https://. Use "#" if the partner has no website.',
          },
          validate: urlOrMailtoValidate({
            allowHashPlaceholder: true,
            optional: true,
          }),
        },
      ],
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      required: true,
      admin: {
        className: "qs-logo-field",
        sortOptions: "-createdAt",
        description:
          "Company logo. Prefer SVG, otherwise a PNG or WebP with a transparent background.",
      },
      // Partner logos are flat marks and lettering. A photo here is always a mistake, and
      // narrowing the picker is cheaper than catching it in review.
      filterOptions: () => ({
        mimeType: { in: ["image/svg+xml", "image/png", "image/webp"] },
      }),
    },
    {
      name: "tier",
      type: "select",
      required: true,
      admin: {
        position: "sidebar",
        description:
          "Sponsorship level. Platinum logos are the largest and sit at the top of /partner/; Media logos are the smallest and sit last.",
      },
      options: [
        { label: "Platinum", value: "platinum" },
        { label: "Gold", value: "gold" },
        { label: "Silver", value: "silver" },
        { label: "Starter", value: "starter" },
        { label: "Knowledge", value: "knowledge" },
        { label: "Event", value: "event" },
        { label: "Mobility", value: "mobility" },
        { label: "University and Network", value: "university-and-network" },
        { label: "Media", value: "media" },
      ],
    },
    orderField({ collection: "partners", scope: "within its tier" }),
  ],
});
