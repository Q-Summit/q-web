// VRT variants for CategoryAccordion. Exercises the accordion content edges:
// a normal set of categories, a long bullet list that must wrap, and empty.
// See docs/dev/visual-testing.md for the variant conventions.
import CategoryAccordion from "./CategoryAccordion.astro";

export default {
  component: CategoryAccordion,
  variants: {
    default: {
      heading: "Explore our ticket categories",
      details: [
        {
          label: "Student",
          bullets: [
            "Full access to every stage and workshop",
            "Entry to the partner expo",
            "Evening networking event ticket",
          ],
        },
        {
          label: "Professional",
          bullets: [
            "Full access to every stage and workshop",
            "Priority seating at keynote sessions",
            "Access to the founders lounge",
          ],
        },
        {
          label: "Startup",
          bullets: ["A shared exhibition table", "Two conference passes"],
        },
      ],
    },
    "long-bullets": {
      heading: "Ticket categories",
      details: [
        {
          label: "Student",
          bullets: [
            "Full access to every stage, workshop and hands-on session across both conference days, plus standby entry to any sold-out breakout room",
            "Complimentary entry to the partner expo, where more than fifty companies present internship and graduate roles",
          ],
        },
      ],
    },
    empty: {
      heading: "Ticket categories",
      details: [],
    },
  },
};
