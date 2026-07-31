// VRT variants for Timeline. Covers the alternating-side layout with and
// without images per row, the reveal opt-in, and a long description that
// must wrap.
import Timeline from "./Timeline.astro";
import type { AgendaItem } from "../../lib/content";
import type { TimelineImage } from "./Timeline.astro";

const items: AgendaItem[] = [
  {
    date: "Day 1, 09:00",
    title: "Doors open and registration",
    description: "Badge pickup, coffee and the first round of networking.",
  },
  {
    date: "Day 1, 11:00",
    title: "Opening keynote",
    description: "A founder's take on scaling a company from zero to exit.",
  },
  {
    date: "Day 1, 14:00",
    title: "Workshop tracks",
    description: "Parallel sessions on fundraising, product and growth.",
  },
];

const images: (TimelineImage | undefined)[] = [
  { src: "/media/program-registration.jpg", alt: "Attendees at registration" },
  { src: "/media/program-keynote.jpg", alt: "Speaker on the main stage" },
  undefined,
];

export default {
  component: Timeline,
  variants: {
    default: {
      items,
      images,
    },
    "no-images": {
      items,
      images: [undefined, undefined, undefined],
    },
    reveal: {
      items,
      images,
      reveal: true,
    },
    "long-description": {
      items: [
        {
          date: "Day 2, 10:00",
          title: "Panel: from student project to funded startup",
          description:
            "Three founders who started their companies as student projects walk through the decisions that took them from a dorm-room prototype to a funded, growing team, and take audience questions for the last twenty minutes.",
        },
      ],
      images: [undefined],
    },
  },
};
