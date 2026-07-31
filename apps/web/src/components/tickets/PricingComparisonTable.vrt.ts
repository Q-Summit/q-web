// VRT variants for PricingComparisonTable. The dense grid is the layout risk,
// so variants stress column count and feature-name length rather than list
// size. See docs/dev/visual-testing.md for the variant conventions.
import PricingComparisonTable from "./PricingComparisonTable.astro";

export default {
  component: PricingComparisonTable,
  variants: {
    default: {
      heading: "Compare ticket tiers",
      intro: "Every benefit at a glance, across all five ticket tiers.",
      comparison: {
        tiers: [
          { name: "Student", price: "€49", audience: "Enrolled students" },
          { name: "Professional", price: "€199", audience: "Industry guests" },
          { name: "Startup", price: "€349", audience: "Founding teams" },
        ],
        groups: [
          {
            group: "Conference access",
            rows: [
              {
                feature: "Keynote and workshop stages",
                included: [true, true, true],
              },
              { feature: "Partner expo entry", included: [true, true, true] },
            ],
          },
          {
            group: "Ticket-specific privileges",
            rows: [
              {
                feature: "Founders lounge access",
                included: [false, true, true],
              },
              {
                feature: "Exhibition table",
                included: [false, false, true],
              },
            ],
          },
        ],
      },
      academicNote:
        "Enrolled students receive the discounted rate with a valid university email address.",
    },
    "long-feature-names": {
      heading: "Ticket comparison",
      intro: undefined,
      comparison: {
        tiers: [
          { name: "Student", price: "€49", audience: "Enrolled students" },
          { name: "Professional", price: "€199", audience: "Industry guests" },
        ],
        groups: [
          {
            group: "Conference access",
            rows: [
              {
                feature:
                  "Priority standby entry to fully booked workshop sessions on both conference days",
                included: [true, true],
              },
            ],
          },
        ],
      },
      academicNote:
        "Enrolled students receive the discounted rate with a valid university email address.",
    },
    "many-tiers": {
      heading: "Compare all ticket tiers",
      intro: "Five tiers side by side, the widest the table gets.",
      comparison: {
        tiers: [
          { name: "Student", price: "€49", audience: "Enrolled students" },
          { name: "Professional", price: "€199", audience: "Industry guests" },
          { name: "Startup", price: "€349", audience: "Founding teams" },
          { name: "Partner", price: "€599", audience: "Sponsoring companies" },
          { name: "Speaker", price: "Free", audience: "Invited speakers" },
        ],
        groups: [
          {
            group: "Conference access",
            rows: [
              {
                feature: "Keynote and workshop stages",
                included: [true, true, true, true, true],
              },
              {
                feature: "Partner expo entry",
                included: [true, true, true, true, true],
              },
            ],
          },
        ],
      },
      academicNote:
        "Enrolled students receive the discounted rate with a valid university email address.",
    },
  },
};
