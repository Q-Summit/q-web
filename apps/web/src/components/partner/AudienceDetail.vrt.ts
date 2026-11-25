// VRT variants for AudienceDetail (the /partner/<audience>/ pages). Covers a
// full page, a single contact without a photo, and a page whose benefits
// and contacts are still empty.
import AudienceDetail from "./AudienceDetail.astro";
import type { PartnerAudience } from "../../lib/content";

const audience: PartnerAudience = {
  label: "Startups",
  summary: "Placeholder summary.",
  linkLabel: "Partner as a startup",
  heading: "Partner with Q-Summit as a startup",
  intro:
    "Placeholder intro. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.",
  benefitsHeading: "What you get",
  benefits: Array.from({ length: 4 }, (_, i) => ({
    title: `Example benefit ${i + 1}`,
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam.",
  })),
  contactsHeading: "Your contacts",
  contactLabel: "Write an email",
  contacts: [
    {
      name: "Example Contact",
      role: "Example Startup Partnerships",
      email: "startup@example.com",
      photoFilename: "fixture-missing-photo.webp",
    },
    {
      name: "Sample Person",
      role: "Example Startup Partnerships",
      email: "startup.team@example.com",
    },
  ],
};

const parent = { label: "Partner", href: "#" };

export default {
  component: AudienceDetail,
  variants: {
    default: { audienceKey: "startup", audience, parent },
    "single-contact": {
      audienceKey: "investor",
      parent,
      audience: {
        ...audience,
        label: "Investors",
        heading: "Partner with Q-Summit as an investor",
        contacts: [{ ...audience.contacts[1]!, role: "" }],
      },
    },
    "no-benefits-or-contacts": {
      audienceKey: "corporate",
      parent,
      audience: { ...audience, benefits: [], contacts: [] },
    },
  },
};
