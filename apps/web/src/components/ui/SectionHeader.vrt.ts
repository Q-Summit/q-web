// VRT variants for the SectionHeader primitive. It wraps slotted content in
// the centered opener; the stress case is copy long enough to wrap across
// two lines. `children` is a plain string filling the default slot (like
// Button's label), not markup. See docs/dev/visual-testing.md.
import SectionHeader from "./SectionHeader.astro";

export default {
  component: SectionHeader,
  variants: {
    default: {
      children: "Frequently asked questions",
    },
    "long-heading": {
      children:
        "Everything ambitious students, founders and investors need to know before the conference",
    },
    "extra-class": {
      class: "u-eyebrow",
      children: "Our partners",
    },
  },
};
