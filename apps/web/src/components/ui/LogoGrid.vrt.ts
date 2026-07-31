// VRT variants for LogoGrid. Covers the two skins (tier wall, hackathon
// grid), the featured (larger) card size, and the flip-card note.
import LogoGrid from "./LogoGrid.astro";
import type { LogoGridItem } from "./LogoGrid.astro";

const tierLogos: LogoGridItem[] = [
  {
    name: "Alpine Robotics",
    href: "#",
    src: "/media/partner-alpine-robotics-logo.png",
    alt: "Alpine Robotics logo",
    width: 160,
    height: 60,
  },
  {
    name: "Nordwind Capital",
    href: "#",
    src: "/media/partner-nordwind-capital-logo.png",
    alt: "Nordwind Capital logo",
    width: 160,
    height: 60,
  },
  {
    name: "Bluepeak Software",
    href: "#",
    src: "/media/partner-bluepeak-software-logo.png",
    alt: "Bluepeak Software logo",
    width: 160,
    height: 60,
  },
];

const hackLogos: LogoGridItem[] = [
  {
    name: "Rivergate Ventures",
    href: "#",
    src: "/media/partner-rivergate-ventures-logo.png",
    alt: "Rivergate Ventures logo",
    width: 160,
    height: 60,
    note: "Providing the prize pool for the winning team",
  },
  {
    name: "Foundry Systems",
    href: "#",
    src: "/media/partner-foundry-systems-logo.png",
    alt: "Foundry Systems logo",
    width: 160,
    height: 60,
    note: "On-site mentors for all 24 hours",
  },
];

export default {
  component: LogoGrid,
  variants: {
    default: {
      logos: tierLogos,
    },
    featured: {
      logos: tierLogos.slice(0, 2),
      featured: true,
    },
    hack: {
      logos: hackLogos,
      variant: "hack",
    },
    flip: {
      logos: hackLogos,
      variant: "hack",
      flip: true,
    },
    empty: {
      logos: [],
    },
  },
};
