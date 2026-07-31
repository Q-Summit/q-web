// VRT variants for Hero. The video/poster are hardcoded in the component (no
// image prop to control), so every variant here is deterministic markup-only
// content: headline/tagline copy, the announcement line list, and the CTA.
// See docs/dev/visual-testing.md for the variant conventions.
import Hero from "./Hero.astro";

export default {
  component: Hero,
  variants: {
    default: {
      headline: "Germany's largest student-organized startup conference",
      tagline: "Two days of keynotes, workshops and networking in Munich.",
      announcement: [
        "Registration for the next edition is now open.",
        "May 14 to 15, 2027",
      ],
      cta: { label: "Get your ticket", href: "#tickets" },
    },
    "long-copy": {
      headline:
        "Where ambitious students, founders and investors come together to build the next generation of startups",
      tagline:
        "A full two days of keynotes, hands-on workshops, panel discussions and evening networking events, hosted at the heart of Munich's startup scene.",
      announcement: [
        "Tickets for students, founders and corporate partners are now available.",
        "May 14 to 15, 2027, Munich",
      ],
      cta: {
        label: "Secure your spot before prices increase",
        href: "#tickets",
      },
    },
    "no-announcement-no-cta": {
      headline: "Q-Summit 2027",
      tagline: "Details for the next edition will follow soon.",
      announcement: [],
      cta: undefined,
    },
    german: {
      headline: "Deutschlands größte studentische Startup-Konferenz",
      tagline: "Zwei Tage Keynotes, Workshops und Networking in München.",
      announcement: [
        "Die Anmeldung für die nächste Ausgabe ist jetzt geöffnet.",
        "14. bis 15. Mai 2027",
      ],
      cta: { label: "Jetzt Ticket sichern", href: "#tickets" },
    },
  },
};
