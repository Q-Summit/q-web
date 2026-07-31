// VRT variants for ReachOut. The contact photo is a fixed asset baked into
// the component markup (not a prop), so every variant renders it; the
// stress here is item count and detail length, not images.
import ReachOut from "./ReachOut.astro";
import type { ContactItem } from "../../lib/content";

export default {
  component: ReachOut,
  variants: {
    default: {
      heading: "Get in touch",
      paragraphs: [
        "Have a question about the conference, tickets or the partner program? We are happy to help.",
      ],
      items: [
        {
          label: "General inquiries",
          email: "info@example.com",
          details: [],
        },
        {
          label: "Postal address",
          details: [
            "Q-Summit e.V.",
            "Musterstrasse 1",
            "12345 Musterstadt, Germany",
          ],
        },
      ] satisfies ContactItem[],
    },
    "long-copy": {
      heading: "Reach out to the Q-Summit organizing team",
      paragraphs: [
        "Whatever you are trying to reach us about, from a press inquiry to a question about ticket transfers, our team reads every message and routes it to the right division within a few business days.",
      ],
      items: [
        {
          label: "Press and media inquiries",
          email: "press@example.com",
          details: [
            "For interview requests, accreditation and high-resolution conference photography.",
          ],
        },
        {
          label: "Postal address",
          details: [
            "Q-Summit e.V.",
            "c/o Student Union Building, Room 214",
            "Musterstrasse 1",
            "12345 Musterstadt, Germany",
          ],
        },
      ] satisfies ContactItem[],
    },
    "many-items": {
      heading: "Get in touch",
      paragraphs: ["Pick the right channel for your question."],
      items: Array.from({ length: 5 }, (_, i) => ({
        label: `Contact channel ${i + 1}`,
        email: i % 2 === 0 ? `channel${i + 1}@example.com` : undefined,
        details: i % 2 === 0 ? [] : [`Detail line for channel ${i + 1}`],
      })) satisfies ContactItem[],
    },
  },
};
