import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  TICKET_KEYS,
  type PageContent,
  type TicketOffer,
  type WhyqAudiencePage,
} from "../src/lib/content/pages";
import { WHYQ_AUDIENCE_PAGES } from "../src/lib/whyq-audiences";
import {
  fillTicketTokens,
  parseStat,
  siteSpelling,
  toWhyqPageCopy,
  whyqImage,
} from "../src/lib/whyq-pages";

// The committed fake fixture: the CI build renders the four pages from it,
// so it has to keep exercising every layout the components know.
const fixture = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "fixtures/ci-content/page-content.json"),
    "utf-8",
  ),
) as PageContent;
const pages = fixture.whyq.pages ?? [];

const ticket = (key: TicketOffer["key"], price: number): TicketOffer => ({
  key,
  name: `Fixture ${key}`,
  description: "Fixture audience",
  regularPrice: price + 10,
  price,
  highlights: [],
});

const format = (amount: number) => `€${amount}`;

describe("whyq audience pages in the fixture", () => {
  it("has one entry for every registered audience page, and no other", () => {
    expect(pages.map((page) => page.audience).sort()).toEqual(
      WHYQ_AUDIENCE_PAGES.map(({ slug }) => slug).sort(),
    );
  });

  it("exercises every highlight layout", () => {
    expect(new Set(pages.map((page) => page.highlight.layout))).toEqual(
      new Set(["cards", "winner", "logos", "qube"]),
    );
  });

  it("only names ticket keys the ticket model knows", () => {
    for (const page of pages) {
      expect(page.ticket.keys.length).toBeGreaterThan(0);
      for (const key of page.ticket.keys) expect(TICKET_KEYS).toContain(key);
    }
  });

  it("quotes prices only for tickets the same page sells", () => {
    for (const page of pages) {
      const tokens = JSON.stringify(page.faq).matchAll(
        /\{(?:price|regular):([a-z-]+)\}/g,
      );
      for (const [, key] of tokens) expect(page.ticket.keys).toContain(key);
    }
  });
});

describe("toWhyqPageCopy", () => {
  const base: WhyqAudiencePage = {
    audience: "investors",
    crumb: "For Fixture",
    metaDescription: "Fixture.",
    hero: { heading: "H", intro: "I", ctaLabel: "C" },
    stats: [{ value: "1500+", label: "Participants" }],
    activities: {
      heading: "A",
      items: [
        { title: "One", text: "T", kind: "included" },
        {
          title: "Two",
          text: "T",
          kind: "apply",
          image: { file: "two.webp", alt: "Two", width: 400, height: 300 },
        },
      ],
    },
    highlight: {
      layout: "qube",
      eyebrow: "E",
      heading: "H",
      logos: [{ name: "Fixture VC", file: "vc.svg" }, { name: "Plain" }],
    },
    ticket: { heading: "T", keys: ["investor"], side: [], includes: [] },
    faq: { heading: "F", items: [] },
  };

  it("draws a photo under /media and keeps a card without one empty", () => {
    const copy = toWhyqPageCopy(base);
    expect(copy.activities.items[0].image).toBeUndefined();
    expect(copy.activities.items[1].image).toEqual({
      src: "/media/two.webp",
      width: 400,
      height: 300,
      alt: "Two",
    });
  });

  it("names every logo of the wall, in order", () => {
    const copy = toWhyqPageCopy(base);
    expect(copy.highlight.kind).toBe("qube");
    if (copy.highlight.kind === "qube") {
      expect(copy.highlight.names).toEqual(["Fixture VC", "Plain"]);
    }
  });

  it("leaves out empty side cards, lists and a panel without a heading", () => {
    const copy = toWhyqPageCopy({
      ...base,
      ticket: {
        ...base.ticket,
        partnerPanel: {
          eyebrow: "",
          heading: "",
          text: "",
          perks: [],
          linkLabel: "",
          href: "",
        },
      },
    });
    expect(copy.ticket.side).toBeUndefined();
    expect(copy.ticket.includes).toBeUndefined();
    expect(copy.ticket.more).toBeUndefined();
  });

  it("assumes a size for a photo whose size is not recorded", () => {
    expect(whyqImage({ file: "a.webp", alt: "A" })).toMatchObject({
      width: 800,
      height: 533,
    });
    expect(whyqImage(undefined)).toBeUndefined();
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

describe("siteSpelling", () => {
  it("writes the ticket content's names as the rest of the site does", () => {
    expect(siteSpelling("Start-Up")).toBe("Startup");
    expect(siteSpelling("For founders or employees of a start-up")).toBe(
      "For founders or employees of a startup",
    );
    expect(siteSpelling("Apply for the Pitchbattle")).toBe(
      "Apply for the Pitch Battle",
    );
    expect(siteSpelling("Young Professional")).toBe("Young Pro");
  });

  it("leaves the site's own spelling alone", () => {
    expect(siteSpelling("Startup, Pitch Battle, Young Pros")).toBe(
      "Startup, Pitch Battle, Young Pros",
    );
  });
});
