import type { GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { section, seoFields } from "./shared-fields";

// Mirrors OurTeamContent in apps/web/src/lib/content.ts 1:1. The member
// grid itself comes from the team collection, not this global. The hero
// photo and the labels here also show on /past-teams, which shares the hero
// and the Current Team / History switch.
export const PageOurTeam: GlobalConfig = pageGlobal({
  slug: "page-our-team",
  label: "Our Team",
  path: "/our-team/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    { name: "heading", type: "text", required: true },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "The group photo behind the heading, on Our Team and on History. Upload it in three widths with the same name ending in -p-1280, -p-1920 and -p-2560 (for example team-2027-hero-p-2560.webp) and pick the 2560 one here: each screen then loads only the size it needs. A single photo works too, but every screen loads it in full.",
      },
    },
    {
      name: "tabLabel",
      type: "text",
      admin: {
        description:
          'The "Current Team" side of the switch above the team. Empty shows "Current Team".',
      },
    },
    {
      name: "divisionHeading",
      type: "text",
      admin: {
        description:
          'The heading above each division, with {division} for its name. Empty shows "{division} Division".',
      },
    },
    section("Search and social", seoFields("our team"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
