// VRT variants for LogoWall. Covers the featured/non-featured heading
// scale, item counts (a few logos, many logos), and an empty logo list.
import LogoWall from "./LogoWall.astro";

const logo = (name: string, i: number) => ({
  name,
  href: "#",
  src: `/media/partner-${i}.svg`,
  width: 160,
  height: 80,
});

export default {
  component: LogoWall,
  variants: {
    default: {
      id: "gold",
      heading: "Gold Partners",
      logos: [
        logo("Nordwind Capital", 1),
        logo("Bluepeak Ventures", 2),
        logo("Harborline Bank", 3),
      ],
    },
    featured: {
      id: "platinum",
      heading: "Platinum Partners",
      featured: true,
      logos: [logo("Nordwind Capital", 1), logo("Bluepeak Ventures", 2)],
    },
    "many-items": {
      id: "silver",
      heading: "Silver Partners",
      logos: Array.from({ length: 10 }, (_, i) =>
        logo(`Partner ${i + 1}`, i + 1),
      ),
    },
    empty: {
      id: "bronze",
      heading: "Bronze Partners",
      logos: [],
    },
  },
};
