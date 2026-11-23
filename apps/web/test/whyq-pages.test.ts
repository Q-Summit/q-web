import { describe, expect, it } from "vitest";
import { TICKET_KEYS, type TicketOffer } from "../src/lib/content/pages";
import { WHYQ_AUDIENCE_PAGES } from "../src/lib/whyq-audiences";
import {
  WHYQ_PAGE_COPY,
  fillTicketTokens,
  parseStat,
} from "../src/lib/whyq-pages";

const ticket = (key: TicketOffer["key"], price: number): TicketOffer => ({
  key,
  name: `Fixture ${key}`,
  description: "Fixture audience",
  regularPrice: price + 10,
  price,
  highlights: [],
});

const format = (amount: number) => `€${amount}`;

describe("whyq page copy", () => {
  it("has copy for every registered audience page, and no other", () => {
    expect(Object.keys(WHYQ_PAGE_COPY).sort()).toEqual(
      WHYQ_AUDIENCE_PAGES.map(({ slug }) => slug).sort(),
    );
  });

  it("only names ticket keys the ticket model knows", () => {
    for (const copy of Object.values(WHYQ_PAGE_COPY)) {
      expect(copy.ticket.keys.length).toBeGreaterThan(0);
      for (const key of copy.ticket.keys) {
        expect(TICKET_KEYS).toContain(key);
      }
    }
  });

  it("writes no price and no open placeholder into the copy", () => {
    const text = JSON.stringify(WHYQ_PAGE_COPY);
    // Prices come from page-tickets through {price:<key>} tokens.
    expect(text).not.toMatch(/€\s?\d/);
    expect(text).not.toMatch(/\[[A-Z ]{3,}\]|placeholder/i);
  });

  it("quotes prices only for tickets the same page sells", () => {
    for (const copy of Object.values(WHYQ_PAGE_COPY)) {
      const tokens = JSON.stringify(copy.faq).matchAll(
        /\{(?:price|regular):([a-z-]+)\}/g,
      );
      for (const [, key] of tokens) {
        expect(copy.ticket.keys).toContain(key);
      }
    }
  });
});

describe("parseStat", () => {
  it("splits a figure from what follows it", () => {
    expect(parseStat("1500")).toEqual({ number: 1500, suffix: "" });
    expect(parseStat("60+")).toEqual({ number: 60, suffix: "+" });
  });

  it("keeps a value without a leading figure as text", () => {
    expect(parseStat("n/a")).toEqual({ number: 0, suffix: "n/a" });
  });
});

describe("fillTicketTokens", () => {
  const tickets = [ticket("start-up", 36), ticket("student", 18)];

  it("fills the sale and the regular price of the named ticket", () => {
    expect(
      fillTicketTokens(
        "Now {price:start-up}, later {regular:start-up}.",
        tickets,
        format,
      ),
    ).toBe("Now €36, later €46.");
  });

  it("leaves text without tokens untouched", () => {
    expect(fillTicketTokens("No prices here.", tickets, format)).toBe(
      "No prices here.",
    );
  });

  it("returns undefined when a named ticket is missing", () => {
    expect(
      fillTicketTokens("Costs {price:investor}.", tickets, format),
    ).toBeUndefined();
  });
});
