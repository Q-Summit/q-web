// VRT variants for PartnerLogos. Stresses the strip's repeat computation
// with different logo counts, logos of very different proportions (the
// equal-area sizing), a row without a description, and the empty
// short-circuit. See docs/dev/visual-testing.md.
import PartnerLogos, { type PartnerLogoGroup } from "./PartnerLogos.astro";

const logo = (name: string, width: number, height: number) => ({
  name,
  href: "#",
  src: `/media/partner-${name.toLowerCase().replace(/\s+/g, "-")}.svg`,
  width,
  height,
});

const defaultGroups: PartnerLogoGroup[] = [
  {
    label: "Sample startups",
    description: "Sample founders",
    logos: [
      logo("Northwind Capital", 160, 40),
      logo("Bluepeak Systems", 140, 40),
      logo("Rivertech Labs", 150, 45),
      logo("Solace Bank", 120, 40),
      logo("Cedar Analytics", 155, 42),
    ],
  },
  {
    label: "Sample corporates",
    description: "Sample companies",
    logos: [
      logo("Wide Wordmark Holdings", 400, 40),
      logo("Square Mark", 80, 80),
      logo("Tall Mark", 40, 90),
    ],
  },
  {
    label: "Sample network",
    logos: [
      logo("Founders Guild", 130, 38),
      logo("Startup Alliance Bavaria", 170, 40),
    ],
  },
];

export default {
  component: PartnerLogos,
  variants: {
    default: {
      eyebrow: "Sample partners",
      heading: "Partners of the sample edition",
      groups: defaultGroups,
      cta: { label: "View all sample partners", href: "#partners" },
    },
    "one-row-no-cta": {
      heading: "One row",
      groups: defaultGroups.slice(0, 1),
    },
    empty: {
      heading: "No partners yet",
      groups: [],
    },
  },
};
