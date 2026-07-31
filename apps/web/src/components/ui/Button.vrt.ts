// VRT variants for the Button primitive. `children` fills the default slot (the
// label); the rest are props. Covers the variants global.css defines.
import Button from "./Button.astro";

export default {
  component: Button,
  variants: {
    primary: { href: "#", children: "Register now" },
    secondary: { href: "#", variant: "secondary", children: "Learn more" },
    small: { href: "#", small: true, children: "Details" },
  },
};
