#!/usr/bin/env node
/*
 * Transform script (see docs/architecture/08-concepts.md and
 * docs/dev/local-development.md).
 *
 * Reads the scrape-shaped site-mirror/extracted/pages.json (sections[]
 * with sectionClass/headings[]/paragraphs[], positional pairing) plus a
 * handful of raw HTML pages the scrape didn't capture as structured data,
 * and emits the semantic content model the web app actually consumes:
 *
 *   - page-content.json
 *   - site-settings.json
 *
 * under the sibling site-mirror/extracted checkout. Copy the outputs into
 * the maintainer-held content snapshot (outside git) when refreshing it.
 *
 * It also patches speakers.json with a verbatim `roleLine` per speaker,
 * scraped from the raw HTML (see buildRoleLineMap).
 *
 * Pure function of its inputs (pages.json, speakers.json, raw/*.html, and a
 * few verbatim literals ported from the live site for pages pages.json never
 * covered, documented inline below) plus the intentional deviations
 * (LATEBIRD/discount removal, the footer tagline redesign, the year-agnostic
 * whyq title).
 * Re-running produces byte-identical output for page-derived fields.
 * Exception: site-settings.json `llms` (LLM identity) is curated in the
 * snapshot's site-settings.json and preserved across regenerations.
 */

import { readFile, writeFile, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
// apps/web/scripts -> q-summit/site-mirror/{extracted,raw} when this repo
// sits next to site-mirror under the same parent (q-summit/).
const DEFAULT_MIRROR_ROOT = join(here, "../../../../site-mirror");
const CONTENT_DIR = join(DEFAULT_MIRROR_ROOT, "extracted");
const RAW_DIR = join(DEFAULT_MIRROR_ROOT, "raw");

async function readJson(filename) {
  const raw = await readFile(join(CONTENT_DIR, filename), "utf-8");
  return JSON.parse(raw);
}

async function writeJson(filename, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(join(CONTENT_DIR, filename), json, "utf-8");
}

const rawHtmlCache = new Map();
async function readRawHtml(filename) {
  if (!rawHtmlCache.has(filename)) {
    rawHtmlCache.set(
      filename,
      await readFile(join(RAW_DIR, filename), "utf-8"),
    );
  }
  return rawHtmlCache.get(filename);
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/* --- Small helpers that throw instead of silently falling back.
 * The old .astro pages hardcoded fallback copy (`?? "FAQs"` etc.) for
 * content the scrape might not have found; the semantic content model
 * instead fails the build loudly so a missing field gets fixed at the
 * source, never papered over with invented copy. */

function requireSection(sections, predicate, context) {
  const match = sections.find(predicate);
  if (!match) {
    throw new Error(
      `[build-page-content] ${context}: no matching section in pages.json`,
    );
  }
  return match;
}

function requireHeading(section, index, context) {
  const heading = section.headings?.[index];
  if (!heading) {
    throw new Error(
      `[build-page-content] ${context}: missing heading at index ${index}`,
    );
  }
  return heading.text;
}

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/**
 * Derive { startDate, endDate } (ISO yyyy-mm-dd) from a scraped announcement
 * line such as "April 1-2, 2027". Same-month spans only, which is all the
 * scrape has ever contained.
 *
 * Throws when nothing matches, on purpose: this runs by hand, so a failure is
 * a maintainer reading the message and typing the two dates, not a broken
 * deploy. Once seeded, `home.event` in Payload owns these values.
 */
function deriveEventDates(announcementLines) {
  const pattern = /^([A-Za-z]+)\s+(\d{1,2})-(\d{1,2}),\s*(\d{4})$/;
  for (const line of announcementLines) {
    const match = line.trim().match(pattern);
    if (!match) continue;
    const [, monthName, startDay, endDay, year] = match;
    const monthIndex = MONTH_NAMES.indexOf(monthName.toLowerCase());
    if (monthIndex === -1) continue;
    const month = String(monthIndex + 1).padStart(2, "0");
    const pad = (day) => day.padStart(2, "0");
    return {
      startDate: `${year}-${month}-${pad(startDay)}`,
      endDate: `${year}-${month}-${pad(endDay)}`,
    };
  }
  throw new Error(
    'build-page-content: could not derive home.event from the announcement lines (expected e.g. "April 1-2, 2027"; got ' +
      `${JSON.stringify(announcementLines)}). Set home.event.startDate / endDate by hand in the generated JSON, ` +
      "or extend deriveEventDates for the new copy format.",
  );
}

function requireParagraph(section, index, context) {
  const paragraph = section.paragraphs?.[index];
  if (paragraph === undefined) {
    throw new Error(
      `[build-page-content] ${context}: missing paragraph at index ${index}`,
    );
  }
  return paragraph;
}

function requireCta(section, index, context) {
  const cta = section.ctas?.[index];
  if (!cta) {
    throw new Error(
      `[build-page-content] ${context}: missing cta at index ${index}`,
    );
  }
  return { label: cta.label, href: cta.href };
}

/* --- Home --- */

function buildHome(pageCopy) {
  const page = pageCopy.pages.index;
  const sections = page.sections;

  const hero = requireSection(
    sections,
    (s) => s.sectionClass.includes("section_header7"),
    "home.hero",
  );
  const numbers = requireSection(
    sections,
    (s) => s.sectionClass === "section_home_numbers",
    "home.stats",
  );
  const partnerBandSection = requireSection(
    sections,
    (s) => s.sectionClass.includes("logo_slider"),
    "home.partnerBand",
  );
  const partnerCtaSection = requireSection(
    sections,
    (s) => s.sectionClass === "margin-top margin-xxlarge",
    "home.partnerBand.cta",
  );
  const team = requireSection(
    sections,
    (s) => s.sectionClass === "section_home_team",
    "home.previousSpeakers",
  );
  const why = requireSection(
    sections,
    (s) => s.sectionClass === "section_why_attend",
    "home.whyAttend",
  );
  const faqSection = requireSection(
    sections,
    (s) => s.sectionClass === "section_home_faq",
    "home.faqSection",
  );

  // The extraction flattened the announcement's <br> line breaks to " / ".
  const announcementLines = requireParagraph(hero, 1, "home.hero.announcement")
    .split(" / ")
    .filter(Boolean);

  // Machine-readable conference dates, derived ONCE here from the scraped
  // announcement copy to give the CMS field an initial value. This is the only
  // place that derivation is acceptable: this generator is a maintainer-run
  // one-shot over a Webflow scrape, so a format it cannot read is a person
  // fixing it immediately. The site build must never parse this copy (it did,
  // and one editor rephrasing the banner then broke every deploy); after
  // seeding, home.event in Payload is the truth and editors set it in a date
  // picker.
  const eventDates = deriveEventDates(announcementLines);

  // Card titles are the section's h3 headings; each pairs with the
  // paragraph that follows the intro, in document order.
  const whyCardTitles = why.headings.slice(1).map((h) => h.text);
  const whyCards = whyCardTitles.map((title, i) => ({
    title,
    description: requireParagraph(why, i + 1, `home.whyAttend.cards[${i}]`),
  }));

  return {
    title: page.title,
    metaDescription: page.metaDescription,
    hero: {
      headline: requireHeading(hero, 0, "home.hero.headline"),
      tagline: requireParagraph(hero, 0, "home.hero.tagline"),
      announcementLines,
      cta: requireCta(hero, 0, "home.hero.cta"),
    },
    event: eventDates,
    stats: {
      heading: requireHeading(numbers, 0, "home.stats.heading"),
      intro: requireParagraph(numbers, 0, "home.stats.intro"),
      items: (numbers.stats ?? []).map(({ value, label }) => ({
        value,
        label,
      })),
    },
    partnerBand: {
      items: (partnerBandSection.stats ?? []).map(
        ({ value, label, logos }) => ({
          value,
          label,
          logos: logos ?? [],
        }),
      ),
      cta: requireCta(partnerCtaSection, 0, "home.partnerBand.cta"),
    },
    previousSpeakers: {
      heading: requireHeading(team, 0, "home.previousSpeakers.heading"),
      intro: requireParagraph(team, 0, "home.previousSpeakers.intro"),
      cta: requireCta(team, 0, "home.previousSpeakers.cta"),
    },
    whyAttend: {
      heading: requireHeading(why, 0, "home.whyAttend.heading"),
      intro: requireParagraph(why, 0, "home.whyAttend.intro"),
      cards: whyCards,
      cta: requireCta(why, 0, "home.whyAttend.cta"),
    },
    faqSection: {
      heading: requireHeading(faqSection, 0, "home.faqSection.heading"),
      intro: requireParagraph(faqSection, 0, "home.faqSection.intro"),
      cta: requireCta(faqSection, 0, "home.faqSection.cta"),
    },
  };
}

/* --- Why Q? ---
 *
 * The image-left Webflow component renders its item titles as styled divs,
 * so the scrape captured them as missing h3 headings for the "startups" and
 * "partners" audiences. fallbackTitles bakes in the verbatim live copy
 * (raw/whyq.html: both sections use "Talent" / "Trends" sub-labels) instead
 * of leaving them blank.
 */

const WHYQ_AUDIENCES = [
  {
    id: "attendees",
    sectionIndex: 1,
    imageFile: "whyq-attendees",
    imageAlt: "Attendees networking in the crowd at Q-Summit",
    imageLeft: false,
  },
  {
    id: "startups",
    sectionIndex: 2,
    imageFile: "whyq-startups",
    imageAlt: "Startup booth conversations at Q-Summit",
    imageLeft: true,
    fallbackTitles: ["Talent", "Trends"],
  },
  {
    id: "investors",
    sectionIndex: 3,
    imageFile: "whyq-investors",
    imageAlt: "Investors in conversation at Q-Summit",
    imageLeft: false,
  },
  {
    id: "partners",
    sectionIndex: 4,
    imageFile: "whyq-partners",
    imageAlt: "Partner booths in the Innovillage at Q-Summit",
    imageLeft: true,
    fallbackTitles: ["Talent", "Trends"],
  },
  {
    id: "founders",
    sectionIndex: 5,
    imageFile: "whyq-founders",
    imageAlt: "A founder speaking on stage at Q-Summit",
    imageLeft: false,
  },
];

// Intentional deviation (like the LATEBIRD/discount removal and the footer
// tagline above): the scraped title is "Q-Summit 2025 - Why you should
// attend", pinned to a year that is already two conferences stale next to
// the 2026/2027 framing used everywhere else on the page. Overridden here
// with a year-agnostic title, matching the title-case style of the other
// page-content.json titles (e.g. "Speakers of Q-Summit").
const WHYQ_TITLE = "Why You Should Attend Q-Summit";

function buildWhyq(pageCopy) {
  const page = pageCopy.pages.whyq;
  const sections = page.sections;
  const header = sections[0];
  if (!header)
    throw new Error("[build-page-content] whyq.header: missing section");

  const audiences = WHYQ_AUDIENCES.map(
    ({
      id,
      sectionIndex,
      imageFile,
      imageAlt,
      imageLeft,
      fallbackTitles = [],
    }) => {
      const section = sections[sectionIndex];
      if (!section) {
        throw new Error(
          `[build-page-content] whyq.audiences.${id}: missing section`,
        );
      }
      const titles = section.headings.slice(1).map((h) => h.text);
      const items = section.paragraphs.slice(1).map((description, i) => {
        const title = titles[i] ?? fallbackTitles[i];
        if (!title) {
          throw new Error(
            `[build-page-content] whyq.audiences.${id}.items[${i}]: missing title`,
          );
        }
        return { title, description };
      });
      return {
        id,
        heading: requireHeading(section, 0, `whyq.audiences.${id}.heading`),
        intro: requireParagraph(section, 0, `whyq.audiences.${id}.intro`),
        items,
        imageFile,
        imageAlt,
        imageLeft,
      };
    },
  );

  return {
    title: WHYQ_TITLE,
    metaDescription: page.metaDescription,
    heading: requireHeading(header, 0, "whyq.heading"),
    intro: requireParagraph(header, 0, "whyq.intro"),
    audiences,
  };
}

/* --- Program --- */

function buildProgram(pageCopy) {
  const page = pageCopy.pages.program;
  const sections = page.sections;

  const agendaSection = requireSection(
    sections,
    (s) => Array.isArray(s.agenda),
    "program.agenda",
  );
  const faqSection = requireSection(
    sections,
    (s) => Array.isArray(s.faqs),
    "program.faqSection",
  );
  const ctaSection = requireSection(
    sections,
    (s) => s.sectionClass === "section_program_cta",
    "program.closingCta",
  );

  return {
    title: page.title,
    metaDescription: page.metaDescription,
    agenda: {
      heading: requireHeading(agendaSection, 0, "program.agenda.heading"),
      intro: requireParagraph(agendaSection, 0, "program.agenda.intro"),
      items: agendaSection.agenda,
    },
    faqSection: {
      heading: requireHeading(faqSection, 0, "program.faqSection.heading"),
      intro: requireParagraph(faqSection, 0, "program.faqSection.intro"),
    },
    // Live (raw/program.html) renders an empty button-group here: the
    // invented "Get Tickets" / "Contact Us" buttons are dropped, not
    // replaced by other fields.
    closingCta: {
      heading: requireHeading(ctaSection, 0, "program.closingCta.heading"),
      text: requireParagraph(ctaSection, 0, "program.closingCta.text"),
    },
  };
}

/* --- Ticket categories --- */

function buildTicketCategories(pageCopy) {
  const page = pageCopy.pages["ticket-categories"];
  const sections = page.sections;

  const tiersSection = requireSection(
    sections,
    (s) => Array.isArray(s.ticketTiers),
    "ticketCategories.tiers",
  );
  const comparisonSection = requireSection(
    sections,
    (s) => Boolean(s.pricingComparison),
    "ticketCategories.comparison",
  );
  const categoriesSection = requireSection(
    sections,
    (s) => Array.isArray(s.ticketCategoryDetails),
    "ticketCategories.categories",
  );

  // Drop the LATEBIRD discount-code paragraph and the latebird/on-conference
  // pricing fields entirely: an intentional deviation from the live site
  // (docs/architecture/08-concepts.md), applied here in the transform rather than filtered by
  // components.
  const introParagraphs = tiersSection.paragraphs.filter(
    (p) => !/LATEBIRD/i.test(p),
  );
  if (introParagraphs.length === 0) {
    throw new Error(
      "[build-page-content] ticketCategories.tiers.intro: no non-LATEBIRD paragraph found",
    );
  }

  const tiers = tiersSection.ticketTiers.map(
    ({ name, price, features, buyLabel, buyHref, note }) => ({
      name,
      price,
      features,
      ...(note ? { note } : {}),
      buyLabel,
      buyHref,
    }),
  );

  return {
    title: page.title,
    metaDescription: page.metaDescription,
    tiers: {
      heading: requireHeading(
        tiersSection,
        0,
        "ticketCategories.tiers.heading",
      ),
      intro: introParagraphs[0],
      items: tiers,
    },
    comparison: {
      heading: requireHeading(
        comparisonSection,
        0,
        "ticketCategories.comparison.heading",
      ),
      intro: requireParagraph(
        comparisonSection,
        0,
        "ticketCategories.comparison.intro",
      ),
      tiers: comparisonSection.pricingComparison.tiers,
      groups: comparisonSection.pricingComparison.groups,
      // Verbatim live copy (raw/ticket-categories.html "tickets_pricing_alert-box-info-text"):
      // the info banner between the ticket cards and this comparison table.
      academicNote:
        "Looking for an academic focus? Cheaper 'On-Conference' variations are available for Students and Young Professionals.",
    },
    categories: {
      heading: requireHeading(
        categoriesSection,
        0,
        "ticketCategories.categories.heading",
      ),
      items: categoriesSection.ticketCategoryDetails,
    },
  };
}

/* --- Contact --- */

function buildContact(pageCopy) {
  const page = pageCopy.pages.contact;
  const sections = page.sections;

  const boardSection = requireSection(
    sections,
    (s) => Array.isArray(s.boardMembers),
    "contact.board",
  );
  const reachSection = requireSection(
    sections,
    (s) => Array.isArray(s.contactItems),
    "contact.reachOut",
  );

  return {
    title: page.title,
    metaDescription: page.metaDescription,
    board: {
      heading: requireHeading(boardSection, 0, "contact.board.heading"),
      paragraphs: boardSection.paragraphs,
      members: boardSection.boardMembers,
    },
    reachOut: {
      heading: requireHeading(reachSection, 0, "contact.reachOut.heading"),
      paragraphs: reachSection.paragraphs,
      items: reachSection.contactItems,
    },
  };
}

/* --- Hackathon --- */

function buildHackathon(pageCopy) {
  const page = pageCopy.pages.hackathon;
  const sections = page.sections;

  const heroSection = requireSection(
    sections,
    (s) => s.tag === "header",
    "hackathon.hero",
  );
  const partnersSection = requireSection(
    sections,
    (s) => Array.isArray(s.partnerGroups),
    "hackathon.partners",
  );
  const benefitsSection = requireSection(
    sections,
    (s) => Array.isArray(s.featureCards),
    "hackathon.benefits",
  );
  const scheduleSection = requireSection(
    sections,
    (s) => Array.isArray(s.agenda),
    "hackathon.schedule",
  );
  const faqSection = requireSection(
    sections,
    (s) => Array.isArray(s.faqs),
    "hackathon.faqSection",
  );
  const ctaSection = requireSection(
    sections,
    (s) => s.sectionClass === "section_hackathon_cta",
    "hackathon.closingCta",
  );
  const mailto = ctaSection.mailtos?.[0];
  if (!mailto) {
    throw new Error(
      "[build-page-content] hackathon.closingCta.mailto: missing",
    );
  }

  return {
    title: page.title,
    metaDescription: page.metaDescription,
    hero: {
      headline: requireHeading(heroSection, 0, "hackathon.hero.headline"),
      tagline: requireParagraph(heroSection, 0, "hackathon.hero.tagline"),
      cta: requireCta(heroSection, 0, "hackathon.hero.cta"),
    },
    partners: {
      heading: requireHeading(partnersSection, 0, "hackathon.partners.heading"),
      // Intentional deviation (like the LATEBIRD/discount removal above):
      // every Challenge Partner's flip-card note scraped as the same
      // unannounced placeholder ("Challenge to be announced"), not real
      // per-partner content, so it is dropped here rather than filtered in
      // the component. Cards render as plain logo cards (matching the
      // other, note-less tiers) until a real note lands upstream.
      groups: partnersSection.partnerGroups.map((group) => ({
        ...group,
        partners: group.partners.map((partner) => ({ ...partner, note: null })),
      })),
    },
    benefits: {
      heading: requireHeading(benefitsSection, 0, "hackathon.benefits.heading"),
      cards: benefitsSection.featureCards,
    },
    schedule: {
      heading: requireHeading(scheduleSection, 0, "hackathon.schedule.heading"),
      intro: requireParagraph(scheduleSection, 0, "hackathon.schedule.intro"),
      items: scheduleSection.agenda,
    },
    faqSection: {
      heading: requireHeading(faqSection, 0, "hackathon.faqSection.heading"),
      intro: requireParagraph(faqSection, 0, "hackathon.faqSection.intro"),
    },
    closingCta: {
      heading: requireHeading(ctaSection, 0, "hackathon.closingCta.heading"),
      text: requireParagraph(ctaSection, 0, "hackathon.closingCta.text"),
      mailtoLabel: mailto.label,
      mailtoEmail: mailto.email,
    },
  };
}

/* --- Simple pages: no pages.json entry exists for these live pages, so
 * their copy is ported verbatim from the current .astro files / raw HTML
 * (see the per-field comments) rather than transformed from a scrape
 * section. */

function buildSimplePages() {
  return {
    ourTeam: {
      title: "Our Team",
      metaDescription:
        "Get to know the current Q-Summit organizing team: the students behind Germany's largest student-organized startup conference.",
      heading: "Get to know our Team!",
    },
    pastTeams: {
      title: "Past Teams",
      metaDescription:
        "A thank you to the former Q-Summit teams whose dedication since 2016 laid the foundation for Germany's largest student-organized startup conference.",
      heading: "Get to know our Team!",
      // Typographic apostrophe (U+2019), matching raw/past-teams.html
      // verbatim ("Q-Summit’s journey"), not the straight ASCII "'".
      intro:
        "Our former teams have been an integral part of Q-Summit’s journey. We are deeply grateful for their commitment, passion, and shared belief in our vision. Since 2016, their dedication laid the foundation for what Q-Summit is today, and their collective efforts continue to inspire our growth and future success.",
    },
    partner: {
      title: "Partner",
      metaDescription:
        "Get to know the numerous supporters and partners of Q-Summit.",
      heading: "Get to know our Partners of Q-Summit 2026!",
      cta: {
        heading: "Join Us as a Partner",
        text: "Unlock new possibilities for collaboration.",
        buttonLabel: "Inquire",
        buttonHref: "mailto:lennart.fielhauer@q-summit.com",
      },
    },
    speaker: {
      title: "Speakers of Q-Summit",
      metaDescription:
        "Get to know the speakers, moderation and Main Stage Panels of Q-Summit 2026 and former speakers of Q-Summit!",
      heading: "The Voices of Q-Summit 2026",
      intro:
        "Join us as we explore innovative ideas and impactful solutions from our esteemed speakers.",
      // Verbatim live copy (raw/speaker.html "panel_card" blocks): note the
      // live punctuation kept as-is, a hyphen (not a colon) in the first
      // title and a dash (not a comma) in the second description.
      panels: [
        {
          title: "Europe's Edge - Founders Without Borders",
          description:
            "Europe’s true strength lies in its diversity. When founders collaborate across countries, cultures, and markets, ideas scale faster and become globally competitive. By breaking down borders, Europe can build companies that are resilient, innovative, and truly international from day one.",
          iconKey: "globe",
        },
        {
          title: "Capital Meets Innovation",
          description:
            "Great ideas need the right partners to grow. A strong funding ecosystem brings founders and investors closer than ever before. When capital meets bold innovation, sustainable companies emerge - creating real impact across industries and society.",
          iconKey: "refund",
        },
        {
          title: "Shaping Tomorrow With AI",
          description:
            "Artificial intelligence is not a passing trend, it is fundamentally redefining how we build, operate and innovate. From startups to global enterprises, AI is shaping the next generation of products and business models. Europe has the talent, responsibility and opportunity to lead this transformation.",
          iconKey: "ai",
        },
      ],
    },
    jobs: {
      title: "Job Listings",
      metaDescription:
        "Get to know the numerous job requisitions of our supporters and partners.",
      heading: "Scroll through the Best Opportunities from our Partner Network",
      intro:
        "Get to know the numerous job requisitions of our supporters and partners.",
      // Live (raw/job-listings__*.html "get-in-touch" div) keeps the
      // trailing colon; not the invented headline-style "How to get in
      // touch" the port previously used.
      detailHowToContactHeading: "How to get in touch:",
    },
  };
}

/* --- Site settings --- */

function platformFromLabel(label) {
  if (label.includes("TikTok")) return "tiktok";
  if (label.includes("Instagram Q-Summit")) return "instagram-qsummit";
  if (label.includes("Instagram Q-Hack")) return "instagram-qhack";
  if (label.includes("LinkedIn")) return "linkedin";
  if (label.includes("YouTube")) return "youtube";
  throw new Error(
    `[build-page-content] site-settings.footer.socialLinks: unmapped platform for label "${label}"`,
  );
}

function buildSiteSettings(pageCopy) {
  // Footer link/social data is identical across every page.json entry; the
  // index page's copy is as good as any other.
  const footerSource = pageCopy.pages.index.footer;

  return {
    siteTitle: "Q-Summit",
    // Live nav (raw/index.html "nav-menu"), 7 items, home reachable via the
    // logo only (no Home/Tickets/Contact nav entries).
    nav: [
      { label: "Why Q?", href: "/whyq" },
      { label: "Speaker", href: "/speaker" },
      { label: "Partner", href: "/partner" },
      { label: "Program", href: "/program" },
      { label: "Hackathon", href: "/hackathon" },
      { label: "Our Team", href: "/our-team" },
      { label: "Job Listings", href: "/job-listings" },
    ],
    footer: {
      // Approved redesign copy (kept verbatim from the current port; not
      // live-site copy). Live's footer.tagline is a two-sentence brand
      // statement; this stays, only the copyright clause changes below.
      tagline:
        "Where visionaries shape tomorrow. Germany's largest student-led startup conference, organized in Mannheim since 2017.",
      links: footerSource.links,
      socialLinks: footerSource.socialLinks.map((link) => ({
        label: link.label,
        href: link.href,
        platform: platformFromLabel(link.label),
      })),
      // Live copyright (raw/index.html "footer1_credit-text"): "© <year>
      // Q-Summit. All rights reserved." Drops the "an der Universitaet
      // Mannheim e. V." clause the port previously invented.
      copyrightHolder: "Q-Summit",
    },
  };
}

/* --- Speaker roleLine extraction ---
 *
 * pages.json has no speaker-page entry (it isn't in the scrape's page set),
 * so the verbatim "Role, Company" (or "Role of Company" / "Role @Company" /
 * plain "Role") lines are scraped straight from the raw HTML mirror instead.
 * Each source below corresponds to exactly one `group` value in
 * speakers.json, which is enough to disambiguate every duplicate name in
 * the current dataset (e.g. "Christian Wolf" appears once as a
 * previous-highlights speaker and once in the main-stage-homepage carousel,
 * with different live phrasing in each place).
 */

const ROLE_LINE_SOURCES = [
  {
    file: "speaker.html",
    group: "speakers-2026",
    // <div class="speaker_content_name">NAME</div><div class="speaker_content_title">ROLE</div>
    pattern:
      /speaker_content_name">([^<]+)<\/div><div class="speak[^"]*">([^<]*)<\/div>/g,
  },
  {
    file: "speaker.html",
    group: "moderation-2026",
    pattern:
      /moderator_name">([^<]+)<\/div><div class="moderator_title">([^<]*)<\/div>/g,
  },
  {
    file: "speaker.html",
    group: "previous-highlights",
    pattern:
      /prev_speaker_description_name">([^<]+)<\/div><div class="prev_speaker_description_role">([^<]*)<\/div>/g,
  },
  {
    file: "index.html",
    group: "main-stage-homepage",
    // Inlined JS "speakers" array powering the old client-side carousel.
    pattern: /name:\s*"([^"]*)",\s*title:\s*"([^"]*)"/g,
  },
];

async function buildRoleLineMap() {
  const map = new Map();
  for (const { file, group, pattern } of ROLE_LINE_SOURCES) {
    const html = await readRawHtml(file);
    for (const match of html.matchAll(pattern)) {
      const name = decodeEntities(match[1]).trim();
      const roleLine = decodeEntities(match[2]).trim();
      map.set(`${name}|${group}`, roleLine);
    }
  }
  return map;
}

/*
 * The same inlined `const speakers = [...]` array (raw/index.html) that
 * powers ROLE_LINE_SOURCES' main-stage-homepage entry also carries a `bio`
 * and an `image` (full Webflow CDN URL) per speaker, e.g.:
 *
 *   { name: "...", title: "...", bio: "...", image: "https://cdn.prod.
 *     website-files.com/<site-id>/<hash>_<name>.jpg" }
 *
 * Those 5 photos were recovered from the live CDN into public/media/ (see
 * docs/dev/local-development.md); this captures the basename so speakers.json can carry
 * photoFilename + bio for the group, not just roleLine.
 */
const MAIN_STAGE_ENTRY_PATTERN =
  /name:\s*"((?:[^"\\]|\\.)*)",\s*title:\s*"((?:[^"\\]|\\.)*)",\s*bio:\s*"((?:[^"\\]|\\.)*)",\s*image:\s*"((?:[^"\\]|\\.)*)"/g;

async function buildMainStageDataMap() {
  const html = await readRawHtml("index.html");
  const map = new Map();
  for (const match of html.matchAll(MAIN_STAGE_ENTRY_PATTERN)) {
    const name = decodeEntities(match[1]).trim();
    const roleLine = decodeEntities(match[2]).trim();
    const bio = decodeEntities(match[3]).trim();
    const imageUrl = decodeEntities(match[4]).trim();
    const photoFilename = imageUrl.split("/").pop();
    map.set(name, { roleLine, bio, photoFilename });
  }
  return map;
}

async function patchSpeakerRoleLines() {
  const speakers = await readJson("speakers.json");
  const roleLineMap = await buildRoleLineMap();
  const mainStageDataMap = await buildMainStageDataMap();

  const missing = [];
  const patched = speakers.map((speaker) => {
    const key = `${speaker.name}|${speaker.group}`;
    const roleLine = roleLineMap.get(key);
    if (!roleLine) {
      missing.push(key);
      return speaker;
    }

    if (speaker.group !== "main-stage-homepage") {
      return { ...speaker, roleLine };
    }

    // The 5 main-stage-homepage highlights also get a verbatim bio and the
    // recovered CDN photo's basename; the roleLine map above and this map
    // parse the same source array, so cross-check they agree.
    const extra = mainStageDataMap.get(speaker.name);
    if (!extra) {
      missing.push(key);
      return speaker;
    }
    if (extra.roleLine !== roleLine) {
      throw new Error(
        `[build-page-content] roleLine mismatch for "${speaker.name}" (main-stage-homepage): ` +
          `"${roleLine}" vs "${extra.roleLine}"`,
      );
    }
    return {
      ...speaker,
      roleLine,
      bio: extra.bio,
      photoFilename: extra.photoFilename,
    };
  });

  if (missing.length > 0) {
    throw new Error(
      `[build-page-content] missing verbatim roleLine for ${missing.length} speaker(s): ${missing.join(", ")}`,
    );
  }

  await writeJson("speakers.json", patched);
  return patched;
}

async function fileExists(path) {
  try {
    await access(path, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/** Preserve the mirror copy's curated site-settings.json `llms`. */
async function loadPreservedLlms() {
  const candidates = [join(CONTENT_DIR, "site-settings.json")];
  for (const path of candidates) {
    if (!(await fileExists(path))) continue;
    try {
      const prev = JSON.parse(await readFile(path, "utf-8"));
      if (
        prev?.llms &&
        (prev.llms.keyFacts?.length ||
          prev.llms.summary ||
          prev.llms.pitch ||
          prev.llms.lastReviewed)
      ) {
        return prev.llms;
      }
    } catch {
      // ignore unreadable/partial files
    }
  }
  return undefined;
}

/* --- Main --- */

async function main() {
  const pageCopy = await readJson("pages.json");

  const pageContent = {
    home: buildHome(pageCopy),
    whyq: buildWhyq(pageCopy),
    program: buildProgram(pageCopy),
    ticketCategories: buildTicketCategories(pageCopy),
    contact: buildContact(pageCopy),
    hackathon: buildHackathon(pageCopy),
    ...buildSimplePages(),
  };

  const siteSettings = buildSiteSettings(pageCopy);
  // Preserve curated LLM identity from the checked-in web content snapshot
  // (or an existing mirror file) so regenerating from Webflow does not wipe it.
  siteSettings.llms = await loadPreservedLlms();

  await writeJson("page-content.json", pageContent);
  await writeJson("site-settings.json", siteSettings);

  const speakers = await patchSpeakerRoleLines();

  console.log(
    `[build-page-content] wrote page-content.json, site-settings.json, patched roleLine for ${speakers.length} speakers.`,
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exitCode = 1;
});
