// VRT variants for KickoffHero. Image is optional (`""` is the navy-only
// masthead). Two CTAs are the common case; one-cta covers a missing
// secondary. See docs/dev/visual-testing.md for the variant conventions.
import KickoffHero from "./KickoffHero.astro";

export default {
  component: KickoffHero,
  variants: {
    default: {
      eyebrow: "Join Q",
      headline: "Build the conference you wish you had attended",
      copy: "A recruiting landing for the next Q-Summit organizing team.",
      image: "",
      imageAlt: "",
      primaryCta: { label: "Take the team quiz", href: "#quiz" },
      secondaryCta: { label: "Way through Q", href: "#way-through-q" },
    },
    "no-secondary": {
      eyebrow: "Applications open soon",
      headline: "Meet the people who run Q",
      copy: "The next organizing cycle starts with a short quiz.",
      image: "",
      imageAlt: "",
      primaryCta: {
        label: "See the application flow",
        href: "#application-flow",
      },
      secondaryCta: { label: "", href: "" },
    },
    "long-headline": {
      eyebrow: "Join Q 2027",
      headline:
        "Germany's student-run conference is looking for the next organizing team",
      copy: "Nine weeks, one kickoff, and a quiz that points you at the team whose work matches how you like to spend a Sunday.",
      image: "",
      imageAlt: "",
      primaryCta: { label: "Start the quiz", href: "#quiz" },
      secondaryCta: { label: "Read the journey", href: "#way-through-q" },
    },
  },
};
