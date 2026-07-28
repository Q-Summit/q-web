import type { CollectionConfig } from "payload";

import { orderField } from "../lib/order-field";
import { draftCollection } from "./base";

// Partner-page testimonial quotes. Schema derived from
// site-mirror/extracted/partner-testimonials.json (quote, attribution,
// photoFilename). Standalone collection, not an array field on Partners:
// testimonial subjects (e.g. Speedinvest, Scalable Capital, 1Komma5°) do
// not always correspond 1:1 to an existing Partners doc, so nesting them
// there silently dropped any testimonial whose company had no matching
// partner record. Partner division owns the copy, same as Partners.
export const Testimonials: CollectionConfig = draftCollection({
  slug: "testimonials",
  divisions: ["partner"],
  useAsTitle: "attribution",
  defaultColumns: ["attribution", "quote", "order"],
  listSearchableFields: ["attribution", "quote"],
  defaultSort: "order",
  description: "Quotes on the partners page (/partner/). Owned by Partner.",
  fields: [
    {
      name: "quote",
      type: "textarea",
      required: true,
    },
    {
      name: "attribution",
      type: "text",
      required: true,
      unique: true,
      admin: {
        placeholder: "Jane Doe, Example GmbH",
        description:
          "Person and company, e.g. Jane Doe, Example GmbH. Each quote needs a different one.",
      },
    },
    {
      name: "photo",
      type: "upload",
      relationTo: "media",
      admin: {
        className: "qs-portrait-field",
        sortOptions: "-createdAt",
        description: "Optional small portrait shown next to the quote.",
      },
    },
    orderField({ collection: "testimonials" }),
  ],
});
