import type { Field, GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { section, seoFields } from "./shared-fields";

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
    { name: "heading", type: "text", required: true },
    { name: "intro", type: "textarea", required: true },
    {
      name: "panels",
      type: "array",
      required: true,
      admin: { description: "Main-stage panel topic cards." },
      fields: panelFields,
    },
    section("Search and social", seoFields("speaker"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
