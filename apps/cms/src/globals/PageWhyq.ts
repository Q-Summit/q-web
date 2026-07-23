import type { Field, GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { section, seoFields } from "./shared-fields";

const audienceItemFields: Field[] = [
  { name: "title", type: "text", required: true },
  { name: "description", type: "textarea", required: true },
];

// Mirrors WhyqContent in apps/web/src/lib/content.ts 1:1. Each audience's
// photo is the only real image referenced by page copy (program/hackathon/
// etc have no hero/cta image fields), so it is the one upload relation here.
export const PageWhyq: GlobalConfig = pageGlobal({
  slug: "page-whyq",
  label: "Why Q?",
  path: "/whyq/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "intro", type: "textarea", required: true },
    {
      name: "audiences",
      type: "array",
      required: true,
      admin: {
        description:
          "One section per audience (attendees, startups, investors, partners, founders), in display order.",
      },
      fields: [
        {
          name: "anchorId",
          type: "text",
          required: true,
          admin: {
            description:
              'Anchor id, e.g. "attendees". Keep stable; other pages may link to it.',
          },
        },
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          name: "items",
          type: "array",
          admin: {
            description:
              "Optional highlight bullets (title + description) beside the photo.",
          },
          fields: audienceItemFields,
        },
        {
          name: "imageFile",
          type: "upload",
          relationTo: "media",
          required: true,
          admin: { description: "Section photo." },
        },
        {
          name: "imageAlt",
          type: "text",
          required: true,
          admin: {
            description:
              "Alt text for the section photo (kept separate from the media library's own alt).",
          },
        },
        {
          name: "imageLeft",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description:
              "Show the photo on the left (checked) or right (unchecked) of its text.",
          },
        },
      ],
    },
    section("Search and social", seoFields("whyq"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
