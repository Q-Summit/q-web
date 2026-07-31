// VRT variants for FaqAccordion. Exercises the content-length edges a CMS
// produces: a normal set, many items, long answers that must wrap, and empty.
import FaqAccordion from "./FaqAccordion.astro";

// Realistic long English copy (not lorem ipsum): it wraps like real CMS answers
// and keeps the spell checker clean. See docs/dev/visual-testing.md.
const LONG =
  "Q-Summit brings together thousands of ambitious students, founders and investors for two days of keynotes, workshops and hands-on sessions. Tickets include full access to every stage, the partner expo and the evening networking events, and are fully transferable up to the week before the conference. ";

const faqs = (n: number, opts: { long?: boolean } = {}) =>
  Array.from({ length: n }, (_, i) => ({
    question: `What does question number ${i + 1} actually cover?`,
    answerHtml: opts.long
      ? `<p>${LONG.repeat(6)}</p>`
      : "<p>A short, concise answer.</p>",
    page: "index" as const,
  }));

export default {
  component: FaqAccordion,
  variants: {
    default: {
      heading: "Frequently asked questions",
      intro: "Everything you need to know before you join.",
      faqs: faqs(4),
      cta: { label: "More questions", href: "#" },
    },
    "many-items": {
      heading: "FAQ",
      intro: "A long list stresses vertical rhythm and spacing.",
      faqs: faqs(12),
      cta: undefined,
    },
    "long-answers": {
      heading: "FAQ",
      intro: "Long CMS answers must wrap cleanly, not overflow.",
      faqs: faqs(3, { long: true }),
      cta: undefined,
    },
    empty: {
      heading: "FAQ",
      intro: "No questions have been published yet.",
      faqs: [],
      cta: undefined,
    },
  },
};
