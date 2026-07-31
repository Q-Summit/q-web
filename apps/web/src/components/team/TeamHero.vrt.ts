// VRT variants for TeamHero. The background image is a fixed constant
// (TEAM_HERO_PHOTO), not a prop, so only the title varies. Covers the
// default title and a long title that must wrap over the hero image.
import TeamHero from "./TeamHero.astro";

export default {
  component: TeamHero,
  variants: {
    default: { title: "Our Team" },
    "long-title": {
      title: "The Volunteers Who Built Q-Summit 2026, Division by Division",
      lpTitle: "heading",
    },
  },
};
