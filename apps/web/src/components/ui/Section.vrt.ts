// VRT variants for the Section primitive. It only emits the surface/size
// classes global.css defines, so the coverage is the variant matrix itself:
// the default surface, the alternate (light grey) and dark (navy) surfaces,
// and the tighter small padding. `children` is a plain string filling the
// default slot (like Button's label), not markup. See
// docs/dev/visual-testing.md.
import Section from "./Section.astro";

export default {
  component: Section,
  variants: {
    default: {
      children: "Default surface, standard padding.",
    },
    alternate: {
      variant: "alternate",
      children:
        "Alternate (light grey) surface, used to separate stacked sections.",
    },
    dark: {
      variant: "dark",
      children: "Dark (navy) surface, used for emphasis sections.",
    },
    small: {
      small: true,
      children: "Tighter vertical padding for a compact section.",
    },
  },
};
