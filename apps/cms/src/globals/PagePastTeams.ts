import type { GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { section, seoFields } from "./shared-fields";

// Mirrors PastTeamsContent in apps/web/src/lib/content.ts 1:1. The archive
// grid itself comes from the team collection, not this global. The hero
// photo is set on Our Team, which this page shares.
export const PagePastTeams: GlobalConfig = pageGlobal({
  slug: "page-past-teams",
  label: "Past Teams",
  path: "/past-teams/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "intro", type: "textarea", required: true },
    {
      name: "tabLabel",
      type: "text",
      admin: {
        description:
          'The "History" side of the switch above the team. Empty shows "History".',
      },
    },
    {
      name: "yearHeading",
      type: "text",
      admin: {
        description:
          'The heading above each year\'s team photo, with {year} for the year. Empty shows "Year {year}".',
      },
    },
    {
      name: "photoAlt",
      type: "text",
      admin: {
        description:
          'What each year\'s team photo shows, for screen readers, with {year} for the year. Empty uses "The Q-Summit team of {year}".',
      },
    },
    section("Search and social", seoFields("past teams"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
