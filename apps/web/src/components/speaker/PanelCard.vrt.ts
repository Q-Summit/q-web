// VRT variants for PanelCard. Covers the default panel copy and a long
// title/description that must wrap on the fixed-width card.
import PanelCard from "./PanelCard.astro";

export default {
  component: PanelCard,
  variants: {
    default: {
      icon: "/media/icon-refund.svg",
      title: "Ticket Refunds",
      description: "How to request a refund if your plans change.",
    },
    "long-copy": {
      icon: "/media/icon-ai.svg",
      title: "Artificial Intelligence and the Future of Founder Coaching",
      description:
        "A deep-dive panel on how AI-assisted tools are already reshaping mentorship, due diligence and portfolio support across the European venture landscape.",
    },
  },
};
