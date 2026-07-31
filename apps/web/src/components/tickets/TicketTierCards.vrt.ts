// VRT variants for TicketTierCards. Stresses the five-column card grid: a
// full default set, a long feature list that must wrap within a fixed card,
// and a short set with fewer tiers. See docs/dev/visual-testing.md.
import TicketTierCards from "./TicketTierCards.astro";

export default {
  component: TicketTierCards,
  variants: {
    default: {
      heading: "Get your ticket",
      intro: "Choose the tier that fits how you want to experience Q-Summit.",
      tiers: [
        {
          name: "Student",
          price: "€49",
          features: [
            "Full conference access",
            "Partner expo entry",
            "Networking evening",
          ],
          buyLabel: "Buy ticket",
          buyHref: "#",
        },
        {
          name: "Professional",
          price: "€199",
          features: [
            "Full conference access",
            "Founders lounge access",
            "Priority seating",
          ],
          note: "Includes lunch on both days.",
          buyLabel: "Buy ticket",
          buyHref: "#",
        },
        {
          name: "Startup",
          price: "€349",
          features: ["Full conference access", "Shared exhibition table"],
          buyLabel: "Buy ticket",
          buyHref: "#",
        },
      ],
    },
    "long-features": {
      heading: "Ticket tiers",
      intro: "Long CMS feature copy must wrap inside a narrow card column.",
      tiers: [
        {
          name: "Professional",
          price: "€199",
          features: [
            "Full access to every keynote, workshop and hands-on session across both conference days",
            "Guaranteed seating at the founders lounge fireside chats, reserved for this tier only",
          ],
          note: "Transferable up to one week before the conference.",
          buyLabel: "Buy your professional ticket",
          buyHref: "#",
        },
      ],
    },
    few: {
      heading: "Ticket tiers",
      intro: "Only two tiers on sale right now.",
      tiers: [
        {
          name: "Student",
          price: "€49",
          features: ["Full conference access"],
          buyLabel: "Buy ticket",
          buyHref: "#",
        },
        {
          name: "Startup",
          price: "€349",
          features: ["Full conference access", "Shared exhibition table"],
          buyLabel: "Buy ticket",
          buyHref: "#",
        },
      ],
    },
  },
};
