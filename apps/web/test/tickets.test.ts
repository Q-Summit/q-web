// The ticket page shows one model three ways (cards, What's included,
// Compare tickets); these helpers are the only place prices, savings,
// statuses and discount phase states are computed, server side and in the
// browser. Pure module, so it runs in the workers project.
import { describe, expect, it } from "vitest";

import type { TicketBenefitGroup, TicketPhases } from "../src/lib/content";
import {
  euro,
  fillLabel,
  isPositive,
  phaseStates,
  salePriceLabel,
  savings,
  statusLabel,
  statusOf,
} from "../src/components/tickets/ticket-model";

const ALL = [
  "student",
  "young-professional",
  "start-up",
  "investor",
  "corporate",
] as const;

// Same shape as the 2027 list: one requirement, twelve benefits.
const groups: TicketBenefitGroup[] = [
  {
    heading: "Eligibility",
    kind: "eligibility",
    rows: [{ label: "Valid student ID required", tickets: ["student"] }],
  },
  {
    heading: "Core",
    kind: "benefit",
    rows: Array.from({ length: 8 }, (_, i) => ({
      label: `Shared ${i}`,
      tickets: [...ALL],
    })),
  },
  {
    heading: "Privileges",
    kind: "benefit",
    rows: [
      { label: "Qube", tickets: ["start-up"] },
      { label: "Pitchbattle", tickets: ["start-up"] },
      { label: "Investment", tickets: ["investor"] },
      { label: "Lounge", tickets: ["corporate"] },
    ],
  },
];

const labels = {
  includedLabel: "Included",
  notIncludedLabel: "Not included",
  requiredLabel: "Required",
  notRequiredLabel: "Not required",
};

describe("statusOf / statusLabel", () => {
  const [eligibility, , privileges] = groups;

  it("reads eligibility rows as Required / Not required", () => {
    const row = eligibility.rows[0];
    expect(statusOf(eligibility, row, "student")).toBe("required");
    expect(statusOf(eligibility, row, "investor")).toBe("not-required");
    expect(statusLabel("not-required", labels)).toBe("Not required");
  });

  it("reads benefit rows as Included / Not included", () => {
    const qube = privileges.rows[0];
    expect(statusOf(privileges, qube, "start-up")).toBe("included");
    expect(statusOf(privileges, qube, "student")).toBe("not-included");
    expect(isPositive("not-included")).toBe(false);
    expect(isPositive("required")).toBe(true);
  });
});

describe("prices", () => {
  it("formats whole euros and works out the saving from both prices", () => {
    const ticket = {
      key: "corporate" as const,
      name: "Corporate",
      description: "",
      regularPrice: 349,
      price: 244,
      highlights: [],
    };
    expect(euro(ticket.price)).toBe("€244");
    expect(savings(ticket)).toBe(105);
    expect(savings({ ...ticket, price: 400 })).toBe(0);
  });
});

describe("fillLabel", () => {
  it("fills known placeholders and leaves unknown ones visible", () => {
    expect(
      fillLabel("{included} of {total} benefits included", {
        included: 8,
        total: 12,
      }),
    ).toBe("8 of 12 benefits included");
    expect(fillLabel("Buy {ticket} ticket {x}", { ticket: "Student" })).toBe(
      "Buy Student ticket {x}",
    );
  });
});

describe("discount phases", () => {
  const phases: TicketPhases = {
    label: "Discount phases",
    items: [
      { key: "a", label: "Phase A", discount: 30 },
      { key: "b", label: "Phase B", discount: 20 },
      { key: "c", label: "Phase C", discount: 10 },
    ],
    activeKey: "b",
    currentLabel: "Now",
    upcomingLabel: "Later",
    pastLabel: "Over",
    discountLabel: "{discount}% off",
  };

  it("marks phases before the active one past and after it upcoming", () => {
    expect(phaseStates(phases).map((p) => p.state)).toEqual([
      "past",
      "current",
      "upcoming",
    ]);
  });

  it("names the sale price after the active phase", () => {
    expect(salePriceLabel(phases)).toBe("Phase B price");
    expect(salePriceLabel(undefined)).toBe("Early Bird price");
  });
});
