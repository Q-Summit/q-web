// VRT variants for TicketCards: five cards (3 + 2 grid on tablet and
// desktop, the one-card carousel on phones), a requirement note and a
// wrapping highlight. See docs/dev/visual-testing.md.
import TicketCards from "./TicketCards.astro";
import { vrtTicketPage } from "./ticket-vrt-data";

export default {
  component: TicketCards,
  variants: {
    default: { offer: vrtTicketPage.offer },
  },
};
