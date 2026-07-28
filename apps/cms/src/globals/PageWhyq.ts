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
          // Optional so fixture seed / fresh clones work without gitignored
          // media binaries; the site falls back to /media/whyq-<anchorId>
          // until a real upload exists (docs/dev/local-development.md).
          required: false,
          admin: {
            description:
              "Section photo. Leave empty until the asset is in the Media library; the page still renders using the convention /media/whyq-<anchor>.",
          },
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
