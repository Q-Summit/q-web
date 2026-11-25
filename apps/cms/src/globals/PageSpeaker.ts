import type { Field, GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { groupSection, section, seoFields } from "./shared-fields";

// Keep in sync with PANEL_ICONS in apps/web/src/pages/speaker.astro: that
// object's keys are the only iconKey values the build can resolve, so this
// select's options are that key set, not free text. A build-breaking typo
// can no longer be saved.
const PANEL_ICON_OPTIONS = [
  { label: "Globe", value: "globe" },
  { label: "Refund", value: "refund" },
  { label: "AI", value: "ai" },
];

const panelFields: Field[] = [
  { name: "title", type: "text", required: true },
  { name: "description", type: "textarea", required: true },
  {
    name: "iconKey",
    type: "select",
    required: true,
    options: PANEL_ICON_OPTIONS,
    admin: {
      description:
        "Icon shown on the card. Ask IT to register a new icon in speaker.astro's PANEL_ICONS " +
        "before it can appear here.",
    },
  },
];

// Mirrors SpeakerPageContent in apps/web/src/lib/content.ts 1:1. The
// speaker grid itself comes from the speakers collection, not this global.
export const PageSpeaker: GlobalConfig = pageGlobal({
  slug: "page-speaker",
  label: "Speakers",
  path: "/speaker/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    // Optional: an empty field shows the page's built-in wording, so the
    // page published before these fields existed renders unchanged.
    groupSection({
      label: "Hot topics",
      name: "hotTopics",
      description:
        "The texts above the hot topics card. The topics themselves are under Lists & people → Hot topics. Leave a field empty to keep the standard wording.",
      fields: [
        {
          name: "label",
          type: "text",
          admin: {
            placeholder: "Hot topics 2027",
            description: "Small label in capitals over the heading.",
          },
        },
        {
          name: "heading",
          type: "text",
          admin: { placeholder: "Three topics set the 2027 main stage" },
        },
        {
          name: "intro",
          type: "text",
          admin: {
            placeholder: "The 2027 line-up is announced step by step.",
            description: "One line under the heading.",
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
          "Main heading over the stage, e.g. Voices on the main stage.",
      },
    },
    {
      name: "intro",
      type: "textarea",
      required: true,
      admin: { description: "One sentence under the heading." },
    },
    {
      name: "lineupPill",
      type: "text",
      admin: {
        placeholder: "Line-up 2027 · Coming soon",
        description:
          "The small pill under the stage. Leave empty to keep the standard wording.",
      },
    },
    {
      name: "panels",
      type: "array",
      required: true,
      // Kept so the stored rows survive; the 2027 /speaker/ page and
      // llms.txt show the hot topics list instead.
      admin: {
        description:
          "Main-stage panel topics. Not shown on the speakers page at the moment; the hot topics under Lists & people are.",
      },
      fields: panelFields,
    },
    section("Search and social", seoFields("speaker"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
