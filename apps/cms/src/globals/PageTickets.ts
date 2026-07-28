import type { ArrayFieldValidation, Field, GlobalConfig } from "payload";

import { urlOrMailtoValidate } from "../lib/url-validate";
import { pageGlobal } from "./base";
import {
  groupSection,
  section,
  seoFields,
  stringArrayField,
} from "./shared-fields";

// Collapsed rows with a real label, so a table of ticket tiers is not six
// rows reading "Item 01".
const ARRAY_ADMIN = {
  initCollapsed: true,
  components: { RowLabel: "/components/array-row-label#TitleRowLabel" },
} as const;

// Mirrors TicketCategoriesContent in apps/web/src/lib/content.ts 1:1.
// PricingComparisonGroup.rows[].included is a boolean[] positionally
// aligned with comparison.tiers; Payload has no primitive boolean-array
// field, so each row's `included` is modeled as an array of single-checkbox
// rows in the same tier order (seed/content.ts map index <-> tier index).
const includedArrayField: Field = {
  name: "included",
  type: "array",
  required: true,
  admin: {
    description:
      "One row per comparison tier, in the same order as comparison.tiers above. Check = included.",
  },
  fields: [{ name: "value", type: "checkbox", defaultValue: false }],
};

const ticketTierFields: Field[] = [
  { name: "name", type: "text", required: true },
  {
    name: "price",
    type: "text",
    required: true,
    admin: { description: 'e.g. "74€".' },
  },
  stringArrayField("features", { label: "Feature", required: true }),
  {
    name: "note",
    type: "text",
    admin: { description: 'Optional footnote, e.g. "Student ID required".' },
  },
  { name: "buyLabel", type: "text", required: true },
  {
    name: "buyHref",
    type: "text",
    required: true,
    admin: {
      description: "Ticket purchase link, e.g. the Vivenu checkout URL.",
    },
    validate: urlOrMailtoValidate(),
  },
];

const comparisonTierFields: Field[] = [
  { name: "name", type: "text", required: true },
  { name: "price", type: "text", required: true },
  { name: "audience", type: "text", required: true },
];

// Each row's `included` array is rendered positionally against
// comparison.tiers (one <td> per tier, no column headers repeated per row);
// PricingComparisonTable.astro has no way to tell a short row apart from a
// misaligned one, so mismatched lengths silently shift columns under the
// wrong tier headers with no build error. Guard it here instead.
export const validateRowsMatchTierCount: ArrayFieldValidation = (
  value,
  { siblingData },
) => {
  const tiersCount = Array.isArray(
    (siblingData as { tiers?: unknown[] })?.tiers,
  )
    ? (siblingData as { tiers: unknown[] }).tiers.length
    : 0;
  if (tiersCount === 0) return true; // tiers' own `required` validation covers the empty case

  const groups = (value ?? []) as {
    group?: string;
    rows?: { feature?: string; included?: unknown[] }[];
  }[];
  for (const group of groups) {
    for (const row of group.rows ?? []) {
      const includedCount = Array.isArray(row.included)
        ? row.included.length
        : 0;
      if (includedCount !== tiersCount) {
        return (
          `"${row.feature ?? "row"}" in "${group.group ?? "group"}" has ${includedCount} included ` +
          `checkboxes but there are ${tiersCount} tiers. Add or remove included rows so every row ` +
          "matches comparison.tiers, in the same order."
        );
      }
    }
  }
  return true;
};

const comparisonGroupFields: Field[] = [
  {
    name: "group",
    type: "text",
    required: true,
    admin: { description: "Section heading in the table." },
  },
  {
    name: "rows",
    type: "array",
    required: true,
    fields: [
      { name: "feature", type: "text", required: true },
      includedArrayField,
    ],
  },
];

const ticketCategoryFields: Field[] = [
  {
    name: "label",
    type: "text",
    required: true,
    admin: { description: 'e.g. "Student Ticket: 74€".' },
  },
  stringArrayField("bullets", { label: "Bullet", required: true }),
];

export const PageTickets: GlobalConfig = pageGlobal({
  slug: "page-tickets",
  label: "Tickets",
  path: "/ticket-categories/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    groupSection({
      label: "Ticket options",
      name: "tiers",
      open: true,
      description: "Ticket option cards.",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          name: "items",
          type: "array",
          required: true,
          admin: ARRAY_ADMIN,
          fields: ticketTierFields,
        },
      ],
    }),
    groupSection({
      label: "Comparison table",
      name: "comparison",
      description: "Pricing comparison table.",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          name: "tiers",
          type: "array",
          required: true,
          admin: {
            ...ARRAY_ADMIN,
            description: "Table column headers, in display order.",
          },
          fields: comparisonTierFields,
        },
        {
          name: "groups",
          type: "array",
          required: true,
          admin: ARRAY_ADMIN,
          fields: comparisonGroupFields,
          validate: validateRowsMatchTierCount,
        },
        {
          name: "academicNote",
          type: "textarea",
          required: true,
          admin: {
            description:
              "Footnote below the table, e.g. On-Conference variations.",
          },
        },
      ],
    }),
    groupSection({
      label: "Ticket explanations",
      name: "categories",
      description: "Detailed per-ticket explanation section.",
      fields: [
        { name: "heading", type: "text", required: true },
        {
          name: "items",
          type: "array",
          required: true,
          admin: ARRAY_ADMIN,
          fields: ticketCategoryFields,
        },
      ],
    }),
    section("Search and social", seoFields("ticket categories"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
