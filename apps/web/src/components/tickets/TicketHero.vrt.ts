// VRT variants for TicketHero: the glass Q tile, the discount phase
// timeline (or, without phases, the eyebrow), display heading and the
// compare link. See docs/dev/visual-testing.md.
import TicketHero from "./TicketHero.astro";
import { vrtTicketPage } from "./ticket-vrt-data";

export default {
  component: TicketHero,
  variants: {
    default: { hero: vrtTicketPage.hero, phases: vrtTicketPage.phases },
    "no-phases": { hero: vrtTicketPage.hero },
  },
};
