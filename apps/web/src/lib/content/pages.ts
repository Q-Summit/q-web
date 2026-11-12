/**
 * Per-page Payload globals mapped onto PageContent.
 *
 * Payload has no primitive string[] field; array-of-primitive JSON fields
 * were seeded as named-subfield rows: fromTextRows undoes that.
 */
import { normalizeHrefsDeep } from "./hrefs";
import { fetchGlobal, fetchGlobalOptional, memoizeCms } from "./cms";
import {
  resolveOptionalUploadFilename,
  resolveWhyqImageBase,
  type CmsMediaRef,
} from "./media";
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
  /** Short line under the label (home partner rows), e.g. "Founders & scale-ups". */
  description?: string;
  /** Partner names shown in the logo sliders (index page only). */
  logos?: string[];
}

export interface AgendaItem {
  date: string;
  title: string;
  description: string;
}

/**
 * Ticket category registry. Mirrors TICKET_KEYS in
 * apps/cms/src/globals/PageTickets.ts 1:1: the key ties one ticket's card,
 * its "What's included" panel and its compare column together, and every
 * benefit row names the tickets it applies to by key.
 */
export const TICKET_KEYS = [
  "student",
  "young-professional",
  "start-up",
  "investor",
  "corporate",
] as const;
export type TicketKey = (typeof TICKET_KEYS)[number];

export interface TicketOffer {
  key: TicketKey;
  name: string;
  description: string;
  /** Whole euros, struck through on the card. */
  regularPrice: number;
  /** Whole euros, the current (Early Bird) price. */
  price: number;
  highlights: string[];
  /** Requirement shown on the card, e.g. "Valid student ID required". */
  note?: string;
}

export interface TicketBenefitRow {
  label: string;
  /** Tickets that include this benefit (or, for eligibility, require it). */
  tickets: TicketKey[];
}

export interface TicketBenefitGroup {
  heading: string;
  /** eligibility rows read Required / Not required and are not benefits. */
  kind: "benefit" | "eligibility";
  rows: TicketBenefitRow[];
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
  /** Small label above the title, e.g. "For founders". */
  eyebrow?: string;
  /** Where the tile leads (an audience page). Without it the tile is not a link. */
  href?: string;
  /** e.g. "Learn more". */
  linkLabel?: string;
  /** Media filename of the tile photo, e.g. "whyq-startups-800.webp". */
  imageFile?: string;
  imageAlt?: string;
}

/**
 * The home countdown to the first conference day. Only wording lives here:
 * the target is `event.startDate` at 00:00 Europe/Berlin (the start of the
 * day, not a doors or program time), so there is one date to maintain.
 */
export interface HomeCountdown {
  /** Accessible name, e.g. "Countdown to Q-Summit 2027". */
  label: string;
  daysLabel: string;
  hoursLabel: string;
  minutesLabel: string;
  secondsLabel: string;
  /** Read out instead of the digits. Contains {days}, {hours}, {minutes}. */
  spokenLabel: string;
  /** Shown once the first conference day has begun. */
  liveLabel: string;
}

/** A social post shown in the home social section. */
export interface HomeSocialPost {
  platform: "linkedin" | "instagram";
  href: string;
  /** Media filename of the post image. */
  imageFile: string;
  imageAlt: string;
}

export interface HomeSocial {
  eyebrow: string;
  heading: string;
  intro: string;
  /** Button labels; the links are the site's LinkedIn and Instagram profiles. */
  linkedinLabel: string;
  instagramLabel: string;
  /**
   * Posts from oldest to newest: a new post is added at the end. The page
   * shows the newest four, newest first (lib/social-posts.ts); empty
   * frames hold the layout until posts exist.
   */
  posts: HomeSocialPost[];
}

/** Next edition's lineup on the home page, fed by published speakers. */
export interface HomeLineup {
  /** Badge on each card, e.g. "2027". */
  label: string;
  /** Edition whose published "current" speakers fill the slots. */
  year: number;
  /** How many cards the row holds. */
  slots: number;
  /**
   * Fill open slots with marked placeholders. For local review only: with
   * false, open slots are simply not rendered.
   */
  showPlaceholders: boolean;
  placeholderName: string;
  placeholderRole: string;
}

export interface HomeContent {
  title: string;
  metaDescription: string;
  hero: {
    headline: string;
    tagline: string;
    announcementLines: string[];
    cta: PageLink;
    /** Pill above the headline, e.g. the anniversary, dates and city. */
    badge?: string;
    /** Short lines under the headline; shown instead of announcementLines. */
    leadLines?: string[];
  };
  /** Wording of the countdown; without it no countdown is shown. */
  countdown?: HomeCountdown;
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
    eyebrow?: string;
    /** e.g. "Partners of Q-Summit 2026": always names the edition shown. */
    heading?: string;
    items: PageStat[];
    cta: PageLink;
  };
  previousSpeakers: {
    eyebrow?: string;
    heading: string;
    intro: string;
    cta: PageLink;
    /**
     * Badge on past speakers, e.g. "Past Speaker". The name is historical:
     * they are not Q alumni (those are former team members).
     */
    alumniLabel?: string;
    /** Names of past speakers to show, in order; default: the panel group. */
    highlights?: string[];
    lineup?: HomeLineup;
    /**
     * Names of earlier speakers shown in the lineup's place while the
     * lineup's edition has no published speaker yet, in this order. They
     * are never presented as booked: their cards carry standInLabel, not
     * the lineup label.
     */
    standIns?: string[];
    /** Badge on a stand-in card, e.g. "Q-Summit 2026". */
    standInLabel?: string;
  };
  whyAttend: {
    eyebrow?: string;
    heading: string;
    intro: string;
    cards: WhyCard[];
    cta: PageLink;
  };
  /** LinkedIn and Instagram section; without it the section is not shown. */
  social?: HomeSocial;
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

/**
 * One discount phase of the ticket sale (Early Bird, Christmas, ...), as
 * the shop runs them one after another. The website only shows them; it
 * never switches prices or phases on a date.
 */
export interface TicketPhase {
  /** Stable id, e.g. "early-bird". */
  key: string;
  /** Shown name, e.g. "Early Bird". */
  label: string;
  /** Whole-number discount in percent off the regular price, e.g. 30. */
  discount: number;
}

/**
 * The discount phases above the ticket hero heading: one source for the
 * phases and which one is on sale now. activeKey is set by hand (the shop
 * moves to the next phase when one sells out, not on a date), so the page
 * never guesses. Phases before the active one read as over, those after it
 * as coming.
 */
export interface TicketPhases {
  /** Accessible name of the timeline, e.g. "Discount phases". */
  label: string;
  items: TicketPhase[];
  /** key of the phase on sale now. */
  activeKey: string;
  /** e.g. "On sale now". */
  currentLabel: string;
  /** e.g. "Coming soon". */
  upcomingLabel: string;
  /** e.g. "Sold out". */
  pastLabel: string;
  /** Contains {discount}, e.g. "{discount}% off". */
  discountLabel: string;
}

export interface TicketCategoriesContent {
  title: string;
  metaDescription: string;
  hero: {
    /** The one-line offer badge; the phase timeline replaces it when set. */
    eyebrow: string;
    heading: string;
    intro: string;
    compareLabel: string;
  };
  /** Discount phase timeline in the hero (optional). */
  phases?: TicketPhases;
  offer: {
    /** The one shop link every buy button on the page uses. */
    purchaseHref: string;
    buyLabel: string;
    detailsLabel: string;
    saveLabel: string;
    tickets: TicketOffer[];
    footnote: string;
  };
  included: {
    heading: string;
    intro: string;
    /** Contains {ticket}. */
    ticketBuyLabel: string;
    /** Contains {included} and {total}. No longer shown (the benefit
     * count was removed from the summaries); kept for the CMS field. */
    countLabel: string;
    includedLabel: string;
    notIncludedLabel: string;
    requiredLabel: string;
    notRequiredLabel: string;
    groups: TicketBenefitGroup[];
  };
  compare: {
    heading: string;
    intro: string;
    firstLabel: string;
    secondLabel: string;
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

export type KickoffSocialIcon =
  "linkedin" | "instagram" | "tiktok" | "whatsapp";

export interface KickoffSpeakerCrop {
  x: number;
  y: number;
  zoom: number;
  shiftY: number;
}

export interface KickoffSpeaker {
  name: string;
  role: string;
  bio: string;
  linkedin: string;
  image: string; // "/media/filename" or ""
  imageAlt: string;
  crop: KickoffSpeakerCrop;
}

export interface KickoffQuizAnswer {
  id: string;
  text: string;
  tags: string[];
}

export interface KickoffQuizQuestion {
  kicker: string;
  question: string;
  answers: KickoffQuizAnswer[];
}

export interface KickoffQuizResult {
  team: string;
  text: string;
  notionHref: string;
}

export interface KickoffContent {
  title: string;
  metaDescription: string;
  hero: {
    eyebrow: string;
    headline: string;
    copy: string;
    image: string;
    imageAlt: string;
    primaryCta: PageLink;
    secondaryCta: PageLink;
  };
  kickoff: {
    eyebrow: string;
    heading: string;
    intro: string;
    date: string;
    location: string;
    locationHref: string;
    panelTitle: string;
    ui: {
      speakerLabel: string;
      linkedinLabel: string;
      kickoffLabel: string;
      panelLabel: string;
      registerLabel: string;
      registerHref: string;
    };
    company: { name: string; href: string; logo: string; logoAlt: string };
    speakers: KickoffSpeaker[];
  };
  socials: {
    eyebrow: string;
    heading: string;
    links: { label: string; href: string; icon: KickoffSocialIcon }[];
  };
  quiz: {
    eyebrow: string;
    heading: string;
    intro: string;
    ui: {
      questionLabel: string;
      ofLabel: string;
      backLabel: string;
      nextLabel: string;
      showResultLabel: string;
      placeLabel: string;
      teamLinkLabel: string;
    };
    start: {
      eyebrow: string;
      heading: string;
      copy: string;
      buttonLabel: string;
    };
    questions: KickoffQuizQuestion[];
    results: KickoffQuizResult[];
    resultCopy: {
      eyebrow: string;
      heading: string;
      copy: string;
      restartLabel: string;
      applicationCta: PageLink;
      allTeamsCta: PageLink;
    };
  };
  journey: {
    eyebrow: string;
    heading: string;
    intro: string;
    hint: string;
    moments: { title: string; text: string; image: string; imageAlt: string }[];
  };
  application: {
    eyebrow: string;
    heading: string;
    intro: string;
    isOpen: boolean;
    applicationUrl: string;
    comingSoonLabel: string;
    steps: { date: string; title: string; text: string }[];
  };
  finalCta: {
    eyebrow: string;
    heading: string;
    copy: string;
    cta: PageLink;
  };
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
  kickoff: KickoffContent;
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

interface CmsPageStat {
  /** Optional on partner rows, which no longer show a figure. */
  value?: string | null;
  label: string;
  description?: string | null;
  logos?: { text: string }[] | null;
}

const toPageStat = (stat: CmsPageStat): PageStat => ({
  value: stat.value ?? "",
  label: stat.label,
  ...(stat.description?.trim() ? { description: stat.description } : {}),
  logos: fromTextRows(stat.logos),
});

/** Drop null / empty optional strings so the web model keeps them undefined. */
const optionalText = (value: string | null | undefined): string | undefined =>
  value?.trim() ? value : undefined;

// Hackathon rows may have no description in the CMS (null); the program
// agenda always has one.
const toAgendaItem = (item: AgendaItem): AgendaItem => ({
  date: item.date,
  title: item.title,
  description: item.description ?? "",
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
    badge?: string | null;
    leadLines?: { text: string }[] | null;
  };
  countdown?: { [K in keyof HomeCountdown]?: string | null } | null;
  event?: { startDate?: string | null; endDate?: string | null } | null;
  stats: {
    heading: string;
    intro: string;
    items?: CmsPageStat[] | null;
  };
  partnerBand: {
    eyebrow?: string | null;
    heading?: string | null;
    items?: CmsPageStat[] | null;
    cta: CmsPageLink;
  };
  previousSpeakers: {
    eyebrow?: string | null;
    heading: string;
    intro: string;
    cta: CmsPageLink;
    alumniLabel?: string | null;
    highlights?: { text: string }[] | null;
    lineup?: {
      label?: string | null;
      year?: number | null;
      slots?: number | null;
      showPlaceholders?: boolean | null;
      placeholderName?: string | null;
      placeholderRole?: string | null;
    } | null;
    standIns?: { text: string }[] | null;
    standInLabel?: string | null;
  };
  whyAttend: {
    eyebrow?: string | null;
    heading: string;
    intro: string;
    cards: {
      title: string;
      description: string;
      eyebrow?: string | null;
      href?: string | null;
      linkLabel?: string | null;
      image?: CmsMediaRef | number | string | null;
      imageAlt?: string | null;
    }[];
    cta: CmsPageLink;
  };
  social?: {
    eyebrow?: string | null;
    heading?: string | null;
    intro?: string | null;
    linkedinLabel?: string | null;
    instagramLabel?: string | null;
    posts?:
      | {
          platform: "linkedin" | "instagram";
          href: string;
          image?: CmsMediaRef | number | string | null;
          imageAlt?: string | null;
        }[]
      | null;
  } | null;
  faqSection: {
    heading: string;
    intro: string;
    cta: CmsPageLink;
  };
}

/** The countdown shows only once every label is filled in. */
function toHomeCountdown(
  doc: CmsPageHomeDoc["countdown"],
): HomeCountdown | undefined {
  const keys = [
    "label",
    "daysLabel",
    "hoursLabel",
    "minutesLabel",
    "secondsLabel",
    "spokenLabel",
    "liveLabel",
  ] as const;
  if (!doc || keys.some((key) => !doc[key]?.trim())) return undefined;
  return Object.fromEntries(
    keys.map((key) => [key, doc[key]]),
  ) as unknown as HomeCountdown;
}

async function cmsGetHome(): Promise<HomeContent> {
  const doc = await fetchGlobal<CmsPageHomeDoc>("page-home");

  const cards: WhyCard[] = [];
  for (const c of doc.whyAttend.cards) {
    const imageFile = await resolveOptionalUploadFilename(
      c.image,
      `home audience ${c.title}`,
    );
    cards.push({
      title: c.title,
      description: c.description,
      ...(optionalText(c.eyebrow) ? { eyebrow: c.eyebrow! } : {}),
      ...(optionalText(c.href) ? { href: c.href! } : {}),
      ...(optionalText(c.linkLabel) ? { linkLabel: c.linkLabel! } : {}),
      ...(imageFile ? { imageFile, imageAlt: c.imageAlt ?? "" } : {}),
    });
  }

  const posts: HomeSocialPost[] = [];
  for (const post of doc.social?.posts ?? []) {
    const imageFile = await resolveOptionalUploadFilename(
      post.image,
      `home social post ${post.href}`,
    );
    if (!imageFile) continue;
    posts.push({
      platform: post.platform,
      href: post.href,
      imageFile,
      imageAlt: post.imageAlt ?? "",
    });
  }
  const social = doc.social;
  const lineup = doc.previousSpeakers.lineup;
  const highlights = fromTextRows(doc.previousSpeakers.highlights);
  const standIns = fromTextRows(doc.previousSpeakers.standIns);
  const leadLines = fromTextRows(doc.hero.leadLines);

  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    hero: {
      headline: doc.hero.headline,
      tagline: doc.hero.tagline,
      announcementLines: fromTextRows(doc.hero.announcementLines),
      cta: toPageLink(doc.hero.cta),
      ...(optionalText(doc.hero.badge) ? { badge: doc.hero.badge! } : {}),
      ...(leadLines.length ? { leadLines } : {}),
    },
    ...(toHomeCountdown(doc.countdown)
      ? { countdown: toHomeCountdown(doc.countdown) }
      : {}),
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
      eyebrow: optionalText(doc.partnerBand.eyebrow),
      heading: optionalText(doc.partnerBand.heading),
      items: (doc.partnerBand.items ?? []).map(toPageStat),
      cta: toPageLink(doc.partnerBand.cta),
    },
    previousSpeakers: {
      eyebrow: optionalText(doc.previousSpeakers.eyebrow),
      heading: doc.previousSpeakers.heading,
      intro: doc.previousSpeakers.intro,
      cta: toPageLink(doc.previousSpeakers.cta),
      alumniLabel: optionalText(doc.previousSpeakers.alumniLabel),
      ...(highlights.length ? { highlights } : {}),
      ...(standIns.length ? { standIns } : {}),
      standInLabel: optionalText(doc.previousSpeakers.standInLabel),
      // The lineup row needs its label and edition; the rest has defaults.
      ...(lineup?.label?.trim() && lineup.year
        ? {
            lineup: {
              label: lineup.label,
              year: lineup.year,
              slots: lineup.slots ?? 4,
              showPlaceholders: Boolean(lineup.showPlaceholders),
              placeholderName: lineup.placeholderName ?? "",
              placeholderRole: lineup.placeholderRole ?? "",
            },
          }
        : {}),
    },
    whyAttend: {
      eyebrow: optionalText(doc.whyAttend.eyebrow),
      heading: doc.whyAttend.heading,
      intro: doc.whyAttend.intro,
      cards,
      cta: toPageLink(doc.whyAttend.cta),
    },
    ...(social?.heading?.trim()
      ? {
          social: {
            eyebrow: social.eyebrow ?? "",
            heading: social.heading,
            intro: social.intro ?? "",
            linkedinLabel: social.linkedinLabel ?? "",
            instagramLabel: social.instagramLabel ?? "",
            posts,
          },
        }
      : {}),
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
  hero: TicketCategoriesContent["hero"];
  /** Optional group; the timeline shows once it has items. */
  phases?: {
    label?: string | null;
    items?: { key: string; label: string; discount: number }[] | null;
    activeKey?: string | null;
    currentLabel?: string | null;
    upcomingLabel?: string | null;
    pastLabel?: string | null;
    discountLabel?: string | null;
  } | null;
  offer: {
    purchaseHref: string;
    buyLabel: string;
    detailsLabel: string;
    saveLabel: string;
    footnote: string;
    tickets?:
      | {
          key: TicketKey;
          name: string;
          description: string;
          regularPrice: number;
          price: number;
          highlights?: { text: string }[] | null;
          note?: string | null;
        }[]
      | null;
  };
  included: Omit<TicketCategoriesContent["included"], "groups"> & {
    groups?:
      | {
          heading: string;
          kind: "benefit" | "eligibility";
          rows: CmsTicketRow[];
        }[]
      | null;
  };
  compare: TicketCategoriesContent["compare"];
}

// Payload stores each benefit row as one checkbox per ticket (apps/cms
// PageTickets.ts TICKET_ROW_FIELDS); the site works with the ticket keys.
const TICKET_ROW_FIELDS = {
  student: "student",
  "young-professional": "youngProfessional",
  "start-up": "startUp",
  investor: "investor",
  corporate: "corporate",
} as const satisfies Record<TicketKey, string>;

type CmsTicketRow = { label: string } & {
  [F in (typeof TICKET_ROW_FIELDS)[TicketKey]]?: boolean | null;
};

function ticketsOfRow(row: CmsTicketRow): TicketKey[] {
  return (Object.keys(TICKET_ROW_FIELDS) as TicketKey[]).filter(
    (key) => row[TICKET_ROW_FIELDS[key]] === true,
  );
}

async function cmsGetTicketCategories(): Promise<TicketCategoriesContent> {
  const doc = await fetchGlobal<CmsTicketsDoc>("page-tickets");
  // The 2026 groups (tiers / comparison / categories) stay in Payload as an
  // archive and are deliberately not read here. assertTicketPage() fails the
  // build if the 2027 groups have not been published yet.
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    hero: doc.hero,
    offer: doc.offer && {
      purchaseHref: doc.offer.purchaseHref,
      buyLabel: doc.offer.buyLabel,
      detailsLabel: doc.offer.detailsLabel,
      saveLabel: doc.offer.saveLabel,
      footnote: doc.offer.footnote,
      tickets: (doc.offer.tickets ?? []).map((t) => ({
        key: t.key,
        name: t.name,
        description: t.description,
        regularPrice: t.regularPrice,
        price: t.price,
        highlights: fromTextRows(t.highlights),
        ...(t.note ? { note: t.note } : {}),
      })),
    },
    included: doc.included && {
      heading: doc.included.heading,
      intro: doc.included.intro,
      ticketBuyLabel: doc.included.ticketBuyLabel,
      countLabel: doc.included.countLabel,
      includedLabel: doc.included.includedLabel,
      notIncludedLabel: doc.included.notIncludedLabel,
      requiredLabel: doc.included.requiredLabel,
      notRequiredLabel: doc.included.notRequiredLabel,
      groups: (doc.included.groups ?? []).map((g) => ({
        heading: g.heading,
        kind: g.kind,
        rows: g.rows.map((r) => ({ label: r.label, tickets: ticketsOfRow(r) })),
      })),
    },
    compare: doc.compare,
    ...(doc.phases?.items?.length
      ? {
          // assertTicketPage() names any label left empty.
          phases: {
            label: doc.phases.label ?? "",
            items: doc.phases.items.map((p) => ({
              key: p.key,
              label: p.label,
              discount: p.discount,
            })),
            activeKey: doc.phases.activeKey ?? "",
            currentLabel: doc.phases.currentLabel ?? "",
            upcomingLabel: doc.phases.upcomingLabel ?? "",
            pastLabel: doc.phases.pastLabel ?? "",
            discountLabel: doc.phases.discountLabel ?? "",
          },
        }
      : {}),
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

interface CmsKickoffDoc {
  title: string;
  metaDescription?: string | null;
  hero: {
    eyebrow: string;
    headline: string;
    copy: string;
    image?: CmsMediaRef | number | string | null;
    imageAlt?: string | null;
    primaryCta: CmsPageLink;
    secondaryCta: CmsPageLink;
  };
  kickoff: {
    eyebrow: string;
    heading: string;
    intro: string;
    date: string;
    location: string;
    locationHref?: string | null;
    panelTitle: string;
    ui: {
      speakerLabel: string;
      linkedinLabel: string;
      kickoffLabel: string;
      panelLabel: string;
      registerLabel?: string | null;
      registerHref?: string | null;
    };
    company: {
      name: string;
      href?: string | null;
      logo?: CmsMediaRef | number | string | null;
      logoAlt?: string | null;
    };
    speakers?:
      | {
          name: string;
          role?: string | null;
          bio?: string | null;
          linkedin?: string | null;
          image?: CmsMediaRef | number | string | null;
          imageAlt?: string | null;
          crop?: {
            x?: number | null;
            y?: number | null;
            zoom?: number | null;
            shiftY?: number | null;
          } | null;
        }[]
      | null;
  };
  socials: {
    eyebrow: string;
    heading: string;
    links?:
      | {
          label: string;
          href?: string | null;
          icon: KickoffSocialIcon;
        }[]
      | null;
  };
  quiz: {
    eyebrow: string;
    heading: string;
    intro: string;
    ui: {
      questionLabel: string;
      ofLabel: string;
      backLabel: string;
      nextLabel: string;
      showResultLabel: string;
      placeLabel: string;
      teamLinkLabel: string;
    };
    start: {
      eyebrow: string;
      heading: string;
      copy: string;
      buttonLabel: string;
    };
    questions?:
      | {
          kicker: string;
          question: string;
          answers?:
            | {
                answerId: string;
                text: string;
                tags?: { text: string }[] | null;
              }[]
            | null;
        }[]
      | null;
    results?:
      | {
          team: string;
          text: string;
          notionHref?: string | null;
        }[]
      | null;
    resultCopy: {
      eyebrow: string;
      heading: string;
      copy: string;
      restartLabel: string;
      applicationCta: CmsPageLink;
      allTeamsCta: CmsPageLink;
    };
  };
  journey: {
    eyebrow: string;
    heading: string;
    intro: string;
    hint: string;
    moments?:
      | {
          title: string;
          text: string;
          image?: CmsMediaRef | number | string | null;
          imageAlt?: string | null;
        }[]
      | null;
  };
  application: {
    eyebrow: string;
    heading: string;
    intro: string;
    isOpen?: boolean | null;
    applicationUrl?: string | null;
    comingSoonLabel?: string | null;
    steps?: { date: string; title: string; text: string }[] | null;
  };
  finalCta: {
    eyebrow: string;
    heading: string;
    copy: string;
    cta: CmsPageLink;
  };
}

const mediaHref = (filename: string): string =>
  filename ? `/media/${filename.replace(/^\/+/, "")}` : "";

function emptyPageLink(): PageLink {
  return { label: "", href: "" };
}

function clampNumber(
  value: number | null | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function clampKickoffCrop(
  crop?: {
    x?: number | null;
    y?: number | null;
    zoom?: number | null;
    shiftY?: number | null;
  } | null,
): KickoffSpeakerCrop {
  return {
    x: clampNumber(crop?.x, 0, 100, 50),
    y: clampNumber(crop?.y, 0, 100, 24),
    zoom: clampNumber(crop?.zoom, 100, 160, 100),
    shiftY: clampNumber(crop?.shiftY, -40, 40, 0),
  };
}

function normalizeKickoff(content: KickoffContent): KickoffContent {
  return {
    ...content,
    kickoff: {
      ...content.kickoff,
      locationHref: content.kickoff.locationHref ?? "",
      ui: {
        ...content.kickoff.ui,
        registerLabel: content.kickoff.ui.registerLabel ?? "",
        registerHref: content.kickoff.ui.registerHref ?? "",
      },
      speakers: (content.kickoff.speakers ?? []).map((speaker) => ({
        ...speaker,
        crop: clampKickoffCrop(speaker.crop),
      })),
    },
  };
}

function emptyKickoff(): KickoffContent {
  return {
    title: "",
    metaDescription: "",
    hero: {
      eyebrow: "",
      headline: "",
      copy: "",
      image: "",
      imageAlt: "",
      primaryCta: emptyPageLink(),
      secondaryCta: emptyPageLink(),
    },
    kickoff: {
      eyebrow: "",
      heading: "",
      intro: "",
      date: "",
      location: "",
      locationHref: "",
      panelTitle: "",
      ui: {
        speakerLabel: "",
        linkedinLabel: "",
        kickoffLabel: "",
        panelLabel: "",
        registerLabel: "",
        registerHref: "",
      },
      company: { name: "", href: "", logo: "", logoAlt: "" },
      speakers: [],
    },
    socials: { eyebrow: "", heading: "", links: [] },
    quiz: {
      eyebrow: "",
      heading: "",
      intro: "",
      ui: {
        questionLabel: "",
        ofLabel: "",
        backLabel: "",
        nextLabel: "",
        showResultLabel: "",
        placeLabel: "",
        teamLinkLabel: "",
      },
      start: { eyebrow: "", heading: "", copy: "", buttonLabel: "" },
      questions: [],
      results: [],
      resultCopy: {
        eyebrow: "",
        heading: "",
        copy: "",
        restartLabel: "",
        applicationCta: emptyPageLink(),
        allTeamsCta: emptyPageLink(),
      },
    },
    journey: { eyebrow: "", heading: "", intro: "", hint: "", moments: [] },
    application: {
      eyebrow: "",
      heading: "",
      intro: "",
      isOpen: false,
      applicationUrl: "",
      comingSoonLabel: "Coming Soon",
      steps: [],
    },
    finalCta: {
      eyebrow: "",
      heading: "",
      copy: "",
      cta: emptyPageLink(),
    },
  };
}

async function cmsGetKickoff(): Promise<KickoffContent> {
  const doc = await fetchGlobalOptional<CmsKickoffDoc>("page-kickoff");
  if (
    !doc?.hero ||
    !doc.kickoff ||
    !doc.quiz ||
    !doc.journey ||
    !doc.application ||
    !doc.finalCta
  ) {
    console.warn(
      "[content:cms] page-kickoff is empty or missing; seed it with pnpm seed:kickoff (local JSON) or edit the Join Q / Kickoff global.",
    );
    return emptyKickoff();
  }

  const heroImage = await resolveOptionalUploadFilename(
    doc.hero.image,
    "Join Q hero image",
  );
  const companyLogo = await resolveOptionalUploadFilename(
    doc.kickoff.company.logo,
    "Join Q kickoff company logo",
  );

  const speakers: KickoffSpeaker[] = [];
  for (const speaker of doc.kickoff.speakers ?? []) {
    const image = await resolveOptionalUploadFilename(
      speaker.image,
      `Join Q kickoff speaker ${speaker.name}`,
    );
    speakers.push({
      name: speaker.name,
      role: speaker.role ?? "",
      bio: speaker.bio ?? "",
      linkedin: speaker.linkedin ?? "",
      image: mediaHref(image),
      imageAlt: speaker.imageAlt ?? "",
      crop: clampKickoffCrop(speaker.crop),
    });
  }

  const moments: KickoffContent["journey"]["moments"] = [];
  for (const moment of doc.journey.moments ?? []) {
    const image = await resolveOptionalUploadFilename(
      moment.image,
      `Join Q journey ${moment.title}`,
    );
    moments.push({
      title: moment.title,
      text: moment.text,
      image: mediaHref(image),
      imageAlt: moment.imageAlt ?? "",
    });
  }

  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    hero: {
      eyebrow: doc.hero.eyebrow,
      headline: doc.hero.headline,
      copy: doc.hero.copy,
      image: mediaHref(heroImage),
      imageAlt: doc.hero.imageAlt ?? "",
      primaryCta: toPageLink(doc.hero.primaryCta),
      secondaryCta: toPageLink(doc.hero.secondaryCta),
    },
    kickoff: {
      eyebrow: doc.kickoff.eyebrow,
      heading: doc.kickoff.heading,
      intro: doc.kickoff.intro,
      date: doc.kickoff.date,
      location: doc.kickoff.location,
      locationHref: doc.kickoff.locationHref ?? "",
      panelTitle: doc.kickoff.panelTitle,
      ui: {
        speakerLabel: doc.kickoff.ui.speakerLabel,
        linkedinLabel: doc.kickoff.ui.linkedinLabel,
        kickoffLabel: doc.kickoff.ui.kickoffLabel,
        panelLabel: doc.kickoff.ui.panelLabel,
        registerLabel: doc.kickoff.ui.registerLabel ?? "",
        registerHref: doc.kickoff.ui.registerHref ?? "",
      },
      company: {
        name: doc.kickoff.company.name,
        href: doc.kickoff.company.href ?? "",
        logo: mediaHref(companyLogo),
        logoAlt: doc.kickoff.company.logoAlt ?? "",
      },
      speakers,
    },
    socials: {
      eyebrow: doc.socials.eyebrow,
      heading: doc.socials.heading,
      links: (doc.socials.links ?? []).map((link) => ({
        label: link.label,
        icon: link.icon,
        href: link.href ?? "",
      })),
    },
    quiz: {
      eyebrow: doc.quiz.eyebrow,
      heading: doc.quiz.heading,
      intro: doc.quiz.intro,
      ui: {
        questionLabel: doc.quiz.ui.questionLabel,
        ofLabel: doc.quiz.ui.ofLabel,
        backLabel: doc.quiz.ui.backLabel,
        nextLabel: doc.quiz.ui.nextLabel,
        showResultLabel: doc.quiz.ui.showResultLabel,
        placeLabel: doc.quiz.ui.placeLabel,
        teamLinkLabel: doc.quiz.ui.teamLinkLabel,
      },
      start: doc.quiz.start,
      questions: (doc.quiz.questions ?? []).map((question) => ({
        kicker: question.kicker,
        question: question.question,
        answers: (question.answers ?? []).map((answer) => ({
          id: answer.answerId,
          text: answer.text,
          tags: fromTextRows(answer.tags),
        })),
      })),
      results: (doc.quiz.results ?? []).map((result) => ({
        team: result.team,
        text: result.text,
        notionHref: result.notionHref ?? "",
      })),
      resultCopy: {
        eyebrow: doc.quiz.resultCopy.eyebrow,
        heading: doc.quiz.resultCopy.heading,
        copy: doc.quiz.resultCopy.copy,
        restartLabel: doc.quiz.resultCopy.restartLabel,
        applicationCta: toPageLink(doc.quiz.resultCopy.applicationCta),
        allTeamsCta: toPageLink(doc.quiz.resultCopy.allTeamsCta),
      },
    },
    journey: {
      eyebrow: doc.journey.eyebrow,
      heading: doc.journey.heading,
      intro: doc.journey.intro,
      hint: doc.journey.hint,
      moments,
    },
    application: {
      eyebrow: doc.application.eyebrow,
      heading: doc.application.heading,
      intro: doc.application.intro,
      isOpen: Boolean(doc.application.isOpen),
      applicationUrl: doc.application.applicationUrl ?? "",
      comingSoonLabel: doc.application.comingSoonLabel?.trim() || "Coming Soon",
      steps: doc.application.steps ?? [],
    },
    finalCta: {
      eyebrow: doc.finalCta.eyebrow,
      heading: doc.finalCta.heading,
      copy: doc.finalCta.copy,
      cta: toPageLink(doc.finalCta.cta),
    },
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
    kickoff,
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
    cmsGetKickoff(),
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
    kickoff,
  };
}

/**
 * The ticket page draws its cards, the "What's included" panels and the
 * compare view from one model, so a slip in it would show three different
 * answers. Payload validates most of this on save, but the JSON path, and a
 * doc published before the 2027 groups existed (they are then empty), reach
 * the build unchecked. Fail the build loudly, naming the field, instead of
 * shipping an empty or contradictory ticket page.
 */
export function assertTicketPage(t: TicketCategoriesContent): void {
  const fail = (msg: string): never => {
    throw new Error(`[content] ticketCategories: ${msg}`);
  };
  if (
    !t.hero?.heading ||
    !t.offer?.purchaseHref ||
    !t.included?.heading ||
    !t.compare?.heading
  ) {
    fail(
      "the 2027 ticket fields (hero, offer, included, compare) are empty. Publish the Tickets page in the CMS with them filled before building.",
    );
  }
  const keys = new Set<string>();
  for (const ticket of t.offer.tickets) {
    if (!(TICKET_KEYS as readonly string[]).includes(ticket.key)) {
      fail(`ticket "${ticket.name}" has unknown key "${ticket.key}".`);
    }
    if (keys.has(ticket.key)) {
      fail(`ticket key "${ticket.key}" is used twice.`);
    }
    keys.add(ticket.key);
    if (
      !Number.isFinite(ticket.price) ||
      !Number.isFinite(ticket.regularPrice)
    ) {
      fail(`ticket "${ticket.name}" needs a numeric price and regularPrice.`);
    }
  }
  if (keys.size < 2) fail("the compare view needs at least two tickets.");
  for (const group of t.included.groups) {
    for (const row of group.rows) {
      for (const key of row.tickets) {
        if (!keys.has(key)) {
          fail(
            `"${row.label}" in "${group.heading}" names ticket "${key}", which is not on the page.`,
          );
        }
      }
    }
  }
  if (!t.included.ticketBuyLabel.includes("{ticket}")) {
    fail('included.ticketBuyLabel must contain "{ticket}".');
  }
  if (t.phases) {
    const p = t.phases;
    if (!p.items?.length) fail("phases has no items.");
    const phaseKeys = new Set<string>();
    for (const item of p.items) {
      if (!item.key || !item.label)
        fail("every phase needs a key and a label.");
      if (phaseKeys.has(item.key))
        fail(`phase key "${item.key}" is used twice.`);
      phaseKeys.add(item.key);
      if (
        !Number.isInteger(item.discount) ||
        item.discount < 1 ||
        item.discount > 99
      ) {
        fail(
          `phase "${item.label}" needs a whole-number discount from 1 to 99.`,
        );
      }
    }
    if (!phaseKeys.has(p.activeKey)) {
      fail(`phases.activeKey "${p.activeKey}" is not one of the phases.`);
    }
    if (!p.discountLabel?.includes("{discount}")) {
      fail('phases.discountLabel must contain "{discount}".');
    }
    for (const field of [
      "label",
      "currentLabel",
      "upcomingLabel",
      "pastLabel",
    ] as const) {
      if (!p[field]?.trim()) fail(`phases.${field} is empty.`);
    }
  }
}

export async function getPageContent(): Promise<PageContent> {
  const content =
    CONTENT_SOURCE === "cms"
      ? memoizeCms("page-content", cmsGetPageContent)
      : readJson<PageContent>("page-content.json");
  const resolved = normalizeHrefsDeep(await content);
  resolved.kickoff = normalizeKickoff(resolved.kickoff);
  assertTicketPage(resolved.ticketCategories);
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
