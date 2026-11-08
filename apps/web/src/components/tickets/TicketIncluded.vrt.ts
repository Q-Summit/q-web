// VRT variants for TicketIncluded. The gallery renders without the page
// script, so this is the no-JavaScript layout: every ticket panel stacked,
// tabs hidden. See docs/dev/visual-testing.md.
import TicketIncluded from "./TicketIncluded.astro";
import { vrtTicketPage } from "./ticket-vrt-data";

export default {
  component: TicketIncluded,
  variants: {
    default: {
      offer: vrtTicketPage.offer,
      included: vrtTicketPage.included,
    },
  },
};
