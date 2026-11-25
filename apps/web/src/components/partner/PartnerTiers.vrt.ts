// VRT variants for PartnerTiers. Covers tiers with names standing in
// (the fixture case: no logo files), a tier with many logos, logo images
// on plates and on the dark (missing locally, so the name fallback shows),
// a single tier with an intro, and an opening with no tiers at all.
import PartnerTiers from "./PartnerTiers.astro";
import type { PartnerTier } from "./PartnerTiers.astro";

const names = (tier: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    name: `Example ${tier} Partner ${i + 1}`,
    href: "#",
    description:
      "Example description: what the company does and what it offers at Q-Summit.",
  }));

const size = (tier: string): PartnerTier["size"] =>
  tier === "Platinum" ? "xl" : tier === "Gold" ? "l" : "m";

const tier = (name: string, count: number): PartnerTier => ({
  id: `partner-tier-${name.toLowerCase()}`,
  tab: name,
  heading: `${name} Partners`,
  size: size(name),
  logos: names(name, count),
});

const copy = {
  eyebrow: "Our partners 2026",
  heading: "The people behind Q.",
  intro: "",
  hint: "Pick a logo to learn more",
};

export default {
  component: PartnerTiers,
  variants: {
    default: {
      ...copy,
      tiers: [tier("Platinum", 4), tier("Gold", 10), tier("Silver", 18)],
    },
    "many-logos": {
      ...copy,
      tiers: [tier("Silver", 32), tier("Media", 3)],
    },
    "logo-images": {
      ...copy,
      tiers: [
        {
          ...tier("Gold", 0),
          logos: Array.from({ length: 6 }, (_, i) => ({
            name: `Example Gold Partner ${i + 1}`,
            href: "#",
            src: `/media/partner-example-${i + 1}.svg`,
            width: 160,
            height: 60,
            ...(i % 2 === 0
              ? {
                  onDark: true,
                  original: {
                    src: `/media/partner-example-${i + 1}-color.svg`,
                    width: 160,
                    height: 60,
                  },
                }
              : {}),
          })),
        },
      ],
    },
    "single-tier": {
      ...copy,
      intro: "An optional intro line under the heading.",
      tiers: [tier("Mobility", 2)],
    },
    empty: {
      ...copy,
      tiers: [],
    },
  },
};
