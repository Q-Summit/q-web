// VRT variants for PartnerDialog, the pop-up a partner opens on the
// partner page. It is closed until the script opens it, so the variants
// render it open through its preview prop: with a description, and without
// one (the logo plate and the website button only).
import PartnerDialog from "./PartnerDialog.astro";

export default {
  component: PartnerDialog,
  variants: {
    default: {
      websiteLabel: "Visit website",
      preview: {
        tier: "Gold Partner",
        name: "Example Gold Partner",
        description:
          "Example description: what the company does and what it offers at Q-Summit, in two or three sentences.",
      },
    },
    "no-description": {
      websiteLabel: "Visit website",
      preview: { tier: "Media Partner", name: "Example Media Partner" },
    },
  },
};
