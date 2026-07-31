// VRT variants for ModeratorCard. Covers a short name/role and a long
// name/role that must wrap next to the "Moderator" badge.
import ModeratorCard from "./ModeratorCard.astro";
import type { Speaker } from "../../lib/content";

const speaker = (overrides: Partial<Speaker> = {}): { speaker: Speaker } => ({
  speaker: {
    name: "Jonas Reiter",
    role: "Editor",
    company: "Weekly Founder Digest",
    roleLine: "Editor-in-Chief of Weekly Founder Digest",
    photoFilename: "jonas-reiter.jpg",
    group: "moderation",
    year: 2026,
    ...overrides,
  },
});

export default {
  component: ModeratorCard,
  variants: {
    default: speaker(),
    "long-name": speaker({
      name: "Anna-Sophie Bergstrom-Kowalczyk",
      roleLine:
        "Senior Director of Innovation Partnerships and Venture Programs at Weekly Founder Digest",
    }),
  },
};
