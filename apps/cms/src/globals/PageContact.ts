import type { Field, GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import {
  groupSection,
  section,
  seoFields,
  stringArrayField,
} from "./shared-fields";

const boardMemberFields: Field[] = [
  { name: "name", type: "text", required: true },
  { name: "role", type: "text", required: true },
  { name: "email", type: "email", required: true },
  {
    name: "linkLabel",
    type: "text",
    required: true,
    admin: { description: 'e.g. "Send E-Mail".' },
  },
];

const contactItemFields: Field[] = [
  { name: "label", type: "text", required: true },
  {
    name: "email",
    type: "email",
    admin: {
      description: "Optional; leave empty for a postal-address-only entry.",
    },
  },
  stringArrayField("details", { label: "Detail line", required: true }),
];

// Mirrors ContactContent in apps/web/src/lib/content.ts 1:1.
export const PageContact: GlobalConfig = pageGlobal({
  slug: "page-contact",
  label: "Contact",
  path: "/contact/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    groupSection({
      label: "Board members",
      name: "board",
      open: true,
      description: "Board members section.",
      fields: [
        { name: "heading", type: "text", required: true },
        stringArrayField("paragraphs", { label: "Paragraph", required: true }),
        {
          name: "members",
          type: "array",
          required: true,
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: boardMemberFields,
        },
      ],
    }),
    groupSection({
      label: "Reach out",
      name: "reachOut",
      description: "General contact channels section.",
      fields: [
        { name: "heading", type: "text", required: true },
        stringArrayField("paragraphs", { label: "Paragraph", required: true }),
        {
          name: "items",
          type: "array",
          required: true,
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: contactItemFields,
        },
      ],
    }),
    section("Search and social", seoFields("contact"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
