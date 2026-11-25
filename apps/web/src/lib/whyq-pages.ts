/*
 * The four Why Q audience pages (/whyq/students/, /startups/, /corporates/,
 * /investors/): the shapes their components render and the helpers that
 * fill them.
 *
 * The copy, figures, photos and logos are content: they live in the
 * page-whyq global (its "Audience pages"), come in through getPageContent()
 * and are turned into these shapes by toWhyqPageCopy below, so no real copy
 * lives in git. Tickets and prices are read from the page-tickets offer, the
 * source of /ticket-categories/ (DESIGN.md WHYQ-1); a FAQ answer that quotes
 * a price holds a token instead of a number: `{price:<key>}` and
 * `{regular:<key>}` (see fillTicketTokens).
 *
 * Pure (no node:fs, no astro imports), so it is unit tested.
 */
import type {
  TicketKey,
  TicketOffer,
  WhyqAudiencePageContent,
  WhyqPhoto,
} from "./content";

/** In the ticket, or something to apply for with the ticket. */
export type ActivityKind = "included" | "apply";

/** The words for each kind, as the templates print them. */
export const ACTIVITY_KIND_LABEL: Record<ActivityKind, string> = {
  included: "Included",
  apply: "Apply with ticket",
};

export interface WhyqImage {
  /** Path under /media (Worker/R2; binaries are never committed). */
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface WhyqStat {
  /** The figure as printed, e.g. "1500" or "60+". */
  value: string;
  label: string;
}

export interface WhyqActivity {
  title: string;
  text: string;
  kind: ActivityKind;
  /** The format's photo; without it the card shows the ticket page's wash. */
  image?: WhyqImage;
}

export interface WhyqHighlightCard {
  kicker: string;
  title: string;
  text: string;
  image?: WhyqImage;
}

interface HighlightBase {
  eyebrow: string;
  heading: string;
  intro: string;
}

/** The section between the activities and the ticket, one kind per page. */
export type WhyqHighlight =
  | (HighlightBase & { kind: "cards"; cards: WhyqHighlightCard[] })
  | (HighlightBase & {
      kind: "winner";
      winnerLabel: string;
      winnerName: string;
      /** One line on the winner and the prize money; shown once it is known. */
      winnerLine?: string;
      image?: WhyqImage;
      /** The template's row of three moments under the stage photo. */
      moments: { alt: string; image?: WhyqImage }[];
    })
  | (HighlightBase & { kind: "logos"; names: string[] })
  | (HighlightBase & {
      kind: "qube";
      image?: WhyqImage;
      logosEyebrow: string;
      logosHeading: string;
      names: string[];
    });

export interface WhyqSideCard {
  title: string;
  text: string;
  /** The words on the card's status chip. */
  status: string;
}

export interface WhyqFaq {
  question: string;
  /** Plain text; may hold `{price:<key>}` / `{regular:<key>}` tokens. */
  answer: string;
}

export interface WhyqPageCopy {
  /** Breadcrumb label, e.g. "For Startups". */
  crumb: string;
  metaDescription: string;
  hero: { heading: string; intro: string; ctaLabel: string };
  stats: WhyqStat[];
  activities: {
    heading: string;
    intro: string;
    items: WhyqActivity[];
  };
  highlight: WhyqHighlight;
  ticket: {
    heading: string;
    intro: string;
    /** Tickets this audience buys, as keys of the page-tickets offer. */
    keys: TicketKey[];
    /** Cards beside the ticket. */
    side?: WhyqSideCard[];
    /** A list beside the tickets (Students: "Both tickets include"). */
    includes?: { heading: string; items: string[] };
    /** A panel with a link under the section (Corporates: partner page). */
    more?: {
      eyebrow: string;
      heading: string;
      text: string;
      /** What a partner package brings, as a checklist. */
      perks: string[];
      linkLabel: string;
      href: string;
    };
  };
  faq: { heading: string; items: WhyqFaq[] };
}

/** The fixed labels and links every page shares (page chrome, not copy). */
export const WHYQ_SHARED = {
  jumpLabel: "See activities",
  activitiesEyebrow: "Activities",
  ticketEyebrow: "Tickets",
  allTicketsLabel: "All tickets",
  ticketsHref: "/ticket-categories/",
  faqEyebrow: "FAQ",
  // The templates' "Write to [CONTACT EMAIL]": the page fills in the
  // general address of the contact page (page-contact), or links to the
  // contact page while there is none.
  faqMore: {
    text: "Still have a question? Write to",
    linkLabel: "us",
    href: "/contact/",
  },
} as const;

/** A figure split for the count-up: "60+" -> 60 and "+". */
export function parseStat(value: string): { number: number; suffix: string } {
  const match = /^(\d+)(.*)$/.exec(value.trim());
  if (!match) return { number: 0, suffix: value };
  return { number: Number(match[1]), suffix: match[2] };
}

/**
 * Replaces `{price:<key>}` and `{regular:<key>}` with that ticket's sale and
 * regular price from the offer, formatted by `format`. A token whose ticket
 * is missing returns `undefined`, so the caller can drop the whole answer
 * instead of printing a sentence with a hole in it.
 */
export function fillTicketTokens(
  text: string,
  tickets: readonly TicketOffer[],
  format: (amount: number) => string,
): string | undefined {
  let missing = false;
  const filled = text.replace(
    /\{(price|regular):([a-z-]+)\}/g,
    (_, kind: string, key: string) => {
      const ticket = tickets.find((entry) => entry.key === key);
      if (!ticket) {
        missing = true;
        return "";
      }
      return format(kind === "price" ? ticket.price : ticket.regularPrice);
    },
  );
  return missing ? undefined : filled;
}

/**
 * The site's spelling for names that the page-tickets content writes its own
 * way ("Start-Up", "Pitchbattle", "Young Professional"), applied to what the
 * ticket card shows on these pages, so every Why Q page reads as the rest
 * of the website: Startup, Pitch Battle, Young Pro.
 */
export function siteSpelling(text: string): string {
  return text
    .replace(/\bStart-Up\b/g, "Startup")
    .replace(/\bstart-up\b/gi, "startup")
    .replace(/\bPitchbattle\b/gi, "Pitch Battle")
    .replace(/\bYoung Professional\b/g, "Young Pro");
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Copy as HTML that never breaks "Q-Summit" at its hyphen (a line ending
 * in "Q-" reads as a typo): the name is wrapped in a no-wrap span
 * (whyq-theme.css .wq-nowrap). Everything else is escaped as plain text.
 */
export function brandHtml(text: string): string {
  return escapeHtml(text).replace(
    /Q-Summit/g,
    '<span class="wq-nowrap">Q-Summit</span>',
  );
}

/** Size assumed for a photo whose size the content does not record. */
const PHOTO_FALLBACK = { width: 800, height: 533 } as const;

/** A content photo as the components draw it, under /media. */
export function whyqImage(photo: WhyqPhoto | undefined): WhyqImage | undefined {
  if (!photo?.file) return undefined;
  return {
    src: `/media/${photo.file}`,
    width: photo.width ?? PHOTO_FALLBACK.width,
    height: photo.height ?? PHOTO_FALLBACK.height,
    alt: photo.alt,
  };
}

/**
 * One audience page of the page-whyq content in the shape its components
 * render. Optional groups the content leaves empty stay out (no empty side
 * cards, no list without lines, no partner panel without a heading).
 */
export function toWhyqPageCopy(page: WhyqAudiencePageContent): WhyqPageCopy {
  const hl = page.highlight;
  const base = {
    eyebrow: hl.eyebrow,
    heading: hl.heading,
    intro: hl.intro ?? "",
  };
  const names = (hl.logos ?? []).map((logo) => logo.name);
  const highlight: WhyqHighlight =
    hl.layout === "winner"
      ? {
          ...base,
          kind: "winner",
          winnerLabel: hl.winnerLabel ?? "",
          winnerName: hl.winnerName ?? "",
          ...(hl.winnerLine ? { winnerLine: hl.winnerLine } : {}),
          image: whyqImage(hl.image),
          moments: (hl.moments ?? []).map((moment) => ({
            alt: moment.alt,
            image: whyqImage(moment.image),
          })),
        }
      : hl.layout === "logos"
        ? { ...base, kind: "logos", names }
        : hl.layout === "qube"
          ? {
              ...base,
              kind: "qube",
              image: whyqImage(hl.image),
              logosEyebrow: hl.logosEyebrow ?? "",
              logosHeading: hl.logosHeading ?? "",
              names,
            }
          : {
              ...base,
              kind: "cards",
              cards: (hl.cards ?? []).map((card) => ({
                kicker: card.kicker,
                title: card.title,
                text: card.text,
                image: whyqImage(card.image),
              })),
            };
  const { ticket } = page;
  const panel = ticket.partnerPanel;
  return {
    crumb: page.crumb,
    metaDescription: page.metaDescription,
    hero: page.hero,
    stats: page.stats,
    activities: {
      heading: page.activities.heading,
      intro: page.activities.intro ?? "",
      items: page.activities.items.map((item) => ({
        title: item.title,
        text: item.text,
        kind: item.kind,
        image: whyqImage(item.image),
      })),
    },
    highlight,
    ticket: {
      heading: ticket.heading,
      intro: ticket.intro ?? "",
      keys: ticket.keys,
      ...(ticket.side?.length ? { side: ticket.side } : {}),
      ...(ticket.includes?.length
        ? {
            includes: {
              heading: ticket.includesHeading ?? "",
              items: ticket.includes,
            },
          }
        : {}),
      ...(panel?.heading
        ? {
            more: {
              eyebrow: panel.eyebrow,
              heading: panel.heading,
              text: panel.text,
              perks: panel.perks,
              linkLabel: panel.linkLabel,
              href: panel.href || "/partner/",
            },
          }
        : {}),
    },
    faq: page.faq,
  };
}
