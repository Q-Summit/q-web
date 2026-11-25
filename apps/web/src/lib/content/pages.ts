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
  uploadDimensions,
  type CmsMediaRef,
} from "./media";
import {
  fromTextRows,
  toPageLink,
  type CmsPageLink,
  type PageLink,
} from "./site-settings";
import { CONTENT_SOURCE, readJson } from "./source";
import {
  PARTNER_AUDIENCE_KEYS,
  type PartnerAudienceKey,
} from "../partner-audiences";

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
     * Badge on past speakers, e.g. "Previous Speaker". The name is historical:
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
  /**
   * The aftermovie block (the film itself is the site's stream on R2);
   * without it the block is not shown.
   */
  aftermovie?: {
    /** e.g. "Aftermovie Q-Summit 2026". */
    eyebrow: string;
    /** e.g. "Feel the energy." */
    heading: string;
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
  /** The line on the pill under every audience hero. */
  eventLine?: string;
  /** The four pages under /whyq/ (pages/whyq/[audience].astro); a page
   * without an entry is not built. */
  pages?: WhyqAudiencePage[];
}

/** Slug of an audience page: it lives at /whyq/<slug>/. */
export type WhyqAudienceSlug =
  "students" | "startups" | "corporates" | "investors";

/** A photo on an audience page: a /media filename and its alt text. */
export interface WhyqPhoto {
  file: string;
  alt: string;
  width?: number;
  height?: number;
}

/** One logo of a highlight's logo wall; without a file the name shows. */
export interface WhyqLogoEntry {
  name: string;
  href?: string;
  file?: string;
  width?: number;
  height?: number;
}

export interface WhyqAudiencePage {
  audience: WhyqAudienceSlug;
  /** Breadcrumb label, e.g. "For Startups". */
  crumb: string;
  metaDescription: string;
  hero: { heading: string; intro: string; ctaLabel: string };
  stats: { value: string; label: string }[];
  activities: {
    heading: string;
    intro?: string;
    items: {
      title: string;
      text: string;
      kind: "included" | "apply";
      image?: WhyqPhoto;
    }[];
  };
  highlight: {
    layout: "cards" | "winner" | "logos" | "qube";
    eyebrow: string;
    heading: string;
    intro?: string;
    cards?: {
      kicker: string;
      title: string;
      text: string;
      image?: WhyqPhoto;
    }[];
    winnerLabel?: string;
    winnerName?: string;
    winnerLine?: string;
    image?: WhyqPhoto;
    moments?: { alt: string; image?: WhyqPhoto }[];
    logosEyebrow?: string;
    logosHeading?: string;
    logos?: WhyqLogoEntry[];
  };
  ticket: {
    heading: string;
    intro?: string;
    keys: TicketKey[];
    side?: { title: string; text: string; status: string }[];
    includesHeading?: string;
    includes?: string[];
    partnerPanel?: {
      eyebrow: string;
      heading: string;
      text: string;
      perks: string[];
      linkLabel: string;
      href: string;
    };
  };
  /** Answers may hold `{price:<key>}` / `{regular:<key>}` tokens. */
  faq: { heading: string; items: { question: string; answer: string }[] };
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
  /**
   * Optional end of the phase (ISO date-time). While the phase is on sale
   * the homepage shows the date and counts down to it; nothing switches
   * when it is reached.
   */
  endsAt?: string;
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
  /**
   * key of the current phase: on sale now, or, with onSale false, the
   * one opening next.
   */
  activeKey: string;
  /**
   * False between two phases: the earlier ones are over and the current
   * one is not open yet, so it is announced, not sold. Absent means true.
   */
  onSale?: boolean;
  /** e.g. "On sale now". */
  currentLabel: string;
  /** Tag of the current phase while onSale is false, e.g. "Next up". */
  nextLabel?: string;
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

/** A hackathon schedule row: an agenda item with an optional day and mark. */
export interface HackathonAgendaItem extends AgendaItem {
  /** Starts a new day: shown as a heading above this row. Empty when unset. */
  day: string;
  /** Hack clock mark such as "T+00:00". Empty when unset. */
  mark: string;
}

/** One photo of the hackathon impressions (a Media upload in the CMS). */
export interface HackathonPhoto {
  /** "/media/<filename>". */
  src: string;
  alt: string;
  caption: string;
  /** Intrinsic size in pixels; 0 when the content source carries none. */
  width: number;
  height: number;
}

/**
 * The hackathon page. The groups from `event` down were added for Q-Hack
 * 2027 and are optional in the CMS: a document published before they existed
 * (or an older JSON snapshot) maps to the safe empties noted on each field,
 * so every one of them is always present here.
 */
export interface HackathonContent {
  title: string;
  metaDescription: string;
  hero: {
    headline: string;
    tagline: string;
    /** The apply link: every apply button opens it while applications are open. */
    cta: PageLink;
  };
  partners: {
    heading: string;
    groups: PartnerGroup[];
  };
  /** 2026 archive: stored, no longer shown on the 2027 page. */
  benefits: {
    heading: string;
    cards: FeatureCard[];
  };
  schedule: {
    heading: string;
    intro: string;
    items: HackathonAgendaItem[];
  };
  faqSection: {
    heading: string;
    intro: string;
  };
  /** 2026 archive: stored, no longer shown on the 2027 page. */
  closingCta: {
    heading: string;
    text: string;
    mailtoLabel: string;
    mailtoEmail: string;
  };
  /** When and where the hack runs; drives the countdown and every date. */
  event: {
    /** ISO date-time, or "" when unset. */
    startsAt: string;
    /** ISO date-time, or "" when unset. */
    endsAt: string;
    /** e.g. "University of Mannheim". Empty when unset. */
    location: string;
  };
  application: {
    /**
     * Open: apply buttons lead to `hero.cta`. Closed (the default): they
     * open a "not open yet" window instead of a link.
     */
    isOpen: boolean;
    /** Status line while closed. Falls back to "Applications open soon". */
    comingSoonLabel: string;
  };
  /** The laptop scroll sequence. */
  machine: {
    /** Up to three short lines beside the laptop. */
    lines: string[];
    hint: string;
    /** The line typed on the laptop screen under the logo. */
    screenLine: string;
  };
  /** Wording only: the film is the site's own stream, not an upload. */
  aftermovie: {
    heading: string;
    /** The film's title line, e.g. "Q-Summit Hackathon 2026". */
    caption: string;
  };
  impressions: {
    heading: string;
    intro: string;
    photos: HackathonPhoto[];
  };
  /** `title` is the fact's short label, `description` its value. */
  facts: FeatureCard[];
  /** The section that invites companies to become a hackathon partner. */
  partnerPitch: {
    heading: string;
    lede: string;
    points: FeatureCard[];
    ctaLabel: string;
    /** A URL, a mailto: address or an internal path. Empty: no button. */
    ctaHref: string;
    contactEmail: string;
  };
}

/** The team hero photo from the CMS: its /media filename and size. */
export interface TeamHeroPhoto {
  file: string;
  width?: number;
  height?: number;
}

export interface OurTeamContent {
  title: string;
  metaDescription: string;
  heading: string;
  /** Shared by /our-team and /past-teams; unset keeps the built-in photo. */
  heroImage?: TeamHeroPhoto;
  /** The "Current Team" side of the team switch. */
  tabLabel?: string;
  /** Heading above each division, with {division} for its name. */
  divisionHeading?: string;
}

export interface PastTeamsContent {
  title: string;
  metaDescription: string;
  heading: string;
  intro: string;
  /** The "History" side of the team switch. */
  tabLabel?: string;
  /** Heading above each year's team photo, with {year}. */
  yearHeading?: string;
  /** Alt text of each year's team photo, with {year}. */
  photoAlt?: string;
  /**
   * Copy of the scroll story. Set only when every field is filled; unset,
   * the page falls back to `intro` plus one photo per year.
   */
  story?: PastTeamsStory;
}

/** The /past-teams/ scroll story copy (page-past-teams `story` group). */
export interface PastTeamsStory {
  heroEyebrow: string;
  heroHeading: string;
  heroLead: string;
  /** The button that glides through the first part of the story. */
  cueLabel: string;
  originEyebrow: string;
  originHeading: string;
  originSub: string;
  originText: string;
  teamsEyebrow: string;
  teamsHeading: string;
  teamsText: string;
  albumEyebrow: string;
  albumHeading: string;
  /** The hint under the camera on a computer. */
  albumHint: string;
  /** The same hint on a phone. */
  albumHintTouch: string;
  /** The button under the camera that scrolls back to the start. */
  backLabel: string;
  closingEyebrow: string;
  closingHeading: string;
  closingText: string;
  /** Label of the button to /our-team/ (the link is fixed in code). */
  closingButtonLabel: string;
}

export type { PartnerAudienceKey };

export interface PartnerContact {
  name: string;
  role: string;
  email: string;
  /** Media filename; unset when the CMS has no portrait yet (initials show). */
  photoFilename?: string;
}

/** The person behind Become a Partner; the card shows once name and email
 * are filled. */
export interface PartnerCtaContact {
  name: string;
  role: string;
  email: string;
  /** Hint of the copy-address icon; empty hides the icon. */
  copyLabel: string;
  copiedLabel: string;
  /** Media filename; unset when the CMS has no portrait yet (initials show). */
  photoFilename?: string;
}

export interface PartnerAudience {
  /** Title of the expandable field on /partner/. */
  label: string;
  summary: string;
  linkLabel: string;
  heading: string;
  intro: string;
  benefitsHeading: string;
  benefits: { title: string; description: string }[];
  contactsHeading: string;
  contactLabel: string;
  contacts: PartnerContact[];
}

export interface PartnerPageContent {
  title: string;
  metaDescription: string;
  projector: {
    /** Small label above the heading and at the top of every slide. */
    eyebrow: string;
    heading: string;
    intro: string;
    hint: string;
    /** Word after the tier name in each slide heading ("Partner" → "Gold
     * Partner"); empty shows the tier name alone. Optional so a JSON
     * snapshot from before the field still builds. */
    tierSuffix?: string;
    /** Label of the pop-up's website button; empty shows the site's host. */
    websiteLabel?: string;
  };
  /** Heading of the partner photos and quotes section. */
  heading: string;
  /** Line under that heading saying a quote opens from the quote mark;
   * empty or missing shows none. */
  quotesHint?: string;
  /** The Become a Partner section: texts, the contact person and the main
   * button to the partner form. points and contact are optional so a JSON
   * snapshot from before these fields still builds. */
  cta: {
    heading: string;
    text: string;
    /** What a partner gets, one short line each. */
    points?: string[];
    buttonLabel: string;
    buttonHref: string;
    contact?: PartnerCtaContact;
  };
  audiences: Record<PartnerAudienceKey, PartnerAudience>;
}

export interface SpeakerPanel {
  title: string;
  description: string;
  /** Key into the page-local icon lookup, not a media path (asset
   * management stays code-side; see speaker.astro). */
  iconKey: string;
}

/** Texts above the hot topics card; each falls back to the page's own
 * wording when empty (speaker.astro). */
export interface SpeakerHotTopicsCopy {
  label?: string;
  heading?: string;
  intro?: string;
}

export interface SpeakerPageContent {
  title: string;
  metaDescription: string;
  heading: string;
  intro: string;
  /** Stored, no longer rendered on /speaker (kept for the CMS rows). */
  panels: SpeakerPanel[];
  hotTopics?: SpeakerHotTopicsCopy;
  /** The pill under the stage, e.g. "Line-up 2027 · Coming soon". */
  lineupPill?: string;
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
  aftermovie?: {
    eyebrow?: string | null;
    heading?: string | null;
  } | null;
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
  const aftermovie = doc.aftermovie;
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
    ...(aftermovie?.heading?.trim()
      ? {
          aftermovie: {
            eyebrow: aftermovie.eyebrow ?? "",
            heading: aftermovie.heading,
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

type CmsUpload = CmsMediaRef | number | string | null | undefined;
type CmsText = string | null | undefined;

interface CmsWhyqPhotoDoc {
  image?: CmsUpload;
  imageAlt?: CmsText;
}

interface CmsWhyqPageDoc {
  audience: WhyqAudienceSlug;
  crumb: string;
  metaDescription: string;
  hero: { heading: string; intro: string; ctaLabel: string };
  stats?: { value: string; label: string }[] | null;
  activities: {
    heading: string;
    intro?: CmsText;
    items?:
      | ({
          title: string;
          text: string;
          kind: "included" | "apply";
        } & CmsWhyqPhotoDoc)[]
      | null;
  };
  highlight: {
    layout: WhyqAudiencePage["highlight"]["layout"];
    eyebrow: string;
    heading: string;
    intro?: CmsText;
    cards?:
      | ({ kicker: string; title: string; text: string } & CmsWhyqPhotoDoc)[]
      | null;
    winnerLabel?: CmsText;
    winnerName?: CmsText;
    winnerLine?: CmsText;
    image?: CmsUpload;
    imageAlt?: CmsText;
    moments?: CmsWhyqPhotoDoc[] | null;
    logosEyebrow?: CmsText;
    logosHeading?: CmsText;
    logos?: { name: string; websiteUrl?: CmsText; logo?: CmsUpload }[] | null;
  };
  ticket: {
    heading: string;
    intro?: CmsText;
    keys: TicketKey[];
    side?: { title: string; text: string; status: string }[] | null;
    includesHeading?: CmsText;
    includes?: { text: string }[] | null;
    partnerPanel?: {
      eyebrow?: CmsText;
      heading?: CmsText;
      text?: CmsText;
      perks?: { text: string }[] | null;
      linkLabel?: CmsText;
      href?: CmsText;
    } | null;
  };
  faq: {
    heading: string;
    items?: { question: string; answer: string }[] | null;
  };
}

interface CmsWhyqDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
  intro: string;
  audiences: CmsWhyqAudienceDoc[];
  eventLine?: CmsText;
  pages?: CmsWhyqPageDoc[] | null;
}

/** An optional photo: its /media filename, alt and size, when it is set. */
async function cmsWhyqPhoto(
  image: CmsUpload,
  alt: CmsText,
  label: string,
): Promise<WhyqPhoto | undefined> {
  const file = await resolveOptionalUploadFilename(image, label);
  if (!file) return undefined;
  return { file, alt: alt ?? "", ...uploadDimensions(image) };
}

async function cmsGetWhyqPage(page: CmsWhyqPageDoc): Promise<WhyqAudiencePage> {
  const at = (part: string) => `whyq ${page.audience} ${part}`;
  const { highlight: hl, ticket } = page;
  const panel = ticket.partnerPanel;
  return {
    audience: page.audience,
    crumb: page.crumb,
    metaDescription: page.metaDescription,
    hero: page.hero,
    stats: (page.stats ?? []).map(({ value, label }) => ({ value, label })),
    activities: {
      heading: page.activities.heading,
      ...(optionalText(page.activities.intro)
        ? { intro: page.activities.intro! }
        : {}),
      items: await Promise.all(
        (page.activities.items ?? []).map(async (item) => {
          const image = await cmsWhyqPhoto(
            item.image,
            item.imageAlt,
            at(`activity ${item.title}`),
          );
          return {
            title: item.title,
            text: item.text,
            kind: item.kind,
            ...(image ? { image } : {}),
          };
        }),
      ),
    },
    highlight: {
      layout: hl.layout,
      eyebrow: hl.eyebrow,
      heading: hl.heading,
      ...(optionalText(hl.intro) ? { intro: hl.intro! } : {}),
      cards: await Promise.all(
        (hl.cards ?? []).map(async (card) => {
          const image = await cmsWhyqPhoto(
            card.image,
            card.imageAlt,
            at(`card ${card.title}`),
          );
          return {
            kicker: card.kicker,
            title: card.title,
            text: card.text,
            ...(image ? { image } : {}),
          };
        }),
      ),
      ...(optionalText(hl.winnerLabel) ? { winnerLabel: hl.winnerLabel! } : {}),
      ...(optionalText(hl.winnerName) ? { winnerName: hl.winnerName! } : {}),
      ...(optionalText(hl.winnerLine) ? { winnerLine: hl.winnerLine! } : {}),
      image: await cmsWhyqPhoto(hl.image, hl.imageAlt, at("highlight photo")),
      moments: await Promise.all(
        (hl.moments ?? []).map(async (moment, i) => {
          const image = await cmsWhyqPhoto(
            moment.image,
            moment.imageAlt,
            at(`moment ${i + 1}`),
          );
          return { alt: moment.imageAlt ?? "", ...(image ? { image } : {}) };
        }),
      ),
      ...(optionalText(hl.logosEyebrow)
        ? { logosEyebrow: hl.logosEyebrow! }
        : {}),
      ...(optionalText(hl.logosHeading)
        ? { logosHeading: hl.logosHeading! }
        : {}),
      logos: await Promise.all(
        (hl.logos ?? []).map(async (logo) => {
          const file = await resolveOptionalUploadFilename(
            logo.logo,
            at(`logo ${logo.name}`),
          );
          return {
            name: logo.name,
            ...(optionalText(logo.websiteUrl)
              ? { href: logo.websiteUrl! }
              : {}),
            ...(file ? { file, ...uploadDimensions(logo.logo) } : {}),
          };
        }),
      ),
    },
    ticket: {
      heading: ticket.heading,
      ...(optionalText(ticket.intro) ? { intro: ticket.intro! } : {}),
      keys: ticket.keys ?? [],
      side: (ticket.side ?? []).map(({ title, text, status }) => ({
        title,
        text,
        status,
      })),
      ...(optionalText(ticket.includesHeading)
        ? { includesHeading: ticket.includesHeading! }
        : {}),
      includes: (ticket.includes ?? []).map((row) => row.text),
      ...(panel && optionalText(panel.heading)
        ? {
            partnerPanel: {
              eyebrow: panel.eyebrow ?? "",
              heading: panel.heading!,
              text: panel.text ?? "",
              perks: (panel.perks ?? []).map((row) => row.text),
              linkLabel: panel.linkLabel ?? "",
              href: panel.href ?? "",
            },
          }
        : {}),
    },
    faq: {
      heading: page.faq.heading,
      items: (page.faq.items ?? []).map(({ question, answer }) => ({
        question,
        answer,
      })),
    },
  };
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
    ...(optionalText(doc.eventLine) ? { eventLine: doc.eventLine! } : {}),
    pages: await Promise.all((doc.pages ?? []).map(cmsGetWhyqPage)),
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
    items?:
      | {
          key: string;
          label: string;
          discount: number;
          endsAt?: string | null;
        }[]
      | null;
    activeKey?: string | null;
    onSale?: boolean | null;
    currentLabel?: string | null;
    nextLabel?: string | null;
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
              ...(p.endsAt ? { endsAt: p.endsAt } : {}),
            })),
            activeKey: doc.phases.activeKey ?? "",
            onSale: doc.phases.onSale !== false,
            currentLabel: doc.phases.currentLabel ?? "",
            ...(doc.phases.nextLabel?.trim()
              ? { nextLabel: doc.phases.nextLabel.trim() }
              : {}),
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
    items: (AgendaItem & { day?: string | null; mark?: string | null })[];
  };
  faqSection: { heading: string; intro: string };
  closingCta: {
    heading: string;
    text: string;
    mailtoLabel: string;
    mailtoEmail: string;
  };
  // Everything below was added for Q-Hack 2027 and is optional in Payload.
  // Until the migration has run and the page has been published again, the
  // CMS answers without these groups (or with null), so every one of them
  // may be missing here.
  event?: {
    startsAt?: string | null;
    endsAt?: string | null;
    location?: string | null;
  } | null;
  application?: {
    isOpen?: boolean | null;
    comingSoonLabel?: string | null;
  } | null;
  machine?: {
    lines?: { text: string }[] | null;
    hint?: string | null;
    screenLine?: string | null;
  } | null;
  aftermovie?: {
    heading?: string | null;
    caption?: string | null;
  } | null;
  impressions?: {
    heading?: string | null;
    intro?: string | null;
    photos?:
      | {
          image?: CmsMediaRef | number | string | null;
          alt?: string | null;
          caption?: string | null;
        }[]
      | null;
  } | null;
  facts?: FeatureCard[] | null;
  partnerPitch?: {
    heading?: string | null;
    lede?: string | null;
    points?: FeatureCard[] | null;
    ctaLabel?: string | null;
    ctaHref?: string | null;
    contactEmail?: string | null;
  } | null;
}

/** Shown while applications are closed and no status line is set. */
const HACKATHON_COMING_SOON = "Applications open soon";

const toFeatureCards = (
  cards: FeatureCard[] | null | undefined,
): FeatureCard[] =>
  (cards ?? []).map((card) => ({
    title: card.title,
    description: card.description ?? "",
  }));

async function cmsGetHackathon(): Promise<HackathonContent> {
  const doc = await fetchGlobal<CmsHackathonDoc>("page-hackathon");

  // A photo row requires its image; one whose file cannot be resolved is
  // left out rather than rendered as a broken frame.
  const photos: HackathonPhoto[] = [];
  for (const photo of doc.impressions?.photos ?? []) {
    const filename = await resolveOptionalUploadFilename(
      photo.image,
      `hackathon impression ${photo.caption ?? photo.alt ?? ""}`.trim(),
    );
    if (!filename) continue;
    const size = uploadDimensions(photo.image);
    photos.push({
      src: mediaHref(filename),
      alt: photo.alt ?? "",
      caption: photo.caption ?? "",
      width: size?.width ?? 0,
      height: size?.height ?? 0,
    });
  }

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
      items: doc.schedule.items.map((item) => ({
        ...toAgendaItem(item),
        day: item.day ?? "",
        mark: item.mark ?? "",
      })),
    },
    faqSection: doc.faqSection,
    closingCta: doc.closingCta,
    event: {
      startsAt: doc.event?.startsAt ?? "",
      endsAt: doc.event?.endsAt ?? "",
      location: doc.event?.location ?? "",
    },
    application: {
      isOpen: Boolean(doc.application?.isOpen),
      comingSoonLabel:
        doc.application?.comingSoonLabel?.trim() || HACKATHON_COMING_SOON,
    },
    machine: {
      lines: fromTextRows(doc.machine?.lines),
      hint: doc.machine?.hint ?? "",
      screenLine: doc.machine?.screenLine ?? "",
    },
    aftermovie: {
      heading: doc.aftermovie?.heading ?? "",
      caption: doc.aftermovie?.caption ?? "",
    },
    impressions: {
      heading: doc.impressions?.heading ?? "",
      intro: doc.impressions?.intro ?? "",
      photos,
    },
    facts: toFeatureCards(doc.facts),
    partnerPitch: {
      heading: doc.partnerPitch?.heading ?? "",
      lede: doc.partnerPitch?.lede ?? "",
      points: toFeatureCards(doc.partnerPitch?.points),
      ctaLabel: doc.partnerPitch?.ctaLabel ?? "",
      ctaHref: doc.partnerPitch?.ctaHref ?? "",
      contactEmail: doc.partnerPitch?.contactEmail ?? "",
    },
  };
}

/**
 * JSON mode reads the snapshot unmapped, and a snapshot taken before the
 * Q-Hack 2027 groups existed (the emergency-restored content dir) lacks
 * them. Fill the same safe empties cmsGetHackathon() returns, so both
 * sources hand the page one shape. Present values pass through untouched.
 */
function normalizeHackathon(content: HackathonContent): HackathonContent {
  // The snapshot is unchecked JSON: whatever the type says, any 2027 group,
  // and any field inside one, may be missing. Hence the optional chaining on
  // values the type calls required.
  const { event, application, machine, aftermovie, impressions, partnerPitch } =
    content;
  return {
    ...content,
    schedule: {
      ...content.schedule,
      items: content.schedule.items.map((item) => ({
        ...item,
        day: item.day ?? "",
        mark: item.mark ?? "",
      })),
    },
    event: {
      startsAt: event?.startsAt ?? "",
      endsAt: event?.endsAt ?? "",
      location: event?.location ?? "",
    },
    application: {
      isOpen: Boolean(application?.isOpen),
      comingSoonLabel:
        application?.comingSoonLabel?.trim() || HACKATHON_COMING_SOON,
    },
    machine: {
      lines: machine?.lines ?? [],
      hint: machine?.hint ?? "",
      screenLine: machine?.screenLine ?? "",
    },
    aftermovie: {
      heading: aftermovie?.heading ?? "",
      caption: aftermovie?.caption ?? "",
    },
    impressions: {
      heading: impressions?.heading ?? "",
      intro: impressions?.intro ?? "",
      // Same rule as CMS mode: a row without a file is left out.
      photos: (impressions?.photos ?? [])
        .filter((photo) => Boolean(photo?.src))
        .map((photo) => ({
          src: photo.src,
          alt: photo.alt ?? "",
          caption: photo.caption ?? "",
          width: photo.width ?? 0,
          height: photo.height ?? 0,
        })),
    },
    facts: toFeatureCards(content.facts),
    partnerPitch: {
      heading: partnerPitch?.heading ?? "",
      lede: partnerPitch?.lede ?? "",
      points: toFeatureCards(partnerPitch?.points),
      ctaLabel: partnerPitch?.ctaLabel ?? "",
      ctaHref: partnerPitch?.ctaHref ?? "",
      contactEmail: partnerPitch?.contactEmail ?? "",
    },
  };
}

interface CmsOurTeamDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
  heroImage?: CmsMediaRef | number | string | null;
  tabLabel?: string | null;
  divisionHeading?: string | null;
}

async function cmsGetOurTeam(): Promise<OurTeamContent> {
  const doc = await fetchGlobal<CmsOurTeamDoc>("page-our-team");
  const heroFile = await resolveOptionalUploadFilename(
    doc.heroImage,
    "page-our-team heroImage",
  );
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    heading: doc.heading,
    ...(heroFile && {
      heroImage: { file: heroFile, ...uploadDimensions(doc.heroImage) },
    }),
    ...(doc.tabLabel && { tabLabel: doc.tabLabel }),
    ...(doc.divisionHeading && { divisionHeading: doc.divisionHeading }),
  };
}

interface CmsPastTeamsDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
  intro: string;
  tabLabel?: string | null;
  yearHeading?: string | null;
  photoAlt?: string | null;
  story?: { [K in keyof PastTeamsStory]?: string | null } | null;
}

const PAST_TEAMS_STORY_KEYS = [
  "heroEyebrow",
  "heroHeading",
  "heroLead",
  "cueLabel",
  "originEyebrow",
  "originHeading",
  "originSub",
  "originText",
  "teamsEyebrow",
  "teamsHeading",
  "teamsText",
  "albumEyebrow",
  "albumHeading",
  "albumHint",
  "albumHintTouch",
  "backLabel",
  "closingEyebrow",
  "closingHeading",
  "closingText",
  "closingButtonLabel",
] as const satisfies readonly (keyof PastTeamsStory)[];

/**
 * The story only renders when every field is filled, so a build that runs
 * before the copy is published falls back to the old layout instead of
 * showing half a story. A partly filled group warns once, naming the gaps.
 */
function toPastTeamsStory(
  raw: CmsPastTeamsDoc["story"],
): PastTeamsStory | undefined {
  if (!raw) return undefined;
  const missing = PAST_TEAMS_STORY_KEYS.filter((key) => !raw[key]?.trim());
  if (missing.length === PAST_TEAMS_STORY_KEYS.length) return undefined;
  if (missing.length > 0) {
    console.warn(
      `[content:cms] page-past-teams story is partly filled; showing the fallback layout. Missing: ${missing.join(", ")}`,
    );
    return undefined;
  }
  const story = {} as PastTeamsStory;
  for (const key of PAST_TEAMS_STORY_KEYS) story[key] = raw[key] as string;
  return story;
}

async function cmsGetPastTeams(): Promise<PastTeamsContent> {
  const doc = await fetchGlobal<CmsPastTeamsDoc>("page-past-teams");
  const story = toPastTeamsStory(doc.story);
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    heading: doc.heading,
    intro: doc.intro,
    ...(doc.tabLabel && { tabLabel: doc.tabLabel }),
    ...(doc.yearHeading && { yearHeading: doc.yearHeading }),
    ...(doc.photoAlt && { photoAlt: doc.photoAlt }),
    ...(story && { story }),
  };
}

interface CmsPartnerAudienceDoc {
  label?: string | null;
  summary?: string | null;
  linkLabel?: string | null;
  heading?: string | null;
  intro?: string | null;
  benefitsHeading?: string | null;
  benefits?: { title: string; description: string }[] | null;
  contactsHeading?: string | null;
  contactLabel?: string | null;
  contacts?:
    | {
        name: string;
        role?: string | null;
        email: string;
        photo?: CmsMediaRef | number | string | null;
      }[]
    | null;
}

interface CmsPartnerPageDoc {
  title: string;
  metaDescription?: string | null;
  projector?: {
    eyebrow?: string | null;
    heading?: string | null;
    intro?: string | null;
    hint?: string | null;
    tierSuffix?: string | null;
    websiteLabel?: string | null;
  } | null;
  heading: string;
  quotesHint?: string | null;
  cta: {
    heading: string;
    text: string;
    points?: { title: string }[] | null;
    buttonLabel: string;
    buttonHref: string;
    contact?: {
      name?: string | null;
      role?: string | null;
      email?: string | null;
      copyLabel?: string | null;
      copiedLabel?: string | null;
      photo?: CmsMediaRef | number | string | null;
    } | null;
  };
  audiences?: Partial<
    Record<PartnerAudienceKey, CmsPartnerAudienceDoc | null>
  > | null;
}

// A doc saved before the projector and the audience pages existed has these
// groups empty, and every field in them is optional in the CMS; map them to
// empty strings and lists instead of crashing. partner.astro then shows the
// page title as the heading and no hint, and partnerAudiencePages leaves out
// (and logs) every audience without a label or heading.
async function cmsGetPartnerAudience(
  key: PartnerAudienceKey,
  doc: CmsPartnerAudienceDoc | null | undefined,
): Promise<PartnerAudience> {
  const contacts: PartnerContact[] = [];
  for (const contact of doc?.contacts ?? []) {
    const photoFilename = await resolveOptionalUploadFilename(
      contact.photo,
      `partner ${key} contact ${contact.name}`,
    );
    contacts.push({
      name: contact.name,
      role: contact.role ?? "",
      email: contact.email,
      ...(photoFilename ? { photoFilename } : {}),
    });
  }
  return {
    label: doc?.label ?? "",
    summary: doc?.summary ?? "",
    linkLabel: doc?.linkLabel ?? "",
    heading: doc?.heading ?? "",
    intro: doc?.intro ?? "",
    benefitsHeading: doc?.benefitsHeading ?? "",
    benefits: (doc?.benefits ?? []).map(({ title, description }) => ({
      title,
      description,
    })),
    contactsHeading: doc?.contactsHeading ?? "",
    contactLabel: doc?.contactLabel ?? "",
    contacts,
  };
}

async function cmsGetPartnerCta(
  cta: CmsPartnerPageDoc["cta"],
): Promise<PartnerPageContent["cta"]> {
  const contact = cta.contact;
  const photoFilename = await resolveOptionalUploadFilename(
    contact?.photo,
    "partner cta contact",
  );
  return {
    heading: cta.heading,
    text: cta.text,
    points: (cta.points ?? []).map(({ title }) => title),
    buttonLabel: cta.buttonLabel,
    buttonHref: cta.buttonHref,
    contact: {
      name: contact?.name ?? "",
      role: contact?.role ?? "",
      email: contact?.email ?? "",
      copyLabel: contact?.copyLabel ?? "",
      copiedLabel: contact?.copiedLabel ?? "",
      ...(photoFilename ? { photoFilename } : {}),
    },
  };
}

async function cmsGetPartnerPage(): Promise<PartnerPageContent> {
  const doc = await fetchGlobal<CmsPartnerPageDoc>("page-partner");
  const [startup, corporate, investor] = await Promise.all(
    PARTNER_AUDIENCE_KEYS.map((key) =>
      cmsGetPartnerAudience(key, doc.audiences?.[key]),
    ),
  );
  return {
    title: doc.title,
    metaDescription: doc.metaDescription ?? "",
    projector: {
      eyebrow: doc.projector?.eyebrow ?? "",
      heading: doc.projector?.heading ?? "",
      intro: doc.projector?.intro ?? "",
      hint: doc.projector?.hint ?? "",
      tierSuffix: doc.projector?.tierSuffix ?? "",
      websiteLabel: doc.projector?.websiteLabel ?? "",
    },
    heading: doc.heading,
    quotesHint: doc.quotesHint ?? "",
    cta: await cmsGetPartnerCta(doc.cta),
    audiences: { startup, corporate, investor },
  };
}

interface CmsSpeakerPageDoc {
  title: string;
  metaDescription?: string | null;
  heading: string;
  intro: string;
  panels: SpeakerPanel[];
  hotTopics?: {
    label?: string | null;
    heading?: string | null;
    intro?: string | null;
  } | null;
  lineupPill?: string | null;
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
    hotTopics: {
      label: optionalText(doc.hotTopics?.label),
      heading: optionalText(doc.hotTopics?.heading),
      intro: optionalText(doc.hotTopics?.intro),
    },
    lineupPill: optionalText(doc.lineupPill),
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
      if (item.endsAt !== undefined && Number.isNaN(Date.parse(item.endsAt))) {
        fail(`phase "${item.label}" has an end that is not a date.`);
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

/**
 * Between two discount phases (phases.onSale off) nothing is on sale, so
 * every ticket sells at its regular price, whatever sale price the content
 * still holds. Editors can leave the last (or enter the next) phase's prices
 * in place; the onSale switch alone decides whether they show. Every view,
 * the Why Q pages and llms read the price from here, so none can show a
 * discount the timeline says is not running.
 */
export function normalizeTicketPrices(
  page: TicketCategoriesContent,
): TicketCategoriesContent {
  if (page.phases?.onSale !== false) return page;
  return {
    ...page,
    offer: {
      ...page.offer,
      tickets: page.offer.tickets.map((ticket) => ({
        ...ticket,
        price: ticket.regularPrice,
      })),
    },
  };
}

export async function getPageContent(): Promise<PageContent> {
  const content =
    CONTENT_SOURCE === "cms"
      ? memoizeCms("page-content", cmsGetPageContent)
      : readJson<PageContent>("page-content.json");
  const resolved = normalizeHrefsDeep(await content);
  resolved.kickoff = normalizeKickoff(resolved.kickoff);
  resolved.hackathon = normalizeHackathon(resolved.hackathon);
  assertTicketPage(resolved.ticketCategories);
  resolved.ticketCategories = normalizeTicketPrices(resolved.ticketCategories);
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
