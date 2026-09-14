// VRT variants for KickoffFinalCta. Closed shows Coming Soon; open
// uses the Apply label. Ice around the navy card (after the hero).
import KickoffFinalCta from "./KickoffFinalCta.astro";

export default {
  component: KickoffFinalCta,
  variants: {
    default: {
      eyebrow: "Ready for Q?",
      heading: "Become part of the Q family.",
      copy: "Explore the teams, then send the form.",
      cta: { label: "Apply now", href: "#application-flow" },
      isOpen: false,
      applicationUrl: "",
      comingSoonLabel: "Coming Soon",
    },
    open: {
      eyebrow: "Ready for Q?",
      heading: "Become part of the Q family.",
      copy: "Explore the teams, then send the form.",
      cta: { label: "Apply now", href: "#application-flow" },
      isOpen: true,
      applicationUrl: "https://example.com/apply",
      comingSoonLabel: "Coming Soon",
    },
  },
};
