import type { Field, GlobalConfig } from "payload";

import { divisionScoped, readOwnDraftVersions, readOwnDrafts } from "../access";
import { urlOrMailtoValidate } from "../lib/url-validate";
import { reviewWorkflowGlobal } from "./base";
import { pageLinkFields, stringArrayField } from "./shared-fields";

// Mirrors SiteSettings in apps/web/src/lib/content.ts 1:1 (site-settings.json).
// PR owns nav/footer copy and the AI identity block; this global has no
// single page path, so it calls base.ts's reviewWorkflowGlobal() directly
// instead of pageGlobal() (which builds label/description/preview around one).
const socialLinkFields: Field[] = [
  { name: "label", type: "text", required: true },
  {
    name: "href",
    type: "text",
    required: true,
    validate: urlOrMailtoValidate(),
  },
  {
    name: "platform",
    type: "select",
    required: true,
    options: [
      { label: "TikTok", value: "tiktok" },
      { label: "Instagram (Q-Summit)", value: "instagram-qsummit" },
      { label: "Instagram (Q-Hack)", value: "instagram-qhack" },
      { label: "LinkedIn", value: "linkedin" },
      { label: "YouTube", value: "youtube" },
    ],
    admin: { description: "Stable key used for icon lookup on the site." },
  },
];

export const SiteSettings: GlobalConfig = reviewWorkflowGlobal({
  slug: "site-settings",
  label: "Navigation, footer & AI identity",
  admin: {
    group: "Site-wide",
    description:
      "Top nav, footer, site title, and /llms.txt identity. Owned by PR. " +
      "Changes affect every page.",
  },
  access: {
    read: readOwnDrafts("pr"),
    readVersions: readOwnDraftVersions("pr"),
    update: divisionScoped("pr"),
  },
  fields: [
    {
      name: "siteTitle",
      type: "text",
      required: true,
      admin: {
        description:
          'Brand name in browser tabs and social cards ("Q-Summit | …"). Also the heading of /llms.txt.',
      },
    },
    {
      name: "nav",
      type: "array",
      required: true,
      admin: { description: "Top navigation links, in display order." },
      fields: pageLinkFields(),
    },
    {
      name: "footer",
      type: "group",
      fields: [
        {
          name: "tagline",
          type: "textarea",
          required: true,
          admin: {
            description:
              "Fallback for empty page meta descriptions and empty AI summary. Keep factual.",
          },
        },
        {
          name: "links",
          type: "array",
          required: true,
          admin: {
            description: "Footer link list (Imprint, Privacy Policy, ...).",
          },
          fields: pageLinkFields(),
        },
        {
          name: "socialLinks",
          type: "array",
          required: true,
          fields: socialLinkFields,
        },
        { name: "copyrightHolder", type: "text", required: true },
      ],
    },
    {
      name: "llms",
      type: "group",
      label: "AI assistants (/llms.txt)",
      admin: {
        description:
          "Identity for ChatGPT, Claude, and similar tools. Page link blurbs stay on each page's meta description; /llms-full.txt uses main page sections.",
      },
      fields: [
        {
          name: "summary",
          type: "textarea",
          admin: {
            description:
              "One or two factual sentences under the /llms.txt title. Encyclopedia tone. Blank → footer tagline.",
            placeholder:
              "Germany's largest student-led startup conference, organized in Mannheim since 2017.",
          },
        },
        {
          name: "pitch",
          type: "textarea",
          admin: {
            description:
              "One short value line after the summary. Blank → home hero tagline.",
            placeholder:
              "Two days in Mannheim for students, startups, investors, and partners: talks, formats, and networking.",
          },
        },
        stringArrayField("keyFacts", {
          label: "Key fact",
          description:
            "What / Where / When / Scale / Audience / Value / Contact. One fact per row; no leading dash. Prefer 6 to 10 rows.",
        }),
        {
          name: "lastReviewed",
          type: "text",
          admin: {
            description:
              "YYYY-MM-DD when this identity was last checked. Shown near the top of /llms.txt.",
            placeholder: "2026-07-20",
          },
        },
      ],
    },
  ],
});
