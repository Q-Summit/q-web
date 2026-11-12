// Unit tests for the pure, build-time-only helpers in src/lib/content.ts.
//
// content.ts imports node:fs / node:path and reads process.cwd() at module
// load, so unlike the worker and the pure href/lexical-html modules it cannot
// run in the Workers pool. This file therefore runs in the "node" vitest
// project (see ../vitest.config.ts) and is typechecked by
// ./tsconfig.node.json, which pulls in @types/node.
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

import {
  normalizeHrefsDeep,
  stableOrderCompare,
  currentSpeakerEdition,
  speakersForEdition,
} from "../src/lib/content";
import type { PageContent, SiteSettings } from "../src/lib/content";
import { assertTicketPage } from "../src/lib/content/pages";
import { toNavLink } from "../src/lib/content/site-settings";
import { buildLlmsFullTxt, buildRouteTable } from "../src/lib/llms";
import {
  WHYQ_AUDIENCE_PAGES,
  whyqAudienceNames,
  whyqAudiencePath,
} from "../src/lib/whyq-audiences";

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

// The ticket page's build guard: the fixture passes, and the two failures
// that would otherwise ship a broken page (2027 groups not published yet, a
// benefit naming a ticket that is not on the page) fail the build loudly.
describe("assertTicketPage", () => {
  const fixture = () =>
    JSON.parse(
      readFileSync(
        new URL("./fixtures/ci-content/page-content.json", import.meta.url),
        "utf-8",
      ),
    ).ticketCategories;

  it("accepts the committed fixture", () => {
    expect(() => assertTicketPage(fixture())).not.toThrow();
  });

  it("fails when the 2027 groups are empty (2026 doc still published)", () => {
    const page = { ...fixture(), hero: null, offer: null };
    expect(() => assertTicketPage(page)).toThrow(/2027 ticket fields/);
  });

  it("fails when a benefit names a ticket that is not on the page", () => {
    const page = fixture();
    page.offer.tickets = page.offer.tickets.filter(
      (t: { key: string }) => t.key !== "corporate",
    );
    expect(() => assertTicketPage(page)).toThrow(/corporate/);
  });

  it("checks the discount phases when present", () => {
    const page = fixture();
    expect(page.phases.items.length).toBeGreaterThan(0);
    expect(() =>
      assertTicketPage({ ...page, phases: { ...page.phases, activeKey: "x" } }),
    ).toThrow(/activeKey/);
    expect(() =>
      assertTicketPage({
        ...page,
        phases: {
          ...page.phases,
          items: [{ ...page.phases.items[0], discount: 0 }],
        },
      }),
    ).toThrow(/discount/);
    expect(() =>
      assertTicketPage({
        ...page,
        phases: { ...page.phases, discountLabel: "off" },
      }),
    ).toThrow(/{discount}/);
    const { phases: _omit, ...withoutPhases } = page;
    expect(() => assertTicketPage(withoutPhases)).not.toThrow();
  });
});

describe("toNavLink (site-settings nav submenu)", () => {
  it("maps children and keeps the parent's own link", () => {
    expect(
      toNavLink({
        label: "Why Q?",
        href: "/whyq",
        children: [{ label: "Fixture audience A", href: "/whyq/students" }],
      }),
    ).toEqual({
      label: "Why Q?",
      href: "/whyq",
      children: [{ label: "Fixture audience A", href: "/whyq/students" }],
    });
  });

  it("leaves the key off when children are absent, null or empty", () => {
    // Absent is what a CMS without the field (or an old snapshot) returns.
    for (const children of [undefined, null, []]) {
      const link = toNavLink({ label: "Speaker", href: "/speaker", children });
      expect(link).toEqual({ label: "Speaker", href: "/speaker" });
      expect("children" in link).toBe(false);
    }
  });
});

describe("whyq audience pages", () => {
  const readFixture = <T>(file: string): T =>
    JSON.parse(
      readFileSync(
        new URL(`./fixtures/ci-content/${file}`, import.meta.url),
        "utf-8",
      ),
    ) as T;
  const content = readFixture<PageContent>("page-content.json");
  // Raw fixture hrefs have no trailing slash; the loader adds it the same way.
  const settings = normalizeHrefsDeep(
    readFixture<SiteSettings>("site-settings.json"),
  );

  it("names a page after its submenu entry and that entry's parent", () => {
    const nav = [
      { label: "Speaker", href: "/speaker/" },
      {
        label: "Why Q?",
        href: "/whyq/",
        // No trailing slash on purpose: matching must not depend on the loader.
        children: [{ label: "Fixture audience B", href: "/whyq/startups" }],
      },
    ];
    expect(whyqAudienceNames("startups", nav)).toEqual({
      label: "Fixture audience B",
      parentLabel: "Why Q?",
    });
  });

  it("falls back to the capitalized slug when the nav has no submenu entry", () => {
    expect(
      whyqAudienceNames("investors", [{ label: "Why Q?", href: "/whyq/" }]),
    ).toEqual({ label: "Investors", parentLabel: "Why Q?" });
    expect(whyqAudienceNames("investors", [])).toEqual({
      label: "Investors",
      parentLabel: undefined,
    });
  });

  it("every page in the registry has a submenu entry and an audience in the fixture", () => {
    const children = settings.nav.flatMap((item) => item.children ?? []);
    const audienceIds = content.whyq.audiences.map((audience) => audience.id);
    for (const { slug, audienceId } of WHYQ_AUDIENCE_PAGES) {
      expect(children.map((child) => child.href)).toContain(
        whyqAudiencePath(slug),
      );
      expect(audienceIds).toContain(audienceId);
    }
  });

  it("lists the audience pages as main pages of the llms route table, named from the nav", () => {
    const { mainPages } = buildRouteTable(content, settings);
    const slugs = mainPages.map((entry) => entry.slug);
    for (const { slug } of WHYQ_AUDIENCE_PAGES) {
      expect(slugs).toContain(whyqAudiencePath(slug));
    }
    expect(
      mainPages.find((entry) => entry.slug === "/whyq/students/")?.label,
    ).toBe("Why Q-Summit: Fixture audience A");
  });

  it("gives every audience page its own block in the full text", () => {
    const full = buildLlmsFullTxt({
      site: "https://q-summit.com",
      siteSettings: settings,
      pageContent: content,
    });
    for (const { slug, audienceId } of WHYQ_AUDIENCE_PAGES) {
      expect(full).toContain(
        `Source: https://q-summit.com${whyqAudiencePath(slug)}`,
      );
      const audience = content.whyq.audiences.find(
        (entry) => entry.id === audienceId,
      );
      expect(full).toContain(audience!.heading);
    }
  });
});

describe("/whyq/ has no overview page", () => {
  const readText = (path: string) =>
    readFileSync(new URL(path, import.meta.url), "utf-8");
  const content = JSON.parse(
    readText("./fixtures/ci-content/page-content.json"),
  ) as PageContent;
  const settings = normalizeHrefsDeep(
    JSON.parse(
      readText("./fixtures/ci-content/site-settings.json"),
    ) as SiteSettings,
  );

  it("is in neither llms surface, only its audience pages are", () => {
    const { mainPages, optional } = buildRouteTable(content, settings);
    const slugs = [...mainPages, ...optional].map((entry) => entry.slug);
    expect(slugs.filter((slug) => /^\/whyq\/?$/.test(slug))).toEqual([]);
    const full = buildLlmsFullTxt({
      site: "https://q-summit.com",
      siteSettings: settings,
      pageContent: content,
    });
    expect(full).not.toContain("Source: https://q-summit.com/whyq/\n");
  });

  it("has no page file and a redirect to the audience tiles on the homepage", () => {
    expect(
      existsSync(new URL("../src/pages/whyq.astro", import.meta.url)),
    ).toBe(false);
    const config = readText("../astro.config.mjs");
    expect(config).toMatch(
      /"\/whyq":\s*\{\s*status:\s*302,\s*destination:\s*"\/#why-attend"/,
    );
    // The target of that redirect exists on the homepage.
    expect(readText("../src/components/home/WhyCards.astro")).toContain(
      'id="why-attend"',
    );
  });
});

describe("/program is offline", () => {
  const readText = (path: string) =>
    readFileSync(new URL(path, import.meta.url), "utf-8");
  const content = JSON.parse(
    readText("./fixtures/ci-content/page-content.json"),
  ) as PageContent;
  const settings = JSON.parse(
    readText("./fixtures/ci-content/site-settings.json"),
  ) as SiteSettings;

  it("is in neither llms surface", () => {
    const { mainPages, optional } = buildRouteTable(content, settings);
    const slugs = [...mainPages, ...optional].map((entry) => entry.slug);
    expect(slugs.filter((slug) => slug.startsWith("/program"))).toEqual([]);
    const full = buildLlmsFullTxt({
      site: "https://q-summit.com",
      siteSettings: settings,
      pageContent: content,
    });
    expect(full).not.toContain("q-summit.com/program");
  });

  it("is not linked from the fixture navigation or footer", () => {
    const links = [
      ...settings.nav,
      ...settings.nav.flatMap((item) => item.children ?? []),
      ...settings.footer.links,
    ];
    expect(links.filter((link) => link.href.startsWith("/program"))).toEqual(
      [],
    );
  });

  it("is redirected to the homepage in the site config", () => {
    // astro.config.mjs is the one source: the dev server answers from it and
    // its integration writes the same rule to dist/_redirects for production.
    expect(readText("../astro.config.mjs")).toMatch(
      /"\/program":\s*\{\s*status:\s*302,\s*destination:\s*"\/"\s*\}/,
    );
  });
});
