import type { GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { section, seoFields } from "./shared-fields";

// Mirrors PastTeamsContent in apps/web/src/lib/content.ts 1:1. The archive
// grid itself comes from the team collection, not this global.
export const PagePastTeams: GlobalConfig = pageGlobal({
  slug: "page-past-teams",
  label: "Past Teams",
  path: "/past-teams/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "intro", type: "textarea", required: true },
    section("Search and social", seoFields("past teams"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
