// VRT variants for the Container primitive. It emits a single
// <div class="container">, so the only thing to stress is the slot content:
// a normal line of copy, and text long enough to prove the max-width clamps
// it instead of letting it stretch edge to edge on a wide screen. `children`
// is a plain string (it fills the default slot as text, like Button's
// label), not markup. See docs/dev/visual-testing.md.
import Container from "./Container.astro";

export default {
  component: Container,
  variants: {
    default: {
      children:
        "The Q-Summit team reviews every application within two weeks of the submission deadline.",
    },
    "long-content": {
      children:
        "Q-Summit brings together thousands of ambitious students, founders and investors for two days of keynotes, workshops and hands-on sessions across every stage of the venue, and the container must keep this text clamped to its max width instead of letting it stretch edge to edge on a wide screen.",
    },
    "extra-class": {
      class: "u-eyebrow",
      children: "An extra class is appended after container.",
    },
  },
};
