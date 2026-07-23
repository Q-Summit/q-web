import type { GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import {
  agendaItemsField,
  groupSection,
  section,
  seoFields,
} from "./shared-fields";

// Mirrors ProgramContent in apps/web/src/lib/content.ts 1:1.
export const PageProgram: GlobalConfig = pageGlobal({
  slug: "page-program",
  label: "Program",
  path: "/program/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    groupSection({
      label: "Agenda",
      name: "agenda",
      open: true,
      description: "Conference agenda section.",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        agendaItemsField(
          "items",
          "One row per agenda item (Speeches, Workshops, ...).",
        ),
      ],
    }),
    groupSection({
      label: "FAQ teaser",
      name: "faqSection",
      description:
        "FAQ section intro. The questions themselves live under Lists & people, FAQs, with Page set to Program.",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
      ],
    }),
    groupSection({
      label: "Closing call-to-action",
      name: "closingCta",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "text", type: "textarea", required: true },
      ],
    }),
    section("Search and social", seoFields("program"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
