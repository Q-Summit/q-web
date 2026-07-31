// VRT variants for TeamToggle. Fully deterministic (no images): covers the
// thumb sitting under each of the two fixed tabs.
import TeamToggle from "./TeamToggle.astro";

export default {
  component: TeamToggle,
  variants: {
    current: { active: "current" as const },
    past: { active: "past" as const },
  },
};
