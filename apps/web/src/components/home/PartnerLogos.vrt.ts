// VRT variants for PartnerLogos. Stresses the marquee's repeat-computation
// (repeatsFor) with different logo counts and the empty-groups short-circuit.
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
    value: "50",
    label: "Startup and corporate partners",
    logos: [
      logo("Northwind Capital", 160, 40),
      logo("Bluepeak Systems", 140, 40),
      logo("Rivertech Labs", 150, 45),
      logo("Solace Bank", 120, 40),
      logo("Cedar Analytics", 155, 42),
    ],
  },
  {
    value: "12",
    label: "Network partners",
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
      groups: defaultGroups,
      cta: { label: "Become a partner", href: "#partners" },
    },
    "many-logos": {
      groups: [
        {
          value: "80",
          label: "Startup and corporate partners",
          logos: Array.from({ length: 16 }, (_, i) =>
            logo(`Partner Company ${i + 1}`, 140, 40),
          ),
        },
      ],
      cta: undefined,
    },
    "single-logo": {
      groups: [
        {
          value: "1",
          label: "Network partners",
          logos: [logo("Founders Guild", 130, 38)],
        },
      ],
      cta: undefined,
    },
    empty: {
      groups: [],
      cta: undefined,
    },
  },
};
