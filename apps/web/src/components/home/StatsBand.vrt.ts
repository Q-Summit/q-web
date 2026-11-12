// VRT variants for StatsBand. Content stresses the layout the way real CMS data
// will: the default set, long labels that must wrap inside a tile, and a short
// set. See docs/dev/visual-testing.md for the variant conventions.
import StatsBand from "./StatsBand.astro";

export default {
  component: StatsBand,
  variants: {
    default: {
      tagline: "A sample tagline that heads the sample figures",
      heading: "Q-Summit in numbers",
      stats: [
        { value: "3000", label: "Attendees" },
        { value: "120+", label: "Speakers" },
        { value: "2", label: "Days" },
        { value: "50+", label: "Partners" },
      ],
    },
    "long-labels": {
      heading: "Impact",
      stats: [
        {
          value: "3,000",
          label: "Ambitious students, founders and investors in one hall",
        },
        {
          value: "120",
          label: "International keynote speakers and workshop hosts",
        },
      ],
    },
    few: {
      heading: "Numbers",
      stats: [
        { value: "10", label: "Years" },
        { value: "1", label: "Mission" },
      ],
    },
  },
};
