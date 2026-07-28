import type { CollectionConfig } from "payload";

import { orderField } from "../lib/order-field";
import { enforceUniqueKey } from "../lib/unique-key";
import { draftCollection } from "./base";

// FAQ entries rendered as accordions on the home, program, and hackathon
// pages (source: site-mirror/extracted/faqs.json; the mirror's "index"
// page maps to "home" here). Concept and PR own the copy.
export const Faqs: CollectionConfig = draftCollection({
  slug: "faqs",
  divisions: ["concept", "pr"],
  useAsTitle: "question",
  defaultColumns: ["question", "page", "order"],
  defaultSort: ["page", "order"],
  description:
    "FAQ Q&As shown on Home, Program, and Hackathon. Owned by Concept + PR. " +
    "Pick the Page field so each question lands on the right accordion.",
  // Content-sync upsert identity is question+page (src/content-sync/keys.ts);
  // Payload has no native compound-unique field, so enforce it in a hook.
  beforeChangeHooks: [
    enforceUniqueKey({
      slug: "faqs",
      fields: ["question", "page"],
      entityLabel: "FAQ",
      titleField: "question",
    }),
  ],
  fields: [
    {
      name: "question",
      type: "text",
      required: true,
    },
    {
      name: "answer",
      type: "richText",
      required: true,
    },
    {
      name: "page",
      type: "select",
      required: true,
      options: [
        { label: "Home", value: "home" },
        { label: "Program", value: "program" },
        { label: "Hackathon", value: "hackathon" },
      ],
      admin: {
        position: "sidebar",
        description: "Which page's FAQ section this entry appears in.",
      },
    },
    orderField({
      collection: "faqs",
      scope: "within the page's FAQ list",
      required: true,
    }),
  ],
});
