/**
 * Per-page Payload globals mapped onto PageContent.
 *
 * Payload has no primitive string[]/boolean[] field; array-of-primitive JSON
 * fields were seeded as named-subfield rows: fromTextRows / fromValueRows undo that.
 */
import { normalizeHrefsDeep } from "./hrefs";
import { fetchGlobal, memoizeCms } from "./cms";
import { resolveWhyqImageBase, type CmsMediaRef } from "./media";
import {
  fromTextRows,
  toPageLink,
  type CmsPageLink,
  type PageLink,
} from "./site-settings";
import { CONTENT_SOURCE, readJson } from "./source";

export interface PageStat {
  value: string;
  label: string;
  /** Partner names shown in the logo sliders (index page only). */
  logos?: string[];
}

export interface AgendaItem {
  date: string;
  title: string;
  description: string;
}

export interface TicketTier {
  name: string;
  price: string;
  features: string[];
  note?: string;
  buyLabel: string;
  buyHref: string;
}

export interface PricingComparisonTier {
  name: string;
  price: string;
  audience: string;
}

export interface PricingComparisonGroup {
  group: string;
  rows: { feature: string; included: boolean[] }[];
}

export interface PricingComparison {
  tiers: PricingComparisonTier[];
  groups: PricingComparisonGroup[];
}

export interface TicketCategoryDetail {
  label: string;
  bullets: string[];
}

export interface BoardMember {
  name: string;
  role: string;
  email: string;
  linkLabel: string;
}

export interface ContactItem {
  label: string;
  email?: string;
  details: string[];
}

export interface PartnerGroup {
  group: string;
  partners: {
    name: string;
    href: string;
    logoFile: string;
    note: string | null;
  }[];
}

export interface FeatureCard {
  title: string;
  description: string;
}

export interface WhyCard {
  title: string;
  description: string;
}

export interface HomeContent {
  title: string;
  metaDescription: string;
  hero: {
    headline: string;
    tagline: string;
    announcementLines: string[];
    cta: PageLink;
  };
  /**
   * Machine-readable conference dates for the homepage Event JSON-LD.
   * Kept separate from `hero.announcementLines`, which is display copy an
   * editor rewrites freely: deriving the dates by regex from that copy meant a
   * routine rephrasing ("April 30 - May 1, 2027", an en dash, a deleted line)
   * threw at build time and blocked every subsequent deploy of the whole site.
   * ISO yyyy-mm-dd, date-only: no time or timezone exists in the content.
   */
  event: {
    startDate: string;
    endDate: string;
  };
  stats: {
    heading: string;
    intro: string;
    items: PageStat[];
  };
  partnerBand: {
    items: PageStat[];
    cta: PageLink;
  };
  previousSpeakers: {
    heading: string;
    intro: string;
    cta: PageLink;
  };
  whyAttend: {
    heading: string;
    intro: string;
    cards: WhyCard[];
    cta: PageLink;
  };
  faqSection: {
    heading: string;
    intro: string;
    cta: PageLink;
  };
}

export interface WhyqAudienceItem {
  title: string;
  description: string;
}

export interface WhyqAudience {
  id: string;
  heading: string;
  intro: string;
  items: WhyqAudienceItem[];
  /** Base filename under /media, e.g. "whyq-attendees" (component derives
   * the -500/-800/-1080 srcset from this). */
  imageFile: string;
  imageAlt: string;
  imageLeft: boolean;
}

export interface WhyqContent {
  title: string;
  metaDescription: string;
  heading: string;
  intro: string;
  audiences: WhyqAudience[];
}

export interface ProgramContent {
  title: string;
  metaDescription: string;
  agenda: {
    heading: string;
    intro: string;
    items: AgendaItem[];
  };
  faqSection: {
    heading: string;
    intro: string;
  };
  closingCta: {
    heading: string;
    text: string;
  };
}

export interface TicketCategoriesContent {
  title: string;
  metaDescription: string;
  tiers: {
    heading: string;
    intro: string;
    items: TicketTier[];
  };
  comparison: {
    heading: string;
    intro: string;
    tiers: PricingComparisonTier[];
    groups: PricingComparisonGroup[];
    academicNote: string;
  };
  categories: {
    heading: string;
    items: TicketCategoryDetail[];
  };
}

export interface ContactContent {
  title: string;
  metaDescription: string;
  board: {
    heading: string;
    paragraphs: string[];
    members: BoardMember[];
  };
  reachOut: {
    heading: string;
    paragraphs: string[];
    items: ContactItem[];
  };
}

export interface HackathonContent {
  title: string;
  metaDescription: string;
  hero: {
    headline: string;
    tagline: string;
    cta: PageLink;
  };
  partners: {
    heading: string;
    groups: PartnerGroup[];
  };
  benefits: {
    heading: string;
    cards: FeatureCard[];
  };
  schedule: {
    heading: string;
    intro: string;
    items: AgendaItem[];
  };
  faqSection: {
    heading: string;
    intro: string;
  };
  closingCta: {
    heading: string;
    text: string;
    mailtoLabel: string;
    mailtoEmail: string;
  };
}

export interface OurTeamContent {
  title: string;
  metaDescription: string;
  heading: string;
}

export interface PastTeamsContent {
  title: string;
  metaDescription: string;
  heading: string;
  intro: string;
}

export interface PartnerPageContent {
  title: string;
  metaDescription: string;
  heading: string;
  cta: {
    heading: string;
    text: string;
    buttonLabel: string;
    buttonHref: string;
  };
}

export interface SpeakerPanel {
  title: string;
  description: string;
  /** Key into the page-local icon lookup, not a media path (asset
   * management stays code-side; see speaker.astro). */
  iconKey: string;
}

export interface SpeakerPageContent {
  title: string;
  metaDescription: string;
  heading: string;
  intro: string;
  panels: SpeakerPanel[];
}

export interface JobsPageContent {
  title: string;
  metaDescription: string;
  heading: string;
  intro: string;
  detailHowToContactHeading: string;
}

export interface PageContent {
  home: HomeContent;
  whyq: WhyqContent;
  program: ProgramContent;
  ticketCategories: TicketCategoriesContent;
  contact: ContactContent;
  hackathon: HackathonContent;
  ourTeam: OurTeamContent;
  pastTeams: PastTeamsContent;
  partner: PartnerPageContent;
  speaker: SpeakerPageContent;
  jobs: JobsPageContent;
}

/**
 * Payload date fields come back as full ISO timestamps ("2027-04-01T00:00:00.000Z").
 * The Event JSON-LD wants a plain calendar day, and the content genuinely has
 * no time or timezone, so emitting one would be inventing precision.
 */
function toIsoDay(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) {
    throw new Error(
      "[content:cms] page-home is missing event.startDate / event.endDate. " +
        "Set the conference dates on the Home page global (they drive the Event structured data).",
    );
  }
  return raw.slice(0, 10);
}

function fromValueRows(
  rows: { value?: boolean | null }[] | null | undefined,
): boolean[] {
  return (rows ?? []).map((row) => Boolean(row.value));
}

interface CmsPageStat {
  value: string;
  label: string;
  logos?: { text: string }[] | null;
}

const toPageStat = (stat: CmsPageStat): PageStat => ({
  value: stat.value,
  label: stat.label,
  logos: fromTextRows(stat.logos),
});

const toAgendaItem = (item: AgendaItem): AgendaItem => ({
  date: item.date,
  title: item.title,
  description: item.description,
});

const toBoardMember = (member: BoardMember): BoardMember => ({
  name: member.name,
  role: member.role,
  email: member.email,
  linkLabel: member.linkLabel,
});

interface CmsPageHomeDoc {
  title: string;
  metaDescription?: string | null;
  hero: {
    headline: string;
    tagline: string;
    announcementLines?: { text: string }[] | null;
    cta: CmsPageLink;
  };
  event?: { startDate?: string | null; endDate?: string | null } | null;
  stats: {
    heading: string;
    intro: string;
    items?: CmsPageStat[] | null;
  };
  partnerBand: {
    items?: CmsPageStat[] | null;
    cta: CmsPageLink;
  };
  previousSpeakers: {
    heading: string;
    intro: string;
    cta: CmsPageLink;
  };
  whyAttend: {
    heading: string;
    intro: string;
    cards: WhyCard[];
    cta: CmsPageLink;
  };
  faqSection: {
    heading: string;
    intro: string;
    cta: CmsPageLink;
  };
}

async function cmsGetHome(): Promise<HomeContent> {
  const doc = await fetchGlobal<CmsPageHomeDoc>("page-home");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    hero: {
      headline: doc.hero.headline,
      tagline: doc.hero.tagline,
      announcementLines: fromTextRows(doc.hero.announcementLines),
      cta: toPageLink(doc.hero.cta),
    },
    event: {
      startDate: toIsoDay(doc.event?.startDate),
      endDate: toIsoDay(doc.event?.endDate),
    },
    stats: {
      heading: doc.stats.heading,
      intro: doc.stats.intro,
      items: (doc.stats.items ?? []).map(toPageStat),
    },
    partnerBand: {
      items: (doc.partnerBand.items ?? []).map(toPageStat),
      cta: toPageLink(doc.partnerBand.cta),
    },
    previousSpeakers: {
      heading: doc.previousSpeakers.heading,
      intro: doc.previousSpeakers.intro,
      cta: toPageLink(doc.previousSpeakers.cta),
    },
    whyAttend: {
      heading: doc.whyAttend.heading,
      intro: doc.whyAttend.intro,
      cards: doc.whyAttend.cards.map((c) => ({
        title: c.title,
        description: c.description,
      })),
      cta: toPageLink(doc.whyAttend.cta),
    },
    faqSection: {
      heading: doc.faqSection.heading,
      intro: doc.faqSection.intro,
      cta: toPageLink(doc.faqSection.cta),
    },
  };
}

interface CmsWhyqAudienceDoc {
  /** CMS field renamed from "id" to "anchorId" (see apps/cms PageWhyq); maps
   * onto the web model's stable "id" (JSON mode keeps "id" unchanged). */
  anchorId: string;
  heading: string;
  intro: string;
  items?: WhyqAudienceItem[] | null;
  imageFile: CmsMediaRef | number | string | null;
  imageAlt: string;
  imageLeft?: boolean | null;
}

interface CmsWhyqDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
  intro: string;
  audiences: CmsWhyqAudienceDoc[];
}

async function cmsGetWhyq(): Promise<WhyqContent> {
  const doc = await fetchGlobal<CmsWhyqDoc>("page-whyq");
  const audiences: WhyqAudience[] = [];
  for (const audience of doc.audiences) {
    audiences.push({
      id: audience.anchorId,
      heading: audience.heading,
      intro: audience.intro,
      items: (audience.items ?? []).map((i) => ({
        title: i.title,
        description: i.description,
      })),
      // Empty upload (fixture seed without local media) falls back to the
      // conventional basename so /whyq still points at /media/whyq-<anchor>
      // until MinIO/R2 or a Media upload supplies the file.
      imageFile:
        (await resolveWhyqImageBase(
          audience.imageFile,
          `whyq audience ${audience.anchorId}`,
        )) || `whyq-${audience.anchorId}`,
      imageAlt: audience.imageAlt,
      imageLeft: Boolean(audience.imageLeft),
    });
  }
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    heading: doc.heading,
    intro: doc.intro,
    audiences,
  };
}

interface CmsProgramDoc {
  title: string;
  metaDescription?: string | null;
  agenda: {
    heading: string;
    intro: string;
    items: AgendaItem[];
  };
  faqSection: { heading: string; intro: string };
  closingCta: { heading: string; text: string };
}

async function cmsGetProgram(): Promise<ProgramContent> {
  const doc = await fetchGlobal<CmsProgramDoc>("page-program");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    agenda: {
      heading: doc.agenda.heading,
      intro: doc.agenda.intro,
      items: doc.agenda.items.map(toAgendaItem),
    },
    faqSection: doc.faqSection,
    closingCta: doc.closingCta,
  };
}

interface CmsTicketsDoc {
  title: string;
  metaDescription?: string | null;
  tiers: {
    heading: string;
    intro: string;
    items: {
      name: string;
      price: string;
      features?: { text: string }[] | null;
      note?: string | null;
      buyLabel: string;
      buyHref: string;
    }[];
  };
  comparison: {
    heading: string;
    intro: string;
    tiers: { name: string; price: string; audience: string }[];
    groups: {
      group: string;
      rows: {
        feature: string;
        included?: { value?: boolean | null }[] | null;
      }[];
    }[];
    academicNote: string;
  };
  categories: {
    heading: string;
    items: { label: string; bullets?: { text: string }[] | null }[];
  };
}

async function cmsGetTicketCategories(): Promise<TicketCategoriesContent> {
  const doc = await fetchGlobal<CmsTicketsDoc>("page-tickets");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    tiers: {
      heading: doc.tiers.heading,
      intro: doc.tiers.intro,
      items: doc.tiers.items.map((item) => ({
        name: item.name,
        price: item.price,
        features: fromTextRows(item.features),
        note: item.note ?? undefined,
        buyLabel: item.buyLabel,
        buyHref: item.buyHref,
      })),
    },
    comparison: {
      heading: doc.comparison.heading,
      intro: doc.comparison.intro,
      tiers: doc.comparison.tiers.map((t) => ({
        name: t.name,
        price: t.price,
        audience: t.audience,
      })),
      groups: doc.comparison.groups.map((group) => ({
        group: group.group,
        rows: group.rows.map((row) => ({
          feature: row.feature,
          included: fromValueRows(row.included),
        })),
      })),
      academicNote: doc.comparison.academicNote,
    },
    categories: {
      heading: doc.categories.heading,
      items: doc.categories.items.map((item) => ({
        label: item.label,
        bullets: fromTextRows(item.bullets),
      })),
    },
  };
}

interface CmsContactDoc {
  title: string;
  metaDescription?: string | null;
  board: {
    heading: string;
    paragraphs?: { text: string }[] | null;
    members: BoardMember[];
  };
  reachOut: {
    heading: string;
    paragraphs?: { text: string }[] | null;
    items: {
      label: string;
      email?: string | null;
      details?: { text: string }[] | null;
    }[];
  };
}

async function cmsGetContact(): Promise<ContactContent> {
  const doc = await fetchGlobal<CmsContactDoc>("page-contact");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    board: {
      heading: doc.board.heading,
      paragraphs: fromTextRows(doc.board.paragraphs),
      members: doc.board.members.map(toBoardMember),
    },
    reachOut: {
      heading: doc.reachOut.heading,
      paragraphs: fromTextRows(doc.reachOut.paragraphs),
      items: doc.reachOut.items.map((item) => ({
        label: item.label,
        email: item.email ?? undefined,
        details: fromTextRows(item.details),
      })),
    },
  };
}

interface CmsHackathonDoc {
  title: string;
  metaDescription?: string | null;
  hero: {
    headline: string;
    tagline: string;
    cta: CmsPageLink;
  };
  partners: {
    heading: string;
    groups: {
      group: string;
      partners: {
        name: string;
        href: string;
        logoFile: string;
        note?: string | null;
      }[];
    }[];
  };
  benefits: {
    heading: string;
    cards: FeatureCard[];
  };
  schedule: {
    heading: string;
    intro: string;
    items: AgendaItem[];
  };
  faqSection: { heading: string; intro: string };
  closingCta: {
    heading: string;
    text: string;
    mailtoLabel: string;
    mailtoEmail: string;
  };
}

async function cmsGetHackathon(): Promise<HackathonContent> {
  const doc = await fetchGlobal<CmsHackathonDoc>("page-hackathon");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    hero: {
      headline: doc.hero.headline,
      tagline: doc.hero.tagline,
      cta: toPageLink(doc.hero.cta),
    },
    partners: {
      heading: doc.partners.heading,
      groups: doc.partners.groups.map((group) => ({
        group: group.group,
        partners: group.partners.map((p) => ({
          name: p.name,
          href: p.href,
          logoFile: p.logoFile,
          note: p.note ?? null,
        })),
      })),
    },
    benefits: {
      heading: doc.benefits.heading,
      cards: doc.benefits.cards.map((c) => ({
        title: c.title,
        description: c.description,
      })),
    },
    schedule: {
      heading: doc.schedule.heading,
      intro: doc.schedule.intro,
      items: doc.schedule.items.map(toAgendaItem),
    },
    faqSection: doc.faqSection,
    closingCta: doc.closingCta,
  };
}

interface CmsOurTeamDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
}

async function cmsGetOurTeam(): Promise<OurTeamContent> {
  const doc = await fetchGlobal<CmsOurTeamDoc>("page-our-team");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    heading: doc.heading,
  };
}

interface CmsPastTeamsDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
  intro: string;
}

async function cmsGetPastTeams(): Promise<PastTeamsContent> {
  const doc = await fetchGlobal<CmsPastTeamsDoc>("page-past-teams");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    heading: doc.heading,
    intro: doc.intro,
  };
}

interface CmsPartnerPageDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
  cta: {
    heading: string;
    text: string;
    buttonLabel: string;
    buttonHref: string;
  };
}

async function cmsGetPartnerPage(): Promise<PartnerPageContent> {
  const doc = await fetchGlobal<CmsPartnerPageDoc>("page-partner");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    heading: doc.heading,
    cta: doc.cta,
  };
}

interface CmsSpeakerPageDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
  intro: string;
  panels: SpeakerPanel[];
}

async function cmsGetSpeakerPage(): Promise<SpeakerPageContent> {
  const doc = await fetchGlobal<CmsSpeakerPageDoc>("page-speaker");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    heading: doc.heading,
    intro: doc.intro,
    panels: doc.panels.map((p) => ({
      title: p.title,
      description: p.description,
      iconKey: p.iconKey,
    })),
  };
}

interface CmsJobsPageDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
  intro: string;
  detailHowToContactHeading: string;
}

async function cmsGetJobsPage(): Promise<JobsPageContent> {
  const doc = await fetchGlobal<CmsJobsPageDoc>("page-jobs");
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    heading: doc.heading,
    intro: doc.intro,
    detailHowToContactHeading: doc.detailHowToContactHeading,
  };
}

async function cmsGetPageContent(): Promise<PageContent> {
  const [
    home,
    whyq,
    program,
    ticketCategories,
    contact,
    hackathon,
    ourTeam,
    pastTeams,
    partner,
    speaker,
    jobs,
  ] = await Promise.all([
    cmsGetHome(),
    cmsGetWhyq(),
    cmsGetProgram(),
    cmsGetTicketCategories(),
    cmsGetContact(),
    cmsGetHackathon(),
    cmsGetOurTeam(),
    cmsGetPastTeams(),
    cmsGetPartnerPage(),
    cmsGetSpeakerPage(),
    cmsGetJobsPage(),
  ]);
  return {
    home,
    whyq,
    program,
    ticketCategories,
    contact,
    hackathon,
    ourTeam,
    pastTeams,
    partner,
    speaker,
    jobs,
  };
}

// PageTickets.ts documents comparison.groups[].rows[].included as "one row
// per comparison tier, in the same order as comparison.tiers above", but
// nothing in Payload's schema enforces that the array lengths actually
// match. A CMS editor adding/removing a tier without touching every existing
// row would otherwise misalign the table silently (columns render under the
// wrong tier headers, no error anywhere). Fail the build loudly instead.
function assertTicketComparisonAligned(
  ticketCategories: TicketCategoriesContent,
): void {
  const tierCount = ticketCategories.comparison.tiers.length;
  for (const group of ticketCategories.comparison.groups) {
    for (const row of group.rows) {
      if (row.included.length !== tierCount) {
        throw new Error(
          `[content] ticketCategories.comparison: row "${row.feature}" in group "${group.group}" has ${row.included.length} included ${
            row.included.length === 1 ? "entry" : "entries"
          }, but comparison.tiers has ${tierCount}. Each row's included[] must have exactly one entry per tier, in the same order.`,
        );
      }
    }
  }
}

export async function getPageContent(): Promise<PageContent> {
  const content =
    CONTENT_SOURCE === "cms"
      ? memoizeCms("page-content", cmsGetPageContent)
      : readJson<PageContent>("page-content.json");
  const resolved = normalizeHrefsDeep(await content);
  assertTicketComparisonAligned(resolved.ticketCategories);
  assertEventDates(resolved.home?.event);
  return resolved;
}

/**
 * Both content sources must supply the homepage Event dates.
 *
 * CMS mode already fails in toIsoDay, but the JSON path had no guard at all:
 * a maintainer snapshot taken before the field existed reached
 * pages/index.astro and died on `home.event.startDate.slice(...)` with a bare
 * TypeError naming neither the field nor the file. That snapshot is exactly
 * what the CMS-outage fallback commits, so the unhelpful failure would land
 * mid-incident.
 */
function assertEventDates(
  event: PageContent["home"]["event"] | undefined,
): void {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  for (const key of ["startDate", "endDate"] as const) {
    const value = event?.[key];
    if (typeof value !== "string" || !iso.test(value)) {
      throw new Error(
        `[content] page-content home.event.${key} is missing or not an ISO date (yyyy-mm-dd); got ${JSON.stringify(value)}. ` +
          "It drives the homepage Event structured data. In CMS mode set the conference dates on the Home page global; " +
          "in JSON mode add home.event to the snapshot.",
      );
    }
  }
}
