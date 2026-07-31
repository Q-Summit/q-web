// VRT variants for HackPartners. Covers multiple partner tiers with notes,
// a single tier, and an empty partner list.
import HackPartners from "./HackPartners.astro";

export default {
  component: HackPartners,
  variants: {
    default: {
      heading: "Our partners",
      groups: [
        {
          group: "Challenge Partners",
          partners: [
            {
              name: "Nova Cloud",
              href: "#",
              logoFile: "nova-cloud-logo.svg",
              note: "Best use of the Nova Cloud API",
            },
            {
              name: "Brightline Robotics",
              href: "#",
              logoFile: "brightline-logo.svg",
              note: "Best hardware hack",
            },
          ],
        },
        {
          group: "Infrastructure Partners",
          partners: [
            {
              name: "Hostwave",
              href: "#",
              logoFile: "hostwave-logo.svg",
              note: null,
            },
          ],
        },
        {
          group: "Ecosystem Partners",
          partners: [
            {
              name: "Founders Guild",
              href: "#",
              logoFile: "founders-guild-logo.svg",
              note: null,
            },
          ],
        },
      ],
    },
    "single-tier": {
      heading: "Challenge partners",
      groups: [
        {
          group: "Challenge Partners",
          partners: [
            {
              name: "Nova Cloud",
              href: "#",
              logoFile: "nova-cloud-logo.svg",
              note: "Best use of the Nova Cloud API",
            },
          ],
        },
      ],
    },
    empty: {
      heading: "Our partners",
      groups: [],
    },
  },
};
