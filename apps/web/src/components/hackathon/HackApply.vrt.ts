// VRT variants for HackApply, the poster-style apply link shared by the hero
// and the closing band: an external link (shows the destination host), the
// smaller closing size, and an in-page anchor (no host line). See
// docs/dev/visual-testing.md.
import HackApply from "./HackApply.astro";

export default {
  component: HackApply,
  variants: {
    default: {
      cta: { label: "Apply now", href: "https://events.mlh.com/" },
      placement: "hero",
    },
    medium: {
      cta: { label: "Apply now", href: "https://events.mlh.com/" },
      placement: "closing",
      size: "medium",
    },
    anchor: {
      cta: { label: "See what to expect", href: "#join-hack" },
      placement: "hero",
    },
  },
};
