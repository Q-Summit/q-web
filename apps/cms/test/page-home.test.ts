import { describe, expect, it } from "vitest";

import { forceDraftData } from "../src/content-sync/force-draft";
import { serializeDoc } from "../src/content-sync/serialize";
import { PageHackathon } from "../src/globals/PageHackathon";
import {
  PageHome,
  requiredWithSocialHeading,
  validateLineupSlots,
  validateLineupYear,
  validateSpokenLabel,
} from "../src/globals/PageHome";
import { SiteSettings } from "../src/globals/SiteSettings";
import { MEDIA_GLOBAL_FIELDS } from "../src/lib/media-usage";

// The raw authored field tree, before Payload sanitizes it. Named groups and
// arrays add a path segment; rows and collapsible sections are layout only.
type RawField = {
  name?: string;
  type?: string;
  required?: boolean;
  validate?: (value: unknown, options: { siblingData: unknown }) => unknown;
  fields?: RawField[];
};

/** Every named field with its dotted path; an array is written `name[]`. */
function namedFields(
  fields: RawField[] | undefined,
  prefix = "",
): { path: string; field: RawField }[] {
  const out: { path: string; field: RawField }[] = [];
  for (const field of fields ?? []) {
    const segment = !field.name
      ? ""
      : field.type === "array"
        ? `${field.name}[]`
        : field.name;
    const here = [prefix, segment].filter(Boolean).join(".");
    if (field.name) out.push({ path: here, field });
    out.push(...namedFields(field.fields, here));
  }
  return out;
}

const homeFields = namedFields(PageHome.fields as RawField[]);
const homeField = (path: string) =>
  homeFields.find((entry) => entry.path === path)?.field;

// The countdown has no date: it runs to event.startDate. Only its wording is
// stored, and the spoken sentence is the one text the site fills in.
describe("validateSpokenLabel", () => {
  it("passes an empty value, so a page without a countdown still saves", () => {
    expect(validateSpokenLabel(undefined)).toBe(true);
    expect(validateSpokenLabel(null)).toBe(true);
    expect(validateSpokenLabel("  ")).toBe(true);
  });

  it("passes a sentence that keeps all three placeholders", () => {
    expect(
      validateSpokenLabel(
        "{days} days, {hours} hours and {minutes} minutes left.",
      ),
    ).toBe(true);
  });

  it("names every placeholder that went missing", () => {
    const result = String(validateSpokenLabel("{days} days left."));
    expect(result).toContain("{hours}");
    expect(result).toContain("{minutes}");
    expect(result).not.toContain("{days}");
  });
});

describe("lineup year and slots", () => {
  const year = (value: number | null | undefined) =>
    validateLineupYear(value, {} as never);
  const slots = (value: number | null | undefined) =>
    validateLineupSlots(value, {} as never);

  it("asks for nothing while the lineup is empty", () => {
    expect(year(undefined)).toBe(true);
    expect(year(null)).toBe(true);
    expect(slots(undefined)).toBe(true);
    expect(slots(null)).toBe(true);
  });

  it("takes a whole conference year", () => {
    expect(year(2027)).toBe(true);
    expect(year(2027.5)).not.toBe(true);
    expect(year(27)).not.toBe(true);
    expect(year(2101)).not.toBe(true);
  });

  it("takes whole slots from 1 to 8", () => {
    expect(slots(1)).toBe(true);
    expect(slots(4)).toBe(true);
    expect(slots(8)).toBe(true);
    expect(slots(0)).not.toBe(true);
    expect(slots(9)).not.toBe(true);
    expect(slots(2.5)).not.toBe(true);
  });
});

// The social section is on once it has a heading, and then prints every one
// of its texts; the two labels are the names of the profile links.
describe("requiredWithSocialHeading", () => {
  const off = { siblingData: { heading: "" } };
  const on = { siblingData: { heading: "Follow the journey" } };

  it("asks for nothing while the section has no heading", () => {
    expect(requiredWithSocialHeading("", off)).toBe(true);
    expect(requiredWithSocialHeading(undefined, { siblingData: {} })).toBe(
      true,
    );
    expect(requiredWithSocialHeading(null, { siblingData: undefined })).toBe(
      true,
    );
  });

  it("requires the text once the heading is filled", () => {
    expect(requiredWithSocialHeading("", on)).not.toBe(true);
    expect(requiredWithSocialHeading("   ", on)).not.toBe(true);
    expect(requiredWithSocialHeading("LinkedIn", on)).toBe(true);
  });
});

// The live Home page was published before any of these fields existed. It
// must stay valid and publishable untouched, so nothing new may be required
// outside the rows of a new array, and no validator may reject an empty
// value. Drafts are validated on save, so this also guards plain saving.
describe("page-home 2027 fields are additive", () => {
  // Paths are the REST keys apps/web reads (CmsPageHomeDoc in pages.ts).
  const OPTIONAL_2027 = [
    "hero.badge",
    "hero.leadLines[]",
    "countdown.label",
    "countdown.daysLabel",
    "countdown.hoursLabel",
    "countdown.minutesLabel",
    "countdown.secondsLabel",
    "countdown.spokenLabel",
    "countdown.liveLabel",
    "partnerBand.eyebrow",
    "partnerBand.heading",
    "partnerBand.items[].description",
    "previousSpeakers.eyebrow",
    "previousSpeakers.alumniLabel",
    "previousSpeakers.highlights[]",
    "previousSpeakers.lineup.label",
    "previousSpeakers.lineup.year",
    "previousSpeakers.lineup.slots",
    "previousSpeakers.lineup.showPlaceholders",
    "previousSpeakers.lineup.placeholderName",
    "previousSpeakers.lineup.placeholderRole",
    "whyAttend.eyebrow",
    "whyAttend.cards[].eyebrow",
    "whyAttend.cards[].href",
    "whyAttend.cards[].linkLabel",
    "whyAttend.cards[].image",
    "whyAttend.cards[].imageAlt",
    "social.eyebrow",
    "social.heading",
    "social.intro",
    "social.linkedinLabel",
    "social.instagramLabel",
    "social.posts[]",
    "social.posts[].imageAlt",
  ];

  it.each(OPTIONAL_2027)("%s exists and is optional", (path) => {
    const field = homeField(path);
    expect(field, `no field at ${path}`).toBeDefined();
    expect(field?.required ?? false).toBe(false);
  });

  it("accepts an empty value in every validator on an optional field", () => {
    const rejected = homeFields
      .filter(({ field }) => !field.required && field.validate)
      .filter(
        ({ field }) =>
          field.validate!(undefined, { siblingData: {} }) !== true ||
          field.validate!(null, { siblingData: {} }) !== true,
      )
      .map(({ path }) => path);
    expect(rejected).toEqual([]);
  });

  it("requires nothing new outside the rows of the new arrays", () => {
    const required = homeFields
      .filter(({ field }) => field.required)
      .map(({ path }) => path)
      .sort();
    expect(required).toEqual(
      [
        // Published before 2027.
        "title",
        "hero.headline",
        "hero.tagline",
        "hero.announcementLines[].text",
        "hero.cta.label",
        "hero.cta.href",
        "event.startDate",
        "event.endDate",
        "stats.heading",
        "stats.intro",
        "stats.items[].value",
        "stats.items[].label",
        "stats.items[].logos[].text",
        "partnerBand.items[].label",
        "partnerBand.items[].logos[].text",
        "partnerBand.cta.label",
        "partnerBand.cta.href",
        "previousSpeakers.heading",
        "previousSpeakers.intro",
        "previousSpeakers.cta.label",
        "previousSpeakers.cta.href",
        "whyAttend.heading",
        "whyAttend.intro",
        "whyAttend.cards[].title",
        "whyAttend.cards[].description",
        "whyAttend.cta.label",
        "whyAttend.cta.href",
        "faqSection.heading",
        "faqSection.intro",
        "faqSection.cta.label",
        "faqSection.cta.href",
        // New arrays: a row that exists must be complete.
        "hero.leadLines[].text",
        "previousSpeakers.highlights[].text",
        "previousSpeakers.standIns[].text",
        "social.posts[].platform",
        "social.posts[].href",
        "social.posts[].image",
      ].sort(),
    );
  });

  it("keeps room for more posts than the four the page shows", () => {
    // New posts are added at the end and the page shows the newest four,
    // so the list must be able to hold a fifth without a row being deleted
    // first.
    expect(
      (homeField("social.posts[]") as { maxRows?: number }).maxRows,
    ).toBeGreaterThan(4);
  });

  it("links an audience tile like every other internal link", () => {
    const validate = homeField("whyAttend.cards[].href")!.validate!;
    const run = (value: unknown) => validate(value, { siblingData: {} });
    expect(run("/whyq/students")).toBe(true);
    expect(run("https://example.com/students")).toBe(true);
    expect(run("whyq students")).not.toBe(true);
  });

  it("takes only a full address for a social post", () => {
    const validate = homeField("social.posts[].href")!.validate!;
    const run = (value: unknown) => validate(value, { siblingData: {} });
    expect(run("https://www.linkedin.com/posts/example")).toBe(true);
    expect(run("/whyq")).not.toBe(true);
    expect(run("")).not.toBe(true);
  });
});

// Every array stores its rows in its own table. The shared helpers add the
// 2027 fields only where they are asked to, so arrays that do not show them
// gain no column.
describe("shared row helpers stay scoped to the home arrays that use them", () => {
  const rowFields = (fields: RawField[], path: string) =>
    namedFields(fields)
      .filter((entry) => entry.path.startsWith(`${path}.`))
      .map((entry) => entry.path.slice(path.length + 1));

  it("adds the description line to the partner rows only", () => {
    const home = PageHome.fields as RawField[];
    expect(rowFields(home, "partnerBand.items[]")).toEqual([
      "value",
      "label",
      "description",
      "logos[]",
      "logos[].text",
    ]);
    expect(rowFields(home, "stats.items[]")).toEqual([
      "value",
      "label",
      "logos[]",
      "logos[].text",
    ]);
  });

  it("lets a partner row go without a count, but not a stat", () => {
    expect(homeField("partnerBand.items[].value")?.required ?? false).toBe(
      false,
    );
    expect(homeField("stats.items[].value")?.required).toBe(true);
  });

  it("leaves the hackathon benefit cards at title and description", () => {
    expect(
      rowFields(PageHackathon.fields as RawField[], "benefits.cards[]"),
    ).toEqual(["title", "description"]);
  });
});

// NavLink.children in apps/web/src/lib/content/site-settings.ts.
describe("site-settings nav sub-items", () => {
  const settings = namedFields(SiteSettings.fields as RawField[]);
  const at = (path: string) =>
    settings.find((entry) => entry.path === path)?.field;

  it("is an optional array of label and href on each nav item", () => {
    expect(at("nav[].children[]")?.required ?? false).toBe(false);
    expect(at("nav[].children[].label")?.required).toBe(true);
    expect(at("nav[].children[].href")?.required).toBe(true);
  });

  it("validates a sub-item link exactly like the nav item link", () => {
    const item = at("nav[].href")!.validate!;
    const child = at("nav[].children[].href")!.validate!;
    for (const value of [
      "/whyq/students",
      "#why-attend",
      "https://example.com",
      "mailto:jane@example.com",
      "not a link",
      "",
    ]) {
      expect(child(value, { siblingData: {} })).toBe(
        item(value, { siblingData: {} }),
      );
    }
    expect(child("/whyq/students", { siblingData: {} })).toBe(true);
    expect(child("not a link", { siblingData: {} })).not.toBe(true);
  });
});

// The "Used on" panel and the delete guard only see uploads registered in
// media-usage.ts; an unregistered one would call a file unused while a tile
// or a post still shows it.
describe("page-home uploads are registered for media usage", () => {
  it("lists every upload field of the Home page", () => {
    const uploads = homeFields
      .filter(({ field }) => field.type === "upload")
      .map(({ path }) => path)
      .sort();
    const registered = MEDIA_GLOBAL_FIELDS.find(
      (entry) => entry.slug === "page-home",
    )?.refs.map((ref) => ref.fieldPath);
    expect(uploads).toEqual([
      "social.posts[].image",
      "whyAttend.cards[].image",
    ]);
    expect([...(registered ?? [])].sort()).toEqual(uploads);
  });
});

// Content packages treat uploads by shape, not by field name, so the new
// nested uploads need no entry anywhere. This pins that: the 2027 keys
// survive export and apply, and both uploads travel as filename refs.
describe("page-home 2027 fields survive the export -> propose round-trip", () => {
  const media = (filename: string, alt: string) => ({
    id: 7,
    filename,
    alt,
    url: `https://example.test/media/${filename}`,
    mimeType: "image/webp",
    filesize: 1234,
    width: 800,
    height: 533,
  });

  it("keeps every new key and maps both uploads to filename refs", () => {
    const doc = {
      id: 1,
      hero: {
        badge: "Fixture badge",
        leadLines: [{ id: "row-a", text: "Fixture lead line" }],
      },
      countdown: { spokenLabel: "{days} {hours} {minutes}" },
      partnerBand: {
        heading: "Fixture partners",
        items: [
          { id: "row-b", value: "", label: "Fixture", description: "Line" },
        ],
      },
      previousSpeakers: {
        highlights: [{ id: "row-c", text: "Fixture Speaker" }],
        lineup: { label: "2099", year: 2099, slots: 4, showPlaceholders: true },
      },
      whyAttend: {
        cards: [
          {
            id: "row-d",
            title: "Fixture audience",
            description: "Fixture pitch",
            eyebrow: "Fixture",
            href: "/whyq/students",
            linkLabel: "Fixture more",
            image: media("fixture-tile.webp", "Fixture tile"),
            imageAlt: "Fixture tile on the page",
          },
        ],
      },
      social: {
        heading: "Fixture social",
        posts: [
          {
            id: "row-e",
            platform: "linkedin",
            href: "https://example.com/post",
            image: media("fixture-post.webp", "Fixture post"),
            imageAlt: "Fixture post on the page",
          },
        ],
      },
      _status: "published",
    };

    const applied = forceDraftData(serializeDoc(doc));

    expect(applied).toEqual({
      hero: {
        badge: "Fixture badge",
        leadLines: [{ text: "Fixture lead line" }],
      },
      countdown: { spokenLabel: "{days} {hours} {minutes}" },
      partnerBand: {
        heading: "Fixture partners",
        items: [{ value: "", label: "Fixture", description: "Line" }],
      },
      previousSpeakers: {
        highlights: [{ text: "Fixture Speaker" }],
        lineup: { label: "2099", year: 2099, slots: 4, showPlaceholders: true },
      },
      whyAttend: {
        cards: [
          {
            title: "Fixture audience",
            description: "Fixture pitch",
            eyebrow: "Fixture",
            href: "/whyq/students",
            linkLabel: "Fixture more",
            image: { filename: "fixture-tile.webp", alt: "Fixture tile" },
            imageAlt: "Fixture tile on the page",
          },
        ],
      },
      social: {
        heading: "Fixture social",
        posts: [
          {
            platform: "linkedin",
            href: "https://example.com/post",
            image: { filename: "fixture-post.webp", alt: "Fixture post" },
            imageAlt: "Fixture post on the page",
          },
        ],
      },
      _status: "draft",
    });
  });

  it("keeps nav sub-items on a site-settings package", () => {
    const applied = forceDraftData(
      serializeDoc({
        id: 1,
        nav: [
          {
            id: "row-a",
            label: "Why Q?",
            href: "/whyq",
            children: [
              {
                id: "row-b",
                label: "Fixture audience",
                href: "/whyq/students",
              },
            ],
          },
        ],
      }),
    );
    expect(applied.nav).toEqual([
      {
        label: "Why Q?",
        href: "/whyq",
        children: [{ label: "Fixture audience", href: "/whyq/students" }],
      },
    ]);
  });
});
