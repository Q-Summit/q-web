// VRT variants for Footer. Like Nav, it takes no props: tagline, nav links,
// social links and copyright all come from getSiteSettings() itself, so
// there is no prop shape to vary here (the content edges live in the
// site-settings fixture, not in this file). One variant renders the shared
// chrome as-is. See docs/dev/visual-testing.md.
import Footer from "./Footer.astro";

export default {
  component: Footer,
  variants: {
    default: {},
  },
};
