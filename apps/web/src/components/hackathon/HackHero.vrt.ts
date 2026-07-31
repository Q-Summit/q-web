// VRT variants for HackHero. `cta` is optional (PageLink | undefined) and
// `tagline` is optional. No image props are involved: the background video
// is a fixed static asset rendered by the component itself, not passed as a
// prop, so every variant here stays deterministic. See
// docs/dev/visual-testing.md for the variant conventions.
import HackHero from "./HackHero.astro";

export default {
  component: HackHero,
  variants: {
    default: {
      headline: "Q-Hackathon 2026",
      tagline: "24 hours, one weekend, no limits on what you build.",
      cta: { label: "Apply now", href: "#" },
    },
    "no-cta-no-tagline": {
      headline: "Registration opens soon",
      cta: undefined,
    },
    "long-headline": {
      headline:
        "Germany's largest student hackathon returns for its fifth year",
      tagline:
        "Bring a team or find one on site, then spend 24 hours turning an idea into a working demo alongside mentors from our partner companies.",
      cta: { label: "Learn more about the tracks", href: "#" },
    },
  },
};
