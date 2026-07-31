// VRT variants for PageFaqAccordion. Exercises the two header alignments
// (left for /program, center for /hackathon), plus the content-length edges
// a CMS produces: many items, long answers that must wrap, and empty. See
// docs/dev/visual-testing.md for the variant conventions.
import PageFaqAccordion from "./PageFaqAccordion.astro";

// Realistic long English copy (not lorem ipsum): it wraps like real CMS
// answers and keeps the spell checker clean.
const LONG =
  "Q-Summit brings together thousands of ambitious students, founders and investors for two days of keynotes, workshops and hands-on sessions. Tickets include full access to every stage, the partner expo and the evening networking events, and are fully transferable up to the week before the conference. ";

const faqs = (n: number, opts: { long?: boolean } = {}) =>
  Array.from({ length: n }, (_, i) => ({
    question: `What does question number ${i + 1} actually cover?`,
    answerHtml: opts.long
      ? `<p>${LONG.repeat(6)}</p>`
      : "<p>A short, concise answer.</p>",
    page: "program" as const,
  }));

export default {
  component: PageFaqAccordion,
  variants: {
    default: {
      heading: "Frequently asked questions",
      intro: "Everything you need to know before the schedule locks in.",
      faqs: faqs(4),
      headerAlign: "left",
    },
    centered: {
      heading: "Hackathon FAQ",
      intro: "Questions specific to the 24-hour build weekend.",
      faqs: faqs(4),
      headerAlign: "center",
    },
    "many-items": {
      heading: "FAQ",
      intro: "A long list stresses vertical rhythm and spacing.",
      faqs: faqs(12),
    },
    "long-answers": {
      heading: "FAQ",
      intro: "Long CMS answers must wrap cleanly, not overflow.",
      faqs: faqs(3, { long: true }),
    },
    empty: {
      heading: "FAQ",
      faqs: [],
    },
  },
};
