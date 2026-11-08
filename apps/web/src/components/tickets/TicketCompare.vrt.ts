// VRT variants for TicketCompare: the neutral spec sheet with its default
// pair (first ticket against Start-Up), an eligibility group and a long
// row label. See docs/dev/visual-testing.md.
import TicketCompare from "./TicketCompare.astro";
import { vrtTicketPage } from "./ticket-vrt-data";

export default {
  component: TicketCompare,
  variants: {
    default: { page: vrtTicketPage },
  },
};
