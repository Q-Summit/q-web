// VRT variants for Nav. Unlike the components above, Nav takes no props: it
// reads its 7 links from getSiteSettings() itself, so there is no prop shape
// to vary here (the content edges live in the site-settings fixture, not in
// this file). One variant renders the shared chrome as-is. See
// docs/dev/visual-testing.md.
import Nav from "./Nav.astro";

export default {
  component: Nav,
  variants: {
    default: {},
  },
};
