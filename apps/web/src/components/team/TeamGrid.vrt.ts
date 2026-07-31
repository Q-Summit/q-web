// VRT variants for TeamGrid. The default grid covers the full contact-icon
// matrix (LinkedIn + mail, LinkedIn only, mail only, neither), long-name
// stresses a wrapping name next to both icons, and empty guards the
// no-members render.
import TeamGrid from "./TeamGrid.astro";
import type { TeamMember } from "../../lib/content";

const member = (overrides: Partial<TeamMember> = {}): TeamMember => ({
  name: "Nora Albrecht",
  role: "Chairperson",
  division: "Chair",
  photoFilename: "nora-albrecht.jpg",
  year: "2026",
  linkedin: "https://www.linkedin.com/in/nora-albrecht",
  email: "nora.albrecht@example.com",
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
          email: undefined,
        }),
        member({
          name: "Amira Haddad",
          role: "Head of Finance",
          division: "Finance",
          photoFilename: "amira-haddad.jpg",
          linkedin: undefined,
        }),
        member({
          name: "Sofia Marchetti",
          role: "Head of Operations",
          division: "Operations",
          photoFilename: "sofia-marchetti.jpg",
          linkedin: undefined,
          email: undefined,
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
