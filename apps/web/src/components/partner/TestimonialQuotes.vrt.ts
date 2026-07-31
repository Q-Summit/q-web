// VRT variants for TestimonialQuotes. Covers the default two-up grid, a
// long quote that must wrap, an attribution with no company, and an empty
// list.
import TestimonialQuotes from "./TestimonialQuotes.astro";
import type { PartnerTestimonial } from "../../lib/content";

const testimonials: PartnerTestimonial[] = [
  {
    quote:
      "Sponsoring Q-Summit gave us direct access to the founders and engineers we actually want to hire.",
    attribution: "Mara Feldmann, Nordwind Capital",
  },
  {
    quote:
      "The partner expo was packed the entire two days, and the student volunteers were sharp and organized.",
    attribution: "Tobias Wagner, Bluepeak Ventures",
  },
];

export default {
  component: TestimonialQuotes,
  variants: {
    default: {
      testimonials,
    },
    "long-quote": {
      testimonials: [
        {
          quote:
            "Working with the Q-Summit team was seamless from the first call to the final teardown: they briefed our recruiters thoroughly, scheduled back-to-back founder meetings across both days and followed up with a detailed report on every lead we made at the booth.",
          attribution: "Katharina Hoffmann, Harborline Bank",
        },
      ],
    },
    "no-company": {
      testimonials: [
        {
          quote:
            "A genuinely well-run event with an audience that shows up ready to talk business.",
          attribution: "Jonas Richter",
        },
      ],
    },
    empty: {
      testimonials: [],
    },
  },
};
