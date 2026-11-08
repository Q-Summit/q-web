import type {
  ArrayFieldValidation,
  Field,
  GlobalConfig,
  TextFieldSingleValidation,
} from "payload";

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

/*
 * Ticket categories (2027 onwards).
 *
 * Mirrors TICKET_KEYS in apps/web/src/lib/content/pages.ts 1:1. The key is a
 * registry value, not copy: the site uses it to tie one ticket's card, its
 * "What's included" panel and its compare column together, and each benefit
 * row names the tickets it applies to by key. Editors rename a ticket via its
 * `name`; a new category needs a code change on both sides.
 */
export const TICKET_KEYS = [
  { label: "Student", value: "student" },
  { label: "Young Professional", value: "young-professional" },
  { label: "Start-Up", value: "start-up" },
  { label: "Investor", value: "investor" },
  { label: "Corporate", value: "corporate" },
] as const;

/*
 * The 2026 model (tiers / comparison / categories below) stays in the
 * database as an archive: content is modeled per edition and past editions
 * are never overwritten (apps/cms AGENTS.md). The site no longer reads it.
 * The 2027 groups are additive, so the migration only adds nullable columns
 * and tables and the live 2026 page keeps building until the 2027 copy is
 * published.
 */

// PricingComparisonGroup.rows[].included (2026) is a boolean[] positionally
// aligned with comparison.tiers; Payload has no primitive boolean-array
// field, so each row's `included` is modeled as an array of single-checkbox
// rows in the same tier order (seed/content.ts map index <-> tier index).
const includedArrayField: Field = {
  name: "included",
  type: "array",
  admin: {
    description:
      "One row per comparison tier, in the same order as comparison.tiers above. Check = included.",
  },
  fields: [{ name: "value", type: "checkbox", defaultValue: false }],
};

const ticketTierFields: Field[] = [
  { name: "name", type: "text" },
  {
    name: "price",
    type: "text",
    admin: { description: 'e.g. "74€".' },
  },
  stringArrayField("features", { label: "Feature" }),
  {
    name: "note",
    type: "text",
    admin: { description: 'Optional footnote, e.g. "Student ID required".' },
  },
  { name: "buyLabel", type: "text" },
  {
    name: "buyHref",
    type: "text",
    admin: {
      description: "Ticket purchase link, e.g. the Vivenu checkout URL.",
    },
    validate: urlOrMailtoValidate({ optional: true }),
  },
];

const comparisonTierFields: Field[] = [
  { name: "name", type: "text" },
  { name: "price", type: "text" },
  { name: "audience", type: "text" },
];

// Each 2026 row's `included` array was rendered positionally against
// comparison.tiers, so mismatched lengths silently shifted columns. The
// archive keeps the guard so an edit to it cannot store a misaligned table.
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
    admin: { description: "Section heading in the table." },
  },
  {
    name: "rows",
    type: "array",
    fields: [{ name: "feature", type: "text" }, includedArrayField],
  },
];

const ticketCategoryFields: Field[] = [
  {
    name: "label",
    type: "text",
    admin: { description: 'e.g. "Student Ticket: 74€".' },
  },
  stringArrayField("bullets", { label: "Bullet" }),
];

/* --- 2027 model --- */

/** Every ticket key appears at most once, so card, panel and compare agree. */
export const validateUniqueTicketKeys: ArrayFieldValidation = (value) => {
  const rows = (value ?? []) as { key?: string | null; name?: string }[];
  if (rows.length < 2) {
    return "Add at least two tickets, so visitors have something to compare.";
  }
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.key) continue; // the key's own `required` covers it
    if (seen.has(row.key)) {
      return `"${row.name ?? row.key}" uses a ticket category that another ticket already uses. Each category may appear once.`;
    }
    seen.add(row.key);
  }
  return true;
};

/** A label that must keep a {placeholder} the site fills in. */
export function requirePlaceholders(
  ...placeholders: string[]
): TextFieldSingleValidation {
  return (value) => {
    if (typeof value !== "string" || !value.trim()) return "Required.";
    const missing = placeholders.filter((p) => !value.includes(`{${p}}`));
    return missing.length === 0
      ? true
      : `Keep ${missing.map((p) => `{${p}}`).join(" and ")} in the text; the site replaces it.`;
  };
}

const euroField = (
  name: string,
  label: string,
  description: string,
): Field => ({
  name,
  label,
  type: "number",
  required: true,
  min: 0,
  admin: { description, step: 1 },
});

const offerTicketFields: Field[] = [
  {
    name: "key",
    type: "select",
    required: true,
    options: [...TICKET_KEYS],
    admin: {
      description:
        "Which ticket category this is. Links the card to its benefits and the compare view.",
    },
  },
  {
    name: "name",
    type: "text",
    required: true,
    admin: { description: 'Card title, e.g. "Student".' },
  },
  {
    name: "description",
    type: "text",
    required: true,
    admin: { description: 'e.g. "For currently enrolled students".' },
  },
  euroField(
    "regularPrice",
    "Regular price",
    "Regular price in euros, shown struck through. Whole euros, e.g. 79.",
  ),
  euroField(
    "price",
    "Price",
    "Current (Early Bird) price in euros. The saving is worked out from both prices.",
  ),
  stringArrayField("highlights", {
    label: "Highlight",
    required: true,
    description:
      "Up to five short lines on the ticket card. The full list lives under What's included.",
  }),
  {
    name: "note",
    label: "Requirement",
    type: "text",
    admin: {
      description:
        'Optional requirement shown on the card above the buy button, e.g. "Valid student ID required".',
    },
  },
];

const benefitGroupFields: Field[] = [
  {
    name: "heading",
    type: "text",
    required: true,
    admin: { description: 'e.g. "Core access & event experience".' },
  },
  {
    name: "kind",
    type: "select",
    required: true,
    defaultValue: "benefit",
    options: [
      { label: "Benefits (Included / Not included)", value: "benefit" },
      { label: "Requirements (Required / Not required)", value: "eligibility" },
    ],
    admin: {
      description:
        "Requirements are not counted as benefits in the ticket summary.",
    },
  },
  {
    name: "rows",
    type: "array",
    required: true,
    admin: ARRAY_ADMIN,
    fields: [
      { name: "label", type: "text", required: true },
      {
        name: "tickets",
        type: "select",
        hasMany: true,
        options: [...TICKET_KEYS],
        admin: {
          description:
            "Tickets this benefit is included in (or, for a requirement, the tickets that require it). Leave empty for none.",
        },
      },
    ],
  },
];

export const PageTickets: GlobalConfig = pageGlobal({
  slug: "page-tickets",
  label: "Tickets",
  path: "/ticket-categories/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    groupSection({
      label: "Header",
      name: "hero",
      open: true,
      description: "Top of the page, above the ticket cards.",
      fields: [
        {
          name: "eyebrow",
          type: "text",
          required: true,
          admin: { description: 'Small label, e.g. "Early Bird · 30% off".' },
        },
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          name: "compareLabel",
          type: "text",
          required: true,
          admin: {
            description: 'Link to the compare view, e.g. "Compare tickets".',
          },
        },
      ],
    }),
    groupSection({
      label: "Tickets",
      name: "offer",
      description:
        "Ticket cards. Prices and benefits here also fill What's included and Compare tickets.",
      fields: [
        {
          name: "purchaseHref",
          label: "Ticket shop link",
          type: "text",
          required: true,
          admin: {
            description:
              "Ticket shop link. Every buy button on the page opens exactly this address.",
          },
          validate: urlOrMailtoValidate(),
        },
        {
          name: "buyLabel",
          type: "text",
          required: true,
          admin: { description: 'Buy button on the cards, e.g. "Buy now".' },
        },
        {
          name: "detailsLabel",
          type: "text",
          required: true,
          admin: {
            description:
              'Card link to the full benefit list, e.g. "All benefits".',
          },
        },
        {
          name: "saveLabel",
          type: "text",
          required: true,
          admin: {
            description:
              'Word before the saving, e.g. "Save" (shows as "Save €24").',
          },
        },
        {
          name: "tickets",
          type: "array",
          required: true,
          admin: { ...ARRAY_ADMIN, description: "In display order." },
          fields: offerTicketFields,
          validate: validateUniqueTicketKeys,
        },
        {
          name: "footnote",
          type: "textarea",
          required: true,
          admin: {
            description:
              'Small print under the compare view, e.g. "All prices in EUR."',
          },
        },
      ],
    }),
    groupSection({
      label: "What's included",
      name: "included",
      description:
        "Full benefit list per ticket. The same list drives Compare tickets.",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          name: "ticketBuyLabel",
          type: "text",
          required: true,
          admin: {
            description:
              'Buy button in the ticket summary. {ticket} becomes the ticket name, e.g. "Buy {ticket} ticket".',
          },
          validate: requirePlaceholders("ticket"),
        },
        {
          name: "countLabel",
          type: "text",
          required: true,
          admin: {
            description:
              'Benefit count, e.g. "{included} of {total} benefits included". The site counts them.',
          },
          validate: requirePlaceholders("included", "total"),
        },
        { name: "includedLabel", type: "text", required: true },
        { name: "notIncludedLabel", type: "text", required: true },
        { name: "requiredLabel", type: "text", required: true },
        { name: "notRequiredLabel", type: "text", required: true },
        {
          name: "groups",
          type: "array",
          required: true,
          admin: ARRAY_ADMIN,
          fields: benefitGroupFields,
        },
      ],
    }),
    groupSection({
      label: "Compare tickets",
      name: "compare",
      description: "Side by side view of two tickets.",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        {
          name: "firstLabel",
          type: "text",
          required: true,
          admin: {
            description: 'Label of the left picker, e.g. "First ticket".',
          },
        },
        {
          name: "secondLabel",
          type: "text",
          required: true,
          admin: {
            description: 'Label of the right picker, e.g. "Second ticket".',
          },
        },
      ],
    }),
    section("Search and social", seoFields("ticket categories"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
    section(
      "2026 archive",
      [
        {
          name: "tiers",
          type: "group",
          admin: { readOnly: true },
          fields: [
            { name: "heading", type: "text" },
            { name: "intro", type: "textarea" },
            {
              name: "items",
              type: "array",
              admin: ARRAY_ADMIN,
              fields: ticketTierFields,
            },
          ],
        },
        {
          name: "comparison",
          type: "group",
          admin: { readOnly: true },
          fields: [
            { name: "heading", type: "text" },
            { name: "intro", type: "textarea" },
            {
              name: "tiers",
              type: "array",
              admin: ARRAY_ADMIN,
              fields: comparisonTierFields,
            },
            {
              name: "groups",
              type: "array",
              admin: ARRAY_ADMIN,
              fields: comparisonGroupFields,
              validate: validateRowsMatchTierCount,
            },
            { name: "academicNote", type: "textarea" },
          ],
        },
        {
          name: "categories",
          type: "group",
          admin: { readOnly: true },
          fields: [
            { name: "heading", type: "text" },
            {
              name: "items",
              type: "array",
              admin: ARRAY_ADMIN,
              fields: ticketCategoryFields,
            },
          ],
        },
      ],
      {
        description:
          "The 2026 ticket page, kept for reference. The site no longer shows it.",
      },
    ),
  ],
});
