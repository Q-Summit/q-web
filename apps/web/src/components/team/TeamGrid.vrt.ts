// VRT variants for TeamGrid. Covers a normal division, a long name that
// must wrap next to the LinkedIn icon, a member without a LinkedIn link,
// and an empty grid.
import TeamGrid from "./TeamGrid.astro";
import type { TeamMember } from "../../lib/content";

const member = (overrides: Partial<TeamMember> = {}): TeamMember => ({
  name: "Nora Albrecht",
  role: "Chairperson",
  division: "Chair",
  photoFilename: "nora-albrecht.jpg",
  year: "2026",
  linkedin: "https://www.linkedin.com/in/nora-albrecht",
  ...overrides,
});

export default {
  component: TeamGrid,
  variants: {
    default: {
      members: [
        member(),
        member({
          name: "Tobias Kramer",
          role: "Vice Chair",
          photoFilename: "tobias-kramer.jpg",
        }),
        member({
          name: "Sofia Marchetti",
          role: "Head of Operations",
          division: "Operations",
          photoFilename: "sofia-marchetti.jpg",
          linkedin: undefined,
        }),
      ],
    },
    "long-name": {
      members: [
        member({
          name: "Konstantina Papadimitriou-Wesselmann",
          role: "Head of Partner Relations and Sponsorship Development",
        }),
      ],
    },
    empty: { members: [] },
  },
};
