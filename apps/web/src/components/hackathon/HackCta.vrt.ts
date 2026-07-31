// VRT variants for HackCta. Covers the optional tagline text and the
// two-column-to-stacked layout under long copy. See
// docs/dev/visual-testing.md for the variant conventions.
import HackCta from "./HackCta.astro";

export default {
  component: HackCta,
  variants: {
    default: {
      heading: "Ready to build something in 24 hours?",
      text: "Applications close two weeks before the event.",
      ctaLabel: "Apply now",
      ctaHref: "#",
    },
    "no-text": {
      heading: "Questions? Reach out to the organizing team.",
      ctaLabel: "Contact us",
      ctaHref: "#",
    },
    "long-text": {
      heading: "Still deciding whether Q-Hackathon is right for you?",
      text: "Teams of one to four are welcome, no prior hackathon experience is required, and every participant leaves with a certificate, a goodie bag and a project they can add straight to their portfolio.",
      ctaLabel: "Talk to the organizing team",
      ctaHref: "#",
    },
  },
};
