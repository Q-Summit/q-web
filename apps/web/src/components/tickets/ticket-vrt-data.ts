// Shared fake ticket page for the tickets/*.vrt.ts variants (see
// docs/dev/visual-testing.md). Same shape as the 2027 model, obviously fake
// values, so the gallery exercises every layout path: five tickets (the
// 3 + 2 grid and the carousel), a requirement note, an eligibility group
// and a long label.
import type { TicketCategoriesContent } from "../../lib/content";

const ALL = [
  "student",
  "young-professional",
  "start-up",
  "investor",
  "corporate",
] as const;

export const vrtTicketPage: TicketCategoriesContent = {
  title: "Tickets (VRT)",
  metaDescription: "Fake ticket page for visual tests.",
  hero: {
    eyebrow: "Sample offer · 10% off",
    heading: "Pick a sample ticket",
    intro: "Sample intro for the ticket page used by the visual gallery.",
    compareLabel: "Compare sample tickets",
  },
  phases: {
    label: "Sample discount phases",
    items: [
      { key: "sample-a", label: "Sample phase A", discount: 12 },
      { key: "sample-b", label: "Sample phase B", discount: 9 },
      { key: "sample-c", label: "Sample phase C", discount: 6 },
      { key: "sample-d", label: "Sample phase D", discount: 3 },
    ],
    activeKey: "sample-b",
    currentLabel: "Sample now",
    upcomingLabel: "Sample later",
    pastLabel: "Sample over",
    discountLabel: "{discount}% off",
  },
  offer: {
    purchaseHref: "https://tickets.example.com/event/sample",
    buyLabel: "Buy now",
    detailsLabel: "All benefits",
    saveLabel: "Save",
    footnote: "Sample prices in EUR. Not for sale.",
    tickets: [
      {
        key: "student",
        name: "Student",
        description: "Sample audience one",
        regularPrice: 20,
        price: 18,
        highlights: [
          "Sample highlight one",
          "Sample highlight two",
          "A much longer sample highlight that has to wrap across lines",
          "Sample highlight four",
          "Sample highlight five",
        ],
        note: "Sample requirement",
      },
      ...(
        [
          ["young-professional", "Young Pro", 30, 27],
          ["start-up", "Start-Up", 40, 36],
          ["investor", "Investor", 50, 45],
          ["corporate", "Corporate", 60, 54],
        ] as const
      ).map(([key, name, regularPrice, price]) => ({
        key,
        name,
        description: `Sample audience for ${name}`,
        regularPrice,
        price,
        highlights: [
          "Sample highlight one",
          "Sample highlight two",
          "Sample highlight three",
          "Sample highlight four",
          "Sample highlight five",
        ],
      })),
    ],
  },
  included: {
    heading: "What's included (sample)",
    intro: "Sample intro for the benefit list.",
    ticketBuyLabel: "Buy {ticket} ticket",
    countLabel: "{included} of {total} benefits included",
    includedLabel: "Included",
    notIncludedLabel: "Not included",
    requiredLabel: "Required",
    notRequiredLabel: "Not required",
    groups: [
      {
        heading: "Eligibility",
        kind: "eligibility",
        rows: [{ label: "Sample requirement", tickets: ["student"] }],
      },
      {
        heading: "Sample group",
        kind: "benefit",
        rows: [
          { label: "Shared sample benefit", tickets: [...ALL] },
          {
            label:
              "A long shared sample benefit label that wraps on narrow screens",
            tickets: [...ALL],
          },
        ],
      },
      {
        heading: "Sample privileges",
        kind: "benefit",
        rows: [
          { label: "Start-Up sample privilege", tickets: ["start-up"] },
          { label: "Investor sample privilege", tickets: ["investor"] },
        ],
      },
    ],
  },
  compare: {
    heading: "Compare sample tickets",
    intro: "Sample intro for the compare view.",
    firstLabel: "First ticket",
    secondLabel: "Second ticket",
  },
};
