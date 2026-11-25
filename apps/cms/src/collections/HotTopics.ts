import type { CollectionConfig } from "payload";

import { orderField } from "../lib/order-field";
import { draftCollection } from "./base";

// The three hot topics at the top of /speaker/ (one sphere card each,
// stepped through by arrows). A list, not an array on page-speaker, so each
// topic drafts and publishes on its own and the next edition's topics can be
// swapped one by one. Same owners as the Speakers page global.
export const HotTopics: CollectionConfig = draftCollection({
  slug: "hot-topics",
  divisions: ["pr", "concept"],
  useAsTitle: "keyword",
  defaultColumns: ["keyword", "title", "field", "order"],
  listSearchableFields: ["keyword", "title", "field"],
  defaultSort: "order",
  labels: { singular: "Hot topic", plural: "Hot topics" },
  description:
    "The hot topics at the top of the speakers page (/speaker/), shown one at a time. Owned by PR + Concept.",
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "keyword",
          type: "text",
          required: true,
          // Content-sync upsert identity (src/content-sync/keys.ts).
          unique: true,
          admin: {
            width: "50%",
            placeholder: "SPACE",
            description:
              "One word in capitals, set very large on the card. Each topic needs a different one.",
          },
        },
        {
          name: "title",
          type: "text",
          required: true,
          admin: {
            width: "50%",
            placeholder: "Scaling to orbit",
            description: "Short title under the keyword.",
          },
        },
      ],
    },
    {
      name: "field",
      type: "text",
      required: true,
      admin: {
        placeholder: "Aviation, aerospace & defense",
        description: "The industries the topic covers, shown under the title.",
      },
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      admin: {
        description: "Two to three sentences, about 250 characters.",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: {
            width: "50%",
            sortOptions: "-createdAt",
            description:
              "The sphere: a square image with a transparent background.",
          },
        },
        {
          name: "thumb",
          type: "upload",
          relationTo: "media",
          admin: {
            width: "50%",
            sortOptions: "-createdAt",
            description:
              "Optional. A square close-up cropped to the ball, without anything around it; it fills the small round button. Leave empty to use a zoomed-in sphere.",
          },
        },
      ],
    },
    orderField({ collection: "hot-topics" }),
  ],
});
