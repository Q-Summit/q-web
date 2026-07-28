// Unit tests for the pure, build-time-only helpers in src/lib/content.ts.
//
// content.ts imports node:fs / node:path and reads process.cwd() at module
// load, so unlike the worker and the pure href/lexical-html modules it cannot
// run in the Workers pool. This file therefore runs in the "node" vitest
// project (see ../vitest.config.ts) and is typechecked by
// ./tsconfig.node.json, which pulls in @types/node.
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import {
  normalizeHrefsDeep,
  stableOrderCompare,
  currentSpeakerEdition,
  speakersForEdition,
} from "../src/lib/content";

describe("normalizeHrefsDeep", () => {
  it("rewrites href-like keys case-insensitively, recursing objects and arrays", () => {
    const input = {
      label: "Home",
      href: "/whyq",
      url: "/not-a-link", // key does not end in "href" -> left as-is
      nested: {
        buttonHref: "/contact",
        BuyHref: "/tickets",
        HREF: "/program",
        text: "/plain-string",
      },
      items: [{ href: "/speaker" }, { href: "https://example.com/page" }],
    };

    const out = normalizeHrefsDeep(input);

    // Every href-like key, at every depth and in any casing, is normalized.
    expect(out.href).toBe("/whyq/");
    expect(out.nested.buttonHref).toBe("/contact/");
    expect(out.nested.BuyHref).toBe("/tickets/");
    expect(out.nested.HREF).toBe("/program/");
    expect(out.items[0].href).toBe("/speaker/");
    // External links pass through normalizeInternalHref unchanged.
    expect(out.items[1].href).toBe("https://example.com/page");
    // Non-href keys are recursed into but their string values are untouched.
    expect(out.url).toBe("/not-a-link");
    expect(out.nested.text).toBe("/plain-string");
    expect(out.label).toBe("Home");
  });

  it("returns primitives unchanged", () => {
    expect(normalizeHrefsDeep("hello")).toBe("hello");
    expect(normalizeHrefsDeep(42)).toBe(42);
    expect(normalizeHrefsDeep(null)).toBe(null);
    expect(normalizeHrefsDeep(undefined)).toBe(undefined);
  });

  it("normalizes href values held directly in a nested array", () => {
    const out = normalizeHrefsDeep({ links: [{ href: "/a" }, { href: "/b" }] });
    expect(out.links).toEqual([{ href: "/a/" }, { href: "/b/" }]);
  });
});

describe("stableOrderCompare", () => {
  it("orders by the `order` field first", () => {
    expect(stableOrderCompare({ order: 1 }, { order: 2 })).toBeLessThan(0);
    expect(stableOrderCompare({ order: 5 }, { order: 2 })).toBeGreaterThan(0);
  });

  it("treats a missing/null order as 0", () => {
    expect(stableOrderCompare({}, { order: 1 })).toBeLessThan(0);
    expect(stableOrderCompare({ order: null }, { order: -1 })).toBeGreaterThan(
      0,
    );
  });

  it("breaks an equal-order tie on slug, deterministically and symmetrically", () => {
    expect(
      stableOrderCompare(
        { order: 3, slug: "alpha" },
        { order: 3, slug: "beta" },
      ),
    ).toBeLessThan(0);
    expect(
      stableOrderCompare(
        { order: 3, slug: "beta" },
        { order: 3, slug: "alpha" },
      ),
    ).toBeGreaterThan(0);
    expect(
      stableOrderCompare(
        { order: 3, slug: "same" },
        { order: 3, slug: "same" },
      ),
    ).toBe(0);
  });

  it("falls back to id for the tie-break when slug is absent", () => {
    expect(
      stableOrderCompare({ order: 0, id: 1 }, { order: 0, id: 2 }),
    ).toBeLessThan(0);
    expect(
      stableOrderCompare({ order: 0, id: 2 }, { order: 0, id: 1 }),
    ).toBeGreaterThan(0);
  });

  it("lets the order field win over the tie-break key", () => {
    // Lower order sorts first even though its slug sorts last, so the tie-break
    // never overrides the primary key.
    expect(
      stableOrderCompare({ order: 2, slug: "z" }, { order: 5, slug: "a" }),
    ).toBeLessThan(0);
  });
});

describe("resolveMediaFilename", () => {
  // loadMediaIndex reads the media directory once and memoizes it at module
  // scope, so each case builds its own directory and re-imports the module
  // (vi.resetModules) to keep the three tiers isolated from one another.
  const dirs: string[] = [];

  afterEach(() => {
    vi.resetModules();
  });

  afterAll(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  });

  async function resolverFor(
    files: string[],
  ): Promise<(filename: string, label: string) => Promise<string>> {
    const dir = mkdtempSync(join(tmpdir(), "q-media-"));
    dirs.push(dir);
    for (const file of files) writeFileSync(join(dir, file), "x");
    process.env.WEB_PUBLIC_MEDIA_DIR = dir;
    vi.resetModules();
    const mod = await import("../src/lib/content");
    return mod.resolveMediaFilename;
  }

  it("tier 1: returns an exact basename match unchanged", async () => {
    const resolve = await resolverFor(["hero.webp", "other.webp"]);
    expect(await resolve("hero.webp", "hero")).toBe("hero.webp");
  });

  it("tier 1 wins over a fuzzy near-match, independent of readdir order", async () => {
    // Both files normalize toward "profile", so a fuzzy-first resolver would
    // return whichever readdir happens to yield first. The exact tier must win
    // so the result is deterministic and never a false positive.
    const resolve = await resolverFor(["profile.jpg", "profile-large.jpg"]);
    expect(await resolve("profile.jpg", "profile")).toBe("profile.jpg");
  });

  it("tier 2: resolves a bare name to the stored -p-<size> variant", async () => {
    const resolve = await resolverFor(["gallery-p-1080.jpg"]);
    expect(await resolve("gallery.jpg", "gallery")).toBe("gallery-p-1080.jpg");
  });

  it("tier 3: falls back to a fuzzy match across extension, case, and punctuation", async () => {
    const resolve = await resolverFor(["my-photo-1.webp"]);
    expect(await resolve("My Photo (1).png", "my photo")).toBe(
      "my-photo-1.webp",
    );
  });

  // Pass-through is the CORRECT production answer, not a degradation: the CMS
  // filename is the R2 key, and public/media is only a local convenience
  // mirror of the Webflow scrape. So this reports at info level, and only for
  // the first miss in a build -- per-file it emitted 113 lines on a normal CMS
  // build and buried the warnings that did mean something.
  it("passes an unresolved filename through unchanged and reports once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const resolve = await resolverFor(["something-else.webp"]);

    expect(await resolve("missing.webp", "missing")).toBe("missing.webp");
    expect(await resolve("also-missing.webp", "also missing")).toBe(
      "also-missing.webp",
    );

    expect(warn).not.toHaveBeenCalled();
    expect(info).toHaveBeenCalledOnce();
    expect(info.mock.calls[0]?.[0]).toContain("public/media mirror");

    info.mockRestore();
    warn.mockRestore();
  });
});

// The /speaker page used to filter on the literal "speakers-2026", so
// publishing the next edition exactly as the CMS instructs (group "current",
// year 2027) matched nothing and emptied the page with no warning. The edition
// is now derived from the data; these pin that rollover.
describe("speaker edition selection", () => {
  const s = (group: string, year: number | null, name: string) =>
    ({ group, year, name }) as unknown as Parameters<
      typeof speakersForEdition
    >[0][number];

  it("picks the newest published edition", () => {
    const all = [
      s("current", 2026, "old"),
      s("current", 2027, "new"),
      s("moderation", 2027, "mod"),
    ];
    expect(currentSpeakerEdition(all)).toBe(2027);
    expect(speakersForEdition(all, "current", 2027).map((x) => x.name)).toEqual(
      ["new"],
    );
  });

  it("rolls over without a code change when only next year is published", () => {
    const all = [s("current", 2027, "a"), s("current", 2027, "b")];
    const year = currentSpeakerEdition(all);
    expect(year).toBe(2027);
    expect(speakersForEdition(all, "current", year)).toHaveLength(2);
  });

  it("falls back to every entry when no year is set", () => {
    const all = [s("current", null, "a")];
    expect(currentSpeakerEdition(all)).toBeNull();
    expect(speakersForEdition(all, "current", null)).toHaveLength(1);
  });

  it("ignores previous-highlights when choosing the edition", () => {
    const all = [s("current", 2026, "a"), s("previous", 2099, "old highlight")];
    expect(currentSpeakerEdition(all)).toBe(2026);
  });
});
