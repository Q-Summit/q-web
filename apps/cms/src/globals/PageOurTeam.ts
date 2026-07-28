import type { GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { section, seoFields } from "./shared-fields";

// Mirrors OurTeamContent in apps/web/src/lib/content.ts 1:1. The member
// grid itself comes from the team collection, not this global.
export const PageOurTeam: GlobalConfig = pageGlobal({
  slug: "page-our-team",
  label: "Our Team",
  path: "/our-team/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    { name: "heading", type: "text", required: true },
    section("Search and social", seoFields("our team"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
