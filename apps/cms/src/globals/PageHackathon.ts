import type { Field, GlobalConfig } from "payload";

import { urlOrMailtoValidate } from "../lib/url-validate";
import { pageGlobal } from "./base";
import {
  agendaItemsField,
  groupSection,
  pageLinkGroup,
  section,
  seoFields,
  titleDescriptionArrayField,
} from "./shared-fields";

// PartnerGroup.partners[].logoFile is a code-side asset-registry key (see
// HackPartners.astro's `logoAssets` lookup), not an uploaded file. Keep this
// option list in sync with that map's keys: an unregistered key silently
// drops the partner's logo card instead of erroring, so the select can only
// offer keys the build actually resolves.
const HACKATHON_LOGO_FILE_OPTIONS = [
  { label: "Spherecast", value: "69bfc230ceecbebceff708fc_new-logo.webp" },
  { label: "Picnic", value: "69b17a0e089f34c65a5e14a2_Picnic_logo.svg" },
  { label: "Exxeta", value: "69bfc037724d038aa2ba26bc_image.png" },
  {
    label: "Cloover",
    value: "69c25665fc7b9cf5fb7a2889_f6961aac836f-Logo__2_.webp",
  },
  { label: "Istari", value: "69d00444ac69243eaf2b4f4f_istari-logo.svg" },
  {
    label: "OpenAI",
    value: "69c255cf7613b98e497cf289_OpenAI-black-wordmark(1).webp",
  },
  { label: "Lovable", value: "69b2e8289e0d3b7dd0ae9529_lovable_logo.svg" },
  { label: "Anthropic", value: "69c99a0acf960a512107bc95_Anthropic_logo.svg" },
  {
    label: "ElevenLabs",
    value: "69c256c8d3ff156cf6877066_elevenlabs-logo-black.webp",
  },
  { label: "n8n", value: "69ccf786df18a395b3fee7fd_n8n_pink%2Bblack_logo.svg" },
  {
    label: "Featherless AI",
    value: "69d40a60aa0c813fdc6344eb_featherlessai-transparent.webp",
  },
  {
    label: "LiveAvatar",
    value: "69d675fef0b853cb5df97e4e_liveavatar_logo_vertical_dark.webp",
  },
  { label: "ITMX", value: "69b458c74be9d2023714bcbf_itmx_logo.webp" },
  { label: "MLH", value: "69d00453416ddd4a45dad964_mlh-logo-color-dark.svg" },
];

const hackathonPartnerFields: Field[] = [
  { name: "name", type: "text", required: true },
  {
    name: "href",
    type: "text",
    required: true,
    validate: urlOrMailtoValidate(),
  },
  {
    name: "logoFile",
    type: "select",
    required: true,
    options: HACKATHON_LOGO_FILE_OPTIONS,
    // Payload otherwise derives the Postgres enum name from the full nested
    // field path, which for this field (page_hackathon -> partners -> groups
    // -> partners -> logoFile, doubled again for the drafts version table)
    // exceeds Postgres's 63-character identifier limit.
    enumName: "hackathon_partner_logo_file",
    admin: {
      description:
        "Logo asset registered in code (HackPartners.astro's logoAssets), not an uploaded file. " +
        "Ask IT to register a new logo before it can appear in this list.",
    },
  },
  {
    name: "note",
    type: "text",
    admin: {
      description: 'Optional footnote, e.g. "Challenge to be announced".',
    },
  },
];

const partnerGroupFields: Field[] = [
  {
    name: "group",
    type: "text",
    required: true,
    admin: { description: "Section heading, e.g. Challenge Partners." },
  },
  {
    name: "partners",
    type: "array",
    required: true,
    fields: hackathonPartnerFields,
  },
];

// Mirrors HackathonContent in apps/web/src/lib/content.ts 1:1.
export const PageHackathon: GlobalConfig = pageGlobal({
  slug: "page-hackathon",
  label: "Hackathon",
  path: "/hackathon/",
  ownedBy: "PR + Concept",
  divisions: ["pr", "concept"],
  fields: [
    groupSection({
      label: "Hero",
      name: "hero",
      open: true,
      fields: [
        { name: "headline", type: "text", required: true },
        { name: "tagline", type: "text", required: true },
        pageLinkGroup("cta"),
      ],
    }),
    groupSection({
      label: "Partners",
      name: "partners",
      description:
        "Hackathon partner groups (challenge/infrastructure/ecosystem).",
      fields: [
        { name: "heading", type: "text", required: true },
        {
          name: "groups",
          type: "array",
          required: true,
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: "/components/array-row-label#TitleRowLabel",
            },
          },
          fields: partnerGroupFields,
        },
      ],
    }),
    groupSection({
      label: "Benefits",
      name: "benefits",
      fields: [
        { name: "heading", type: "text", required: true },
        titleDescriptionArrayField(
          "cards",
          "Why Q-Hackathon cards (Prizes, Networking, ...).",
        ),
      ],
    }),
    groupSection({
      label: "Schedule",
      name: "schedule",
      fields: [
        { name: "heading", type: "text", required: true },
        { name: "intro", type: "textarea", required: true },
        agendaItemsField("items"),
      ],
    }),
    groupSection({
      label: "FAQ teaser",
      name: "faqSection",
      description:
        "FAQ section intro. The questions themselves live under Lists & people, FAQs, with Page set to Hackathon.",
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
        { name: "mailtoLabel", type: "text", required: true },
        { name: "mailtoEmail", type: "email", required: true },
      ],
    }),
    section("Search and social", seoFields("hackathon"), {
      description:
        "How this page looks in Google and when someone shares the link.",
    }),
  ],
});
