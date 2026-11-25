import type { Field, GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { TICKET_KEYS } from "./PageTickets";
import { urlOrMailtoValidate } from "../lib/url-validate";
import { section, seoFields } from "./shared-fields";

const audienceItemFields: Field[] = [
  { name: "title", type: "text", required: true },
  { name: "description", type: "textarea", required: true },
];

/*
 * The four audience pages (/whyq/students/ ... /whyq/investors/), one array
 * row each, keyed by `audience`. Mirrors WhyqAudiencePage in
 * apps/web/src/lib/content/pages.ts. Every photo and logo is an upload, so
 * content packages carry them by filename and the media library shows where
 * each file is used (lib/media-usage.ts). Field names stay short: Postgres
 * caps identifiers at 63 characters and the version tables add a prefix.
 */
const WHYQ_AUDIENCES = [
  { label: "Students & Young Pros (/whyq/students/)", value: "students" },
  { label: "Startups (/whyq/startups/)", value: "startups" },
  { label: "Corporates (/whyq/corporates/)", value: "corporates" },
  { label: "Investors (/whyq/investors/)", value: "investors" },
] as const;

const photoFields = (description: string): Field[] => [
  {
    name: "image",
    type: "upload",
    relationTo: "media",
    admin: { description },
  },
  {
    name: "imageAlt",
    type: "text",
    admin: {
      description:
        "What the photo shows, for screen readers. Needed when a photo is set.",
    },
  },
];

const textRows = (name: string, label: string, description: string): Field => ({
  name,
  type: "array",
  labels: { singular: label, plural: `${label}s` },
  admin: { description },
  fields: [{ name: "text", type: "text", required: true }],
});

const audiencePageFields: Field[] = [
  {
    type: "row",
    fields: [
      {
        name: "audience",
        type: "select",
        required: true,
        options: [...WHYQ_AUDIENCES],
        admin: {
          width: "50%",
          description: "Which page this is. Each page may appear only once.",
        },
      },
      {
        name: "crumb",
        type: "text",
        required: true,
        admin: {
          width: "50%",
          description: 'Name in the breadcrumb, e.g. "For Startups".',
        },
      },
    ],
  },
  {
    name: "metaDescription",
    type: "textarea",
    required: true,
    admin: {
      description:
        "One or two sentences for Google and for link previews of this page.",
    },
  },
  {
    name: "hero",
    type: "group",
    fields: [
      { name: "heading", type: "text", required: true },
      { name: "intro", type: "textarea", required: true },
      {
        name: "ctaLabel",
        type: "text",
        required: true,
        admin: {
          description: 'Ticket button, e.g. "Get your startup ticket".',
        },
      },
    ],
  },
  {
    name: "stats",
    type: "array",
    labels: { singular: "Figure", plural: "Figures" },
    admin: {
      description:
        'Key figures under the hero, e.g. "1500+" and "Participants". Keep the same figure in the same place on every page.',
    },
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "value",
            type: "text",
            required: true,
            admin: { width: "30%" },
          },
          {
            name: "label",
            type: "text",
            required: true,
            admin: { width: "70%" },
          },
        ],
      },
    ],
  },
  {
    name: "activities",
    type: "group",
    fields: [
      { name: "heading", type: "text", required: true },
      { name: "intro", type: "textarea" },
      {
        name: "items",
        type: "array",
        labels: { singular: "Activity", plural: "Activities" },
        admin: {
          description:
            "The cards in the row that scrolls sideways. A card without a photo shows the blue wash of the ticket page.",
        },
        fields: [
          { name: "title", type: "text", required: true },
          { name: "text", type: "textarea", required: true },
          {
            name: "kind",
            type: "select",
            required: true,
            defaultValue: "included",
            options: [
              { label: "Included in the ticket", value: "included" },
              { label: "Apply with the ticket", value: "apply" },
            ],
          },
          ...photoFields("Photo of the activity."),
        ],
      },
    ],
  },
  {
    name: "highlight",
    type: "group",
    admin: {
      description:
        "The section between the activities and the tickets. Its layout decides which of the fields below are shown.",
    },
    fields: [
      {
        name: "layout",
        type: "select",
        required: true,
        defaultValue: "cards",
        options: [
          { label: "Two photo cards", value: "cards" },
          { label: "Last year's winner", value: "winner" },
          { label: "Logo wall", value: "logos" },
          { label: "Photo with a logo wall (Qube)", value: "qube" },
        ],
      },
      { name: "eyebrow", type: "text", required: true },
      { name: "heading", type: "text", required: true },
      { name: "intro", type: "textarea" },
      {
        name: "cards",
        type: "array",
        admin: {
          condition: (_, sibling) => sibling?.layout === "cards",
        },
        fields: [
          { name: "kicker", type: "text", required: true },
          { name: "title", type: "text", required: true },
          { name: "text", type: "textarea", required: true },
          ...photoFields("Photo of the card."),
        ],
      },
      {
        type: "row",
        admin: {
          condition: (_, sibling) => sibling?.layout === "winner",
        },
        fields: [
          {
            name: "winnerLabel",
            type: "text",
            admin: {
              width: "50%",
              description: 'e.g. "Winner · Pitch Battle 2026".',
            },
          },
          { name: "winnerName", type: "text", admin: { width: "50%" } },
        ],
      },
      {
        name: "winnerLine",
        type: "text",
        admin: {
          condition: (_, sibling) => sibling?.layout === "winner",
          description: "One line on what the winner does and the prize money.",
        },
      },
      {
        type: "collapsible",
        label: "Large photo",
        admin: {
          initCollapsed: false,
          condition: (_, sibling) =>
            sibling?.layout === "winner" || sibling?.layout === "qube",
        },
        fields: photoFields("The large photo of the section."),
      },
      {
        name: "moments",
        type: "array",
        maxRows: 3,
        labels: { singular: "Moment", plural: "Moments" },
        admin: {
          condition: (_, sibling) => sibling?.layout === "winner",
          description: "Up to three smaller photos under the winner's photo.",
        },
        fields: photoFields("Photo of the moment."),
      },
      {
        type: "row",
        admin: {
          condition: (_, sibling) => sibling?.layout === "qube",
        },
        fields: [
          {
            name: "logosEyebrow",
            type: "text",
            admin: { width: "50%", description: 'e.g. "In the Qube 2026".' },
          },
          { name: "logosHeading", type: "text", admin: { width: "50%" } },
        ],
      },
      {
        name: "logos",
        type: "array",
        labels: { singular: "Logo", plural: "Logos" },
        admin: {
          condition: (_, sibling) =>
            sibling?.layout === "logos" || sibling?.layout === "qube",
          description:
            "Companies or investors, in this order. Where the Partners list already has the logo, pick that same file.",
        },
        fields: [
          {
            type: "row",
            fields: [
              {
                name: "name",
                type: "text",
                required: true,
                admin: { width: "50%" },
              },
              {
                name: "websiteUrl",
                type: "text",
                admin: {
                  width: "50%",
                  placeholder: "https://example.com",
                  description: "Optional link to the website.",
                },
                validate: urlOrMailtoValidate({ optional: true }),
              },
            ],
          },
          {
            name: "logo",
            type: "upload",
            relationTo: "media",
            admin: {
              description:
                "Prefer SVG, otherwise a PNG or WebP with a transparent background. Without a logo the name is shown.",
            },
            filterOptions: () => ({
              mimeType: { in: ["image/svg+xml", "image/png", "image/webp"] },
            }),
          },
        ],
      },
    ],
  },
  {
    name: "ticket",
    type: "group",
    fields: [
      { name: "heading", type: "text", required: true },
      { name: "intro", type: "text" },
      {
        name: "keys",
        type: "select",
        hasMany: true,
        required: true,
        options: [...TICKET_KEYS],
        admin: {
          description:
            "The tickets this page sells, in this order. Prices and benefits come from Website pages → Tickets.",
        },
      },
      {
        name: "side",
        type: "array",
        labels: { singular: "Side card", plural: "Side cards" },
        admin: {
          description: "Cards beside a single ticket, each with a status pill.",
        },
        fields: [
          { name: "title", type: "text", required: true },
          { name: "text", type: "textarea", required: true },
          {
            name: "status",
            type: "text",
            required: true,
            admin: {
              description: 'e.g. "Included" or "Applications open soon".',
            },
          },
        ],
      },
      {
        name: "includesHeading",
        type: "text",
        admin: {
          description:
            'Heading of the list beside two tickets, e.g. "Both tickets include".',
        },
      },
      textRows("includes", "Line", "The list beside two tickets."),
      {
        name: "partnerPanel",
        type: "group",
        admin: {
          description:
            "Optional panel under the tickets that leads to the partner page. Left out while its heading is empty.",
        },
        fields: [
          { name: "eyebrow", type: "text" },
          { name: "heading", type: "text" },
          { name: "text", type: "textarea" },
          textRows("perks", "Perk", "What a partner package brings."),
          {
            type: "row",
            fields: [
              { name: "linkLabel", type: "text", admin: { width: "50%" } },
              {
                name: "href",
                type: "text",
                admin: { width: "50%", placeholder: "/partner/" },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "faq",
    type: "group",
    fields: [
      { name: "heading", type: "text", required: true },
      {
        name: "items",
        type: "array",
        labels: { singular: "Question", plural: "Questions" },
        admin: {
          description:
            "For a price, write {price:student} (price on sale now) or {regular:student} (regular price) instead of a number, with the ticket's key: student, young-professional, start-up, investor or corporate. The site fills in the current price.",
        },
        fields: [
          { name: "question", type: "text", required: true },
          { name: "answer", type: "textarea", required: true },
        ],
      },
    ],
  },
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
          "The earlier Why Q? sections, kept for the record. The pages under /whyq/ show the Audience pages section below.",
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
    section(
      "Audience pages",
      [
        {
          name: "eventLine",
          type: "text",
          admin: {
            description:
              'The line on the pill under every hero, e.g. "April 1-2, 2027 · Mannheim · 10th edition".',
          },
        },
        {
          name: "pages",
          type: "array",
          labels: { singular: "Audience page", plural: "Audience pages" },
          admin: {
            description:
              "One entry per page under Why Q?: Students, Startups, Corporates and Investors. A page without an entry is not built.",
          },
          fields: audiencePageFields,
        },
      ],
      {
        description:
          "Everything on the four pages under /whyq/. Tickets and prices come from Website pages → Tickets.",
        initCollapsed: false,
      },
    ),
    section("Search and social", seoFields("whyq"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
