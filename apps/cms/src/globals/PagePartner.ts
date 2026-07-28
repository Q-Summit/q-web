import type { GlobalConfig } from "payload";

import { urlOrMailtoValidate } from "../lib/url-validate";
import { pageGlobal } from "./base";
import { groupSection, section, seoFields } from "./shared-fields";

// Mirrors PartnerPageContent in apps/web/src/lib/content.ts 1:1. The
// partner grid itself comes from the partners collection, not this global.
// Owned by the Partner division, unlike the other page globals.
export const PagePartner: GlobalConfig = pageGlobal({
  slug: "page-partner",
  label: "Partners",
  path: "/partner/",
  ownedBy: "Partner",
  divisions: ["partner"],
  fields: [
    { name: "heading", type: "text", required: true },
    groupSection({
      label: "Closing call-to-action",
      name: "cta",
      open: true,
      description: '"Join Us as a Partner" closing call-to-action.',
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "text", type: "textarea", required: true },
        { name: "buttonLabel", type: "text", required: true },
        {
          name: "buttonHref",
          type: "text",
          required: true,
          admin: { description: "http(s) URL or mailto: address." },
          validate: urlOrMailtoValidate({ allowMailto: true }),
        },
      ],
    }),
    section("Search and social", seoFields("partner"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
