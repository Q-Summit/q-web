import type { Field, GlobalConfig } from "payload";

import { urlOrMailtoValidate } from "../lib/url-validate";
import { pageGlobal } from "./base";
import {
  groupSection,
  section,
  seoFields,
  titleDescriptionArrayField,
} from "./shared-fields";

/**
 * An audience is off while its title is empty: /partner/ leaves out its
 * field and the site does not build its page. Once the title is filled
 * every one of its texts is printed, so they are required from that moment
 * on. Without a title nothing is asked for, so the page published before
 * these fields existed stays publishable untouched.
 */
export const requiredWithAudienceLabel = (
  value: unknown,
  { siblingData }: { siblingData: unknown },
): true | string => {
  const label = (siblingData as { label?: unknown } | undefined)?.label;
  const audienceOn = typeof label === "string" && label.trim() !== "";
  return !audienceOn || (typeof value === "string" && value.trim() !== "")
    ? true
    : "Required once the title is filled.";
};

/**
 * One "Become a Partner" audience: the expandable field on /partner/ and
 * the page it leads to (/partner/<name>/). The three audiences are fixed
 * groups rather than an array because each one owns a route in apps/web;
 * an editor can change every word, not add a fourth page.
 */
const audienceGroup = (name: string, label: string): Field => ({
  name,
  type: "group",
  label,
  admin: {
    description: `The "${label}" field on /partner/ and the page /partner/${name}/ it leads to. Both stay hidden until the title is filled; from then on every text here is required.`,
  },
  fields: [
    {
      name: "label",
      type: "text",
      admin: {
        description: `Title of the expandable field, e.g. "${label}s".`,
      },
    },
    {
      name: "summary",
      type: "textarea",
      validate: requiredWithAudienceLabel,
      admin: { description: "Short text shown when the field is opened." },
    },
    {
      name: "linkLabel",
      type: "text",
      validate: requiredWithAudienceLabel,
      admin: {
        description: "Button in the opened field that leads to the page.",
      },
    },
    {
      name: "heading",
      type: "text",
      validate: requiredWithAudienceLabel,
      admin: { description: "Main heading of the page." },
    },
    {
      name: "intro",
      type: "textarea",
      validate: requiredWithAudienceLabel,
      admin: {
        description:
          "Opening text under the heading. Also the search snippet and share preview of the page.",
      },
    },
    {
      name: "benefitsHeading",
      type: "text",
      validate: requiredWithAudienceLabel,
      admin: {
        description: 'Heading above the benefits, e.g. "What you get".',
      },
    },
    titleDescriptionArrayField(
      "benefits",
      "What this partnership offers. One card per benefit, in this order.",
    ),
    {
      name: "contactsHeading",
      type: "text",
      validate: requiredWithAudienceLabel,
      admin: {
        description: 'Heading above the contact cards, e.g. "Your contacts".',
      },
    },
    {
      name: "contactLabel",
      type: "text",
      validate: requiredWithAudienceLabel,
      admin: {
        description:
          'Email button on every contact card, e.g. "Write an email". Keep it free of names.',
      },
    },
    {
      name: "contacts",
      type: "array",
      admin: {
        description:
          "The people a visitor writes to. Keep the order you want on the page.",
        initCollapsed: true,
        components: {
          RowLabel: "/components/array-row-label#TitleRowLabel",
        },
      },
      fields: [
        { name: "name", type: "text", required: true },
        {
          name: "role",
          type: "text",
          admin: { description: 'Optional, e.g. "Startup Partnerships".' },
        },
        { name: "email", type: "email", required: true },
        {
          name: "photo",
          type: "upload",
          relationTo: "media",
          label: "Portrait",
          admin: {
            description:
              "Optional. Without a photo the card shows the person's initials.",
            sortOptions: "-createdAt",
          },
        },
      ],
    },
  ],
});

// Mirrors PartnerPageContent in apps/web/src/lib/content/pages.ts 1:1. The
// projected logos come from the partners collection and the quotes from the
// testimonials collection, not this global.
// Owned by the Partner division, unlike the other page globals.
export const PagePartner: GlobalConfig = pageGlobal({
  slug: "page-partner",
  label: "Partners",
  path: "/partner/",
  ownedBy: "Partner",
  divisions: ["partner"],
  fields: [
    groupSection({
      // Stored as "projector" since the hologram room; the name stays so
      // the saved texts keep their place (no data-shape change).
      label: "Partner logos",
      name: "projector",
      open: true,
      description:
        "Opening of the page: the heading on dark blue, a bar of the tiers and all partner logos, tier by tier.",
      fields: [
        {
          name: "eyebrow",
          type: "text",
          admin: {
            description:
              'Small label under the heading, e.g. "Our partners 2026".',
          },
        },
        {
          name: "heading",
          type: "text",
          admin: {
            description:
              "Main heading of the page. Until it is filled, the page title stands in.",
          },
        },
        { name: "intro", type: "textarea" },
        {
          name: "hint",
          type: "text",
          admin: {
            description:
              'Optional small note above the partner logos, e.g. "Pick a logo to learn more".',
          },
        },
        {
          name: "tierSuffix",
          type: "text",
          admin: {
            description:
              'Word after the tier name in every tier heading, e.g. "Partners" turns Gold into "Gold Partners". Leave it empty to show the tier name alone.',
          },
        },
        {
          name: "websiteLabel",
          type: "text",
          admin: {
            description:
              "Button in the pop-up that opens the partner's website, e.g. \"Visit website\". Leave it empty to show the website's address instead.",
          },
        },
      ],
    }),
    {
      name: "heading",
      type: "text",
      required: true,
      admin: {
        description:
          "Heading of the section with the partner photos and their quotes.",
      },
    },
    {
      name: "quotesHint",
      type: "text",
      admin: {
        description:
          'Short line under that heading telling visitors how to read a quote, e.g. "Tap the quote mark on a photo to read what they said." Leave it empty to show no line.',
      },
    },
    groupSection({
      label: "Become a Partner",
      name: "cta",
      description:
        "The closing section: who to talk to about a partnership, what a partner gets, and the button to the partner form. The three Startup, Corporate and Investor links sit below it.",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "text", type: "textarea", required: true },
        {
          name: "points",
          type: "array",
          admin: {
            description:
              "Optional. Short lines on what a partner gets, shown as a list under the text. Keep the order you want on the page.",
            initCollapsed: true,
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: [{ name: "title", type: "text", required: true }],
        },
        {
          name: "buttonLabel",
          type: "text",
          required: true,
          admin: { description: 'Main button, e.g. "Send inquiry".' },
        },
        {
          name: "buttonHref",
          type: "text",
          required: true,
          admin: {
            description:
              "Where the main button leads: the partner form as an http(s) URL or a path on this site, or a mailto: address.",
          },
          validate: urlOrMailtoValidate({
            allowMailto: true,
            allowRelative: true,
          }),
        },
        {
          name: "contact",
          type: "group",
          label: "Contact person",
          admin: {
            description:
              "The person companies talk to. The card shows only once name and email are filled.",
          },
          fields: [
            {
              type: "row",
              fields: [
                { name: "name", type: "text", admin: { width: "50%" } },
                {
                  name: "role",
                  type: "text",
                  admin: {
                    width: "50%",
                    description:
                      'Optional, e.g. "Board Member Partner Relations".',
                  },
                },
              ],
            },
            { name: "email", type: "email" },
            {
              name: "copyLabel",
              type: "text",
              admin: {
                description:
                  'Hint of the small copy icon next to the address, e.g. "Copy address". Leave it empty to hide the icon.',
              },
            },
            {
              name: "copiedLabel",
              type: "text",
              admin: {
                description:
                  'What the copy hint says for a moment after copying, e.g. "Copied".',
              },
            },
            {
              name: "photo",
              type: "upload",
              relationTo: "media",
              label: "Portrait",
              admin: {
                description:
                  "Optional. Without a photo the card shows the person's initials.",
                sortOptions: "-createdAt",
              },
            },
          ],
        },
      ],
    }),
    groupSection({
      label: "Startup, Corporate and Investor pages",
      name: "audiences",
      description:
        "The three expandable fields under Become a Partner and the page each one leads to.",
      fields: [
        audienceGroup("startup", "Startup"),
        audienceGroup("corporate", "Corporate"),
        audienceGroup("investor", "Investor"),
      ],
    }),
    section("Search and social", seoFields("partner"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
