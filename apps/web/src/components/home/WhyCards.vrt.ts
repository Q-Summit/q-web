// VRT variants for WhyCards. The three card images are hardcoded inside the
// component (not a prop), so every variant here only varies heading/intro
// and the cards array: a normal set of three, a longer list that cycles the
// image set, long copy that must wrap, and empty.
import WhyCards from "./WhyCards.astro";
import type { WhyCard } from "./WhyCards.astro";

const cards: WhyCard[] = [
  {
    title: "World-class speakers",
    description:
      "Hear from founders, investors and operators who have built and scaled real companies.",
  },
  {
    title: "Hands-on formats",
    description:
      "Workshops and panels you can actually apply, not just another keynote to sit through.",
  },
  {
    title: "A room full of partners",
    description:
      "Meet the corporates and investors backing the next generation of student founders.",
  },
];

export default {
  component: WhyCards,
  variants: {
    default: {
      heading: "Why everyone's at Q-Summit",
      intro: "Three reasons students, founders and partners keep coming back.",
      cards,
      cta: { label: "Learn more", href: "#why-attend" },
    },
    "many-cards": {
      heading: "Why everyone's at Q-Summit",
      intro: "A longer list cycles through the same three card images.",
      cards: [
        ...cards,
        {
          title: "A stage for every idea",
          description:
            "From first-time founders to scale-ups, there is a track built for your stage.",
        },
        {
          title: "Real networking, not small talk",
          description:
            "Structured matchmaking sessions replace awkward hallway conversations.",
        },
        {
          title: "Munich's startup scene, in one hall",
          description:
            "Two days that bring the entire regional ecosystem under one roof.",
        },
      ],
      cta: undefined,
    },
    "long-copy": {
      heading: "Why founders, students and investors choose Q-Summit",
      intro:
        "Long CMS copy must wrap cleanly inside the fixed three-column grid without breaking the layout.",
      cards: [
        {
          title: "Speakers who have actually built something",
          description:
            "Every speaker on stage has founded, scaled or invested in a real company, so the advice comes from lived experience rather than theory.",
        },
        {
          title: "Formats built for doing, not just listening",
          description:
            "Workshops are capped in size and run by practitioners, so you leave with a plan you can act on the same week, not just a set of slides.",
        },
        {
          title: "Partners who are genuinely hiring and investing",
          description:
            "The partner expo brings corporates and investors who are actively looking for talent and ideas, not just showing a logo on a banner.",
        },
      ],
      cta: undefined,
    },
    empty: {
      heading: "Why everyone's at Q-Summit",
      intro: "No cards have been published yet.",
      cards: [],
      cta: undefined,
    },
  },
};
