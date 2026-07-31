// VRT variants for AgendaTimeline. Covers a normal agenda, long
// descriptions that must wrap, and a short single-item agenda. See
// docs/dev/visual-testing.md for the variant conventions.
import AgendaTimeline from "./AgendaTimeline.astro";

export default {
  component: AgendaTimeline,
  variants: {
    default: {
      heading: "Conference agenda",
      intro: "Two days of keynotes, workshops and networking.",
      items: [
        {
          date: "Day 1, 09:00",
          title: "Doors open and registration",
          description:
            "Pick up your badge and grab a coffee before the opening keynote.",
        },
        {
          date: "Day 1, 10:00",
          title: "Opening keynote",
          description:
            "A look at the state of the startup ecosystem in Europe.",
        },
        {
          date: "Day 2, 17:00",
          title: "Closing ceremony",
          description: "Awards, thank-yous and a look ahead to next year.",
        },
      ],
      images: [undefined, undefined, undefined],
    },
    "long-descriptions": {
      heading: "Agenda",
      intro: "Long CMS descriptions must wrap without breaking the row layout.",
      items: [
        {
          date: "Day 1, 11:00",
          title: "Workshop track: From idea to first customer",
          description:
            "A hands-on afternoon of parallel workshops led by founders and investors, covering everything from validating a first idea to closing a first paying customer, with small-group exercises after each session.",
        },
      ],
      images: [undefined],
    },
    few: {
      heading: "Agenda",
      intro: "Only one session confirmed so far.",
      items: [
        {
          date: "Day 1, 09:00",
          title: "Doors open",
          description: "Registration and welcome coffee.",
        },
      ],
      images: [undefined],
    },
  },
};
