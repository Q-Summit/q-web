// VRT variants for HighlightCard. Covers a short name/role and a long
// name/role that must wrap.
import HighlightCard from "./HighlightCard.astro";
import type { Speaker } from "../../lib/content";

const speaker = (overrides: Partial<Speaker> = {}): { speaker: Speaker } => ({
  speaker: {
    name: "Mara Lindqvist",
    role: "Founder",
    company: "Northwind Robotics",
    roleLine: "Founder of Northwind Robotics",
    photoFilename: "mara-lindqvist.jpg",
    group: "current",
    year: 2026,
    ...overrides,
  },
});

export default {
  component: HighlightCard,
  variants: {
    default: speaker(),
    "long-name": speaker({
      name: "Alexandra Constantina Papadopoulos-Winterberg",
      roleLine:
        "Managing Director of European Partnerships at Northwind Robotics Group",
    }),
  },
};
