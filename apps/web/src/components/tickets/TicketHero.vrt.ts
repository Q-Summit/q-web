// VRT variants for TicketHero: the glass Q tile, eyebrow, display heading
// and the neutral compare link. See docs/dev/visual-testing.md.
import TicketHero from "./TicketHero.astro";
import { vrtTicketPage } from "./ticket-vrt-data";

export default {
  component: TicketHero,
  variants: {
    default: { hero: vrtTicketPage.hero },
  },
};
