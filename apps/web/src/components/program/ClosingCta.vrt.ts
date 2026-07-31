// VRT variants for ClosingCta. Covers the default two-button layout, a long
// heading/text that must wrap, and the buttonless layout program.astro
// actually uses.
import ClosingCta from "./ClosingCta.astro";

export default {
  component: ClosingCta,
  variants: {
    default: {
      heading: "Ready to join us?",
      text: "Get your ticket and be part of Germany's largest student-organized startup conference.",
      primaryLabel: "Get your ticket",
      primaryHref: "#",
      secondaryLabel: "View the agenda",
      secondaryHref: "#",
      image: {
        src: "/media/program-closing-cta.jpg",
        alt: "Attendees networking in the main hall",
      },
    },
    // A long heading and paragraph that wrap to many lines: the card must grow
    // to fit the copy column rather than clip it (the image is taken out of
    // flow so it no longer caps the card height). Locks that graceful growth.
    "long-copy": {
      heading:
        "Ready to spend two days with the founders and investors shaping what comes next?",
      text: "Tickets include full access to every stage and the partner expo, and stay fully transferable up to the week before the conference.",
      primaryLabel: "Get your ticket now",
      primaryHref: "#",
      image: {
        src: "/media/program-closing-cta.jpg",
        alt: "Attendees networking in the main hall",
      },
    },
    "no-buttons": {
      heading: "See you at Q-Summit",
      text: "Ticket sales open closer to the conference date.",
      image: {
        src: "/media/program-closing-cta.jpg",
        alt: "Attendees networking in the main hall",
      },
    },
  },
};
