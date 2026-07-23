import type { GlobalConfig } from "payload";

import { pageGlobal } from "./base";
import { section, seoFields } from "./shared-fields";

// Mirrors JobsPageContent in apps/web/src/lib/content.ts 1:1. The job list
// itself comes from the jobs collection, not this global. Owned by the
// Partner division, unlike the other page globals.
export const PageJobs: GlobalConfig = pageGlobal({
  slug: "page-jobs",
  label: "Jobs",
  path: "/job-listings/",
  ownedBy: "Partner",
  divisions: ["partner"],
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "intro", type: "textarea", required: true },
    {
      name: "detailHowToContactHeading",
      type: "text",
      required: true,
      admin: {
        description:
          'Heading above the apply link on each job\'s detail view, e.g. "How to get in touch:".',
      },
    },
    section("Search and social", seoFields("job listings"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
