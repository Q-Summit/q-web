// VRT variants for TeamPanels. Renders BOTH panels every time (visibility is
// CSS `hidden`, not conditional rendering), so `active` mainly flips which
// one is visible in the screenshot. Covers the current-team panel, the
// history panel, and an empty history list.
import TeamPanels from "./TeamPanels.astro";
import type { TeamMember } from "../../lib/content";
import type { DivisionGroup, PastYearEntry } from "../../lib/team";

const member = (overrides: Partial<TeamMember> = {}): TeamMember => ({
  name: "Nora Albrecht",
  role: "Chairperson",
  division: "Chair",
  photoFilename: "nora-albrecht.jpg",
  year: "2026",
  linkedin: "https://www.linkedin.com/in/nora-albrecht",
  ...overrides,
});

const divisions: DivisionGroup[] = [
  {
    division: "Chair",
    members: [member()],
  },
  {
    division: "Operations",
    members: [
      member({
        name: "Sofia Marchetti",
        role: "Head of Operations",
        division: "Operations",
        photoFilename: "sofia-marchetti.jpg",
        linkedin: undefined,
      }),
    ],
  },
];

const pastYear = (overrides: Partial<PastYearEntry> = {}): PastYearEntry => ({
  year: "2025",
  photo: { src: "/media/team-2025.jpg", srcset: undefined },
  image: undefined,
  size: { width: 1600, height: 1067 },
  ...overrides,
});

export default {
  component: TeamPanels,
  variants: {
    "current-active": {
      active: "current" as const,
      divisions,
      pastYears: [pastYear()],
      pastIntro: "One group photo per year the board has served.",
      currentTitle: "Our Team | Q-Summit",
      pastTitle: "History | Q-Summit",
    },
    "past-active": {
      active: "past" as const,
      divisions,
      pastYears: [
        pastYear({ year: "2025" }),
        pastYear({
          year: "2024",
          photo: { src: "/media/team-2024.jpg", srcset: undefined },
        }),
      ],
      pastIntro: "One group photo per year the board has served.",
      currentTitle: "Our Team | Q-Summit",
      pastTitle: "History | Q-Summit",
    },
    "past-empty": {
      active: "past" as const,
      divisions,
      pastYears: [],
      pastIntro: "No past team photos have been published yet.",
      currentTitle: "Our Team | Q-Summit",
      pastTitle: "History | Q-Summit",
    },
  },
};
