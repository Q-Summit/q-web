// VRT variants for TeamToggle. Fully deterministic (no images): covers the
// thumb sitting under each of the two tabs (labels as the CMS defaults).
import TeamToggle from "./TeamToggle.astro";

export default {
  component: TeamToggle,
  variants: {
    current: {
      active: "current" as const,
      currentLabel: "Current Team",
      pastLabel: "History",
    },
    past: {
      active: "past" as const,
      currentLabel: "Current Team",
      pastLabel: "History",
    },
  },
};
