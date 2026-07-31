// VRT variants for SpeakerCard. Covers the default portrait card, a long
// name/role that must wrap, and the eager/priority LCP variant used for
// the first card.
import SpeakerCard from "./SpeakerCard.astro";
import type { Speaker } from "../../lib/content";

const speaker = (overrides: Partial<Speaker> = {}): Speaker => ({
  name: "Elena Vasquez",
  role: "Co-Founder",
  company: "Solaris Freight",
  roleLine: "Co-Founder of Solaris Freight",
  photoFilename: "elena-vasquez.jpg",
  group: "current",
  year: 2026,
  ...overrides,
});

export default {
  component: SpeakerCard,
  variants: {
    default: { speaker: speaker() },
    "long-name": {
      speaker: speaker({
        name: "Maximilian von Falkenstein-Herrenberg",
        roleLine:
          "Managing Partner and Head of Climate Investments at Solaris Freight Ventures",
      }),
    },
    priority: {
      speaker: speaker({ name: "Elena Vasquez" }),
      eager: true,
      priority: true,
    },
  },
};
