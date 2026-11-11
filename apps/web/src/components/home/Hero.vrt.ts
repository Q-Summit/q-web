// VRT variants for Hero. The video/poster are hardcoded in the component (no
// image prop to control), so every variant here is deterministic markup-only
// content: headline copy, the announcement line list, and the CTA.
// See docs/dev/visual-testing.md for the variant conventions.
import Hero from "./Hero.astro";

export default {
  component: Hero,
  variants: {
    default: {
      headline: "Germany's largest student-organized startup conference",
      announcement: [
        "Registration for the next edition is now open.",
        "May 14 to 15, 2027",
      ],
      cta: { label: "Get your ticket", href: "#tickets" },
    },
    "long-copy": {
      headline:
        "Where ambitious students, founders and investors come together to build the next generation of startups",
      announcement: [
        "Tickets for students, founders and corporate partners are now available.",
        "May 14 to 15, 2027, Munich",
      ],
      cta: {
        label: "Secure your spot before prices increase",
        href: "#tickets",
      },
    },
    // Badge and lead lines replace the announcement. No countdown here: a
    // running clock can never be a stable screenshot (its logic is unit
    // tested in test/countdown.test.ts).
    "badge-and-lead": {
      headline: "Sample headline for the sample edition",
      announcement: ["Not shown: the lead lines replace it."],
      cta: { label: "Get your ticket", href: "#tickets" },
      badge: "Sample badge · Sample dates · Sample city",
      leadLines: ["A first short sample line.", "A second short sample line."],
    },
    "no-announcement-no-cta": {
      headline: "Q-Summit 2027",
      announcement: [],
      cta: undefined,
    },
    german: {
      headline: "Deutschlands größte studentische Startup-Konferenz",
      announcement: [
        "Die Anmeldung für die nächste Ausgabe ist jetzt geöffnet.",
        "14. bis 15. Mai 2027",
      ],
      cta: { label: "Jetzt Ticket sichern", href: "#tickets" },
    },
  },
};
