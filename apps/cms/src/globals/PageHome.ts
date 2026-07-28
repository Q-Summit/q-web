import type { GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import {
  groupSection,
  pageLinkGroup,
  pageStatArrayField,
  section,
  seoFields,
  stringArrayField,
  titleDescriptionArrayField,
} from "./shared-fields";

// Mirrors HomeContent in apps/web/src/lib/content.ts 1:1.
export const PageHome: GlobalConfig = pageGlobal({
  slug: "page-home",
  label: "Home",
  path: "/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    groupSection({
      label: "Hero",
      name: "hero",
      open: true,
      description:
        "Top-of-page hero: headline, tagline, and announcement banner.",
      fields: [
        { name: "headline", type: "text", required: true },
        { name: "tagline", type: "text", required: true },
        stringArrayField("announcementLines", {
          label: "Announcement line",
          description:
            "Rotating banner lines (e.g. thank-you message, next date). Each row is one line.",
        }),
        pageLinkGroup(
          "cta",
          'Hero call-to-action, e.g. {label: "Learn more", href: "#why-attend"}.',
        ),
      ],
    }),
    groupSection({
      label: "Conference dates",
      name: "event",
      description:
        "Conference dates for search engines. These feed the Event structured data on the " +
        "homepage (the rich result that can show the date in Google), not any visible text. " +
        "Write the human-facing date in the hero announcement lines above.",
      fields: [
        {
          name: "startDate",
          type: "date",
          required: true,
          admin: {
            date: { pickerAppearance: "dayOnly", displayFormat: "yyyy-MM-dd" },
            description: "First day of the conference.",
          },
        },
        {
          name: "endDate",
          type: "date",
          required: true,
          admin: {
            date: { pickerAppearance: "dayOnly", displayFormat: "yyyy-MM-dd" },
            description:
              "Last day of the conference. Same as the start date for a one-day event.",
          },
          validate: (
            value: unknown,
            { siblingData }: { siblingData: unknown },
          ) => {
            const start = (siblingData as { startDate?: unknown } | undefined)
              ?.startDate;
            if (!value || !start) return true;
            return new Date(String(value)) >= new Date(String(start))
              ? true
              : "End date cannot be before the start date.";
          },
        },
      ],
    }),
    groupSection({
      label: "Stats",
      name: "stats",
      description: '"Join us to be with" stats section.',
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        pageStatArrayField(
          "items",
          "Headline numbers, e.g. 1500 Participants.",
        ),
      ],
    }),
    groupSection({
      label: "Partner band",
      name: "partnerBand",
      description: "Partner/network logo band beneath the stats.",
      fields: [
        pageStatArrayField(
          "items",
          "One entry per logo group (Startup/Corporate, Network, ...).",
        ),
        pageLinkGroup("cta"),
      ],
    }),
    groupSection({
      label: "Previous speakers",
      name: "previousSpeakers",
      description:
        "Previous-speakers teaser section (grid comes from the speakers collection).",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        pageLinkGroup("cta"),
      ],
    }),
    groupSection({
      label: "Why attend",
      name: "whyAttend",
      description: '"Why Everyone\'s at Q-Summit" section.',
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        titleDescriptionArrayField("cards", "One card per reason to attend."),
        pageLinkGroup("cta"),
      ],
    }),
    groupSection({
      label: "FAQ teaser",
      name: "faqSection",
      description:
        "FAQ teaser section (questions come from the faqs collection).",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        pageLinkGroup("cta"),
      ],
    }),
    section("Search and social", seoFields("home"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
