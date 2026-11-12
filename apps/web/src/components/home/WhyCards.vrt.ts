// VRT variants for WhyCards (the home audience tiles). The photos are
// content (imageFile), so variants cover tiles with and without a photo,
// with and without a link, long copy that must wrap, and fewer than four.
// See docs/dev/visual-testing.md.
import WhyCards from "./WhyCards.astro";
import type { WhyCard } from "./WhyCards.astro";

const cards: WhyCard[] = [
  {
    eyebrow: "For sample talents",
    title: "Sample students",
    description:
      "Sample copy about workshops and direct access to roles, two short lines.",
    href: "#students",
    linkLabel: "Learn more",
  },
  {
    eyebrow: "For sample founders",
    title: "Sample startups",
    description: "Sample copy about pitching in front of investors.",
    href: "#startups",
    linkLabel: "Learn more",
  },
  {
    eyebrow: "For sample companies",
    title: "Sample corporates",
    description: "Sample copy about meeting participants and scouting.",
    href: "#corporates",
    linkLabel: "Learn more",
  },
  {
    eyebrow: "For sample investors",
    title: "Sample investors",
    description: "Sample copy about the jury and early-stage startups.",
    href: "#investors",
    linkLabel: "Learn more",
  },
];

export default {
  component: WhyCards,
  variants: {
    default: {
      eyebrow: "Sample eyebrow",
      heading: "Why everyone is at the sample summit",
      intro: "Pick a sample role and see what is in store.",
      cards,
    },
    "long-copy": {
      heading:
        "A long sample heading that has to wrap onto a second line on every screen",
      intro:
        "A longer sample introduction that runs to a second line so the centered header shows how it wraps.",
      cards: cards.map((card) => ({
        ...card,
        title: `${card.title} and sample young professionals`,
        description: `${card.description} ${card.description} ${card.description}`,
      })),
    },
    "plain-no-links": {
      heading: "Tiles without links",
      intro: "Older content has neither link nor eyebrow.",
      cards: cards.slice(0, 3).map(({ title, description }) => ({
        title,
        description,
      })),
    },
    empty: {
      heading: "No tiles",
      intro: "Nothing published yet.",
      cards: [],
    },
  },
};
