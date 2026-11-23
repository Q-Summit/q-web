/*
 * Copy of the four Why Q audience pages (/whyq/students/, /startups/,
 * /corporates/, /investors/), keyed by the slugs of lib/whyq-audiences.ts.
 *
 * Structure and wording follow the team's page templates one to one:
 * hero, key figures, activities, one highlight
 * section, the audience's ticket and a short FAQ. What the templates left as
 * a placeholder is left out here rather than invented (see `todo` notes).
 *
 * Tickets and prices are NOT here. Each page names the ticket keys it sells
 * and reads the tickets from the page-tickets offer, the source of
 * /ticket-categories/ (DESIGN.md WHYQ-1), so a price changes in one place. A
 * FAQ answer that quotes a price uses a token instead of a number:
 * `{price:<key>}` and `{regular:<key>}` (see fillTicketTokens).
 *
 * This lives in code as a deliberate, temporary exception to "content is
 * CMS" (docs/architecture/08-concepts.md): once the pages are agreed, the
 * copy moves into page-whyq.
 *
 * Pure (no node:fs, no astro imports), so it is unit tested.
 */
import {
  afterpartyImg,
  innovillageImg,
  pitchbattleImg,
  qubeImg,
  speechesImg,
  speedDatingsImg,
  workshopsImg,
} from "../assets/media/program";
import type { TicketKey, TicketOffer } from "./content";

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
  /** The format's photo; without it the card shows its light and a glass Q. */
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

/** Shared by every page: the event line and the fixed labels and links. */
export const WHYQ_SHARED = {
  eventLine: "April 1-2, 2027 · Mannheim · 10th edition",
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

// The program photos, reused for the formats they show.
const IMG = {
  keynote: {
    src: speechesImg,
    width: 800,
    height: 800,
    alt: "A keynote on the Q-Summit main stage",
  },
  workshop: {
    src: workshopsImg,
    width: 800,
    height: 1200,
    alt: "A workshop at Q-Summit",
  },
  speedDating: {
    src: speedDatingsImg,
    width: 800,
    height: 533,
    alt: "Speed dating conversations at Q-Summit",
  },
  innovillage: {
    src: innovillageImg,
    width: 800,
    height: 533,
    alt: "Partner stands in the InnoVillage at Q-Summit",
  },
  qube: {
    src: qubeImg,
    width: 800,
    height: 533,
    alt: "A startup pitching in the Qube at Q-Summit",
  },
  pitchbattle: {
    src: pitchbattleImg,
    width: 800,
    height: 533,
    alt: "The Pitch Battle on the Q-Summit stage",
  },
  afterparty: {
    src: afterpartyImg,
    width: 800,
    height: 533,
    alt: "Guests at a Q-Summit evening event",
  },
  attendees: {
    src: "/media/whyq-attendees-800.webp",
    width: 800,
    height: 533,
    alt: "Attendees networking in the crowd at Q-Summit",
  },
  investors: {
    src: "/media/whyq-investors-800.webp",
    width: 800,
    height: 534,
    alt: "Investors in conversation at Q-Summit",
  },
  founders: {
    src: "/media/whyq-founders-800.webp",
    width: 800,
    height: 632,
    alt: "Panelists on stage at Q-Summit",
  },
  partners: {
    src: "/media/whyq-partners-800.jpg",
    width: 800,
    height: 641,
    alt: "Company representatives talking to students at Q-Summit",
  },
} as const satisfies Record<string, WhyqImage>;

const EARLY_BIRD_FAQ = "How long is the Early Bird price available?";

export const WHYQ_PAGE_COPY: Record<string, WhyqPageCopy> = {
  students: {
    crumb: "For Students & Young Pros",
    metaDescription:
      "Keynotes, workshops, speed dating and campfire sessions: two days at Q-Summit 2027 in Mannheim that kickstart your career.",
    hero: {
      heading: "Two days that kickstart your career.",
      intro:
        "Keynotes, workshops, speed dating and campfire sessions. Meet 80+ partners, startups and VCs in Mannheim, with food, drinks and a goodie bag included.",
      ctaLabel: "Get your ticket",
    },
    stats: [
      { value: "1500+", label: "Participants" },
      { value: "30+", label: "Speakers" },
      { value: "60+", label: "Startups" },
      { value: "80+", label: "Partners on site" },
    ],
    activities: {
      heading: "What's in it for you",
      intro: "Everything your ticket gets you, in one place.",
      items: [
        {
          title: "Keynotes & Panels",
          text: "Hear from founders, investors and industry leaders on stage across both days.",
          kind: "included",
          image: IMG.keynote,
        },
        {
          title: "Workshops",
          text: "Work hands-on with our partners in small groups and get to know the companies up close.",
          kind: "apply",
          image: IMG.workshop,
        },
        {
          title: "Campfire Sessions",
          text: "Small rounds and open conversations in a relaxed setting around the campfire.",
          kind: "apply",
        },
        {
          title: "Speed Dating",
          text: "Short one-on-one talks with companies to get on their radar.",
          kind: "apply",
          image: IMG.speedDating,
        },
        {
          title: "InnoVillage",
          text: "Walk through the InnoVillage, stop by the partner stands and talk to companies directly.",
          kind: "included",
          image: IMG.innovillage,
        },
        {
          title: "Networking",
          text: "Connect with students, alumni, startups and VCs who share your interests.",
          kind: "included",
          image: IMG.attendees,
        },
        {
          title: "Evening events & After-party",
          text: "Keep the conversations going after the stages close and celebrate ten years of Q-Summit.",
          kind: "included",
          image: IMG.afterparty,
        },
      ],
    },
    highlight: {
      kind: "cards",
      eyebrow: "More than a conference",
      heading: "Your future employer is already here",
      intro:
        "All partners are on site. Walk through the InnoVillage, talk to companies directly and take home your goodie bag.",
      cards: [
        {
          kicker: "InnoVillage",
          title: "Meet the companies",
          text: "All 80+ partners are on site. Stop by their stands and talk to them directly about internships and jobs.",
          image: IMG.partners,
        },
        {
          kicker: "For everyone",
          title: "Your goodie bag",
          text: "Every participant gets a Q-Summit goodie bag, packed with snacks and goodies worth 80+ €.",
        },
      ],
    },
    ticket: {
      heading: "Pick your ticket",
      intro: "Both tickets are valid for both Summit days, April 1-2.",
      keys: ["student", "young-professional"],
      includes: {
        heading: "Both tickets include",
        items: [
          "Both Summit days, April 1-2",
          "Keynotes & panel discussions",
          "Applications for workshops, campfire sessions & speed dating",
          "InnoVillage with all partners",
          "Networking with students, alumni, startups & VCs",
          "Free food & drinks all day",
          "Goodie bag worth 80+ €",
          "Evening events & after-party",
        ],
      },
    },
    faq: {
      heading: "Questions from participants",
      items: [
        {
          question: "Who can buy the student ticket?",
          answer:
            "The student ticket is for everyone who is enrolled at a university. Everyone else can get the Young Professional ticket.",
        },
        {
          question:
            "How do I apply for workshops, campfire sessions and speed dating?",
          answer:
            "Once you have your ticket, you can apply for workshops, campfire sessions and speed dating.",
        },
        {
          question: "Are food and drinks included?",
          answer:
            "Yes. Food and drinks are free all day long, on both Summit days.",
        },
        {
          question: "Does everyone get a goodie bag?",
          answer:
            "Yes, every participant gets a Q-Summit goodie bag with snacks and goodies worth 80+ €.",
        },
        {
          question: EARLY_BIRD_FAQ,
          answer:
            "Until {saleEnd}. After that, the student ticket costs {regular:student} and the Young Professional ticket costs {regular:young-professional}.",
        },
      ],
    },
  },

  startups: {
    crumb: "For Startups",
    metaDescription:
      "Pitch in the Qube, battle on stage and meet VCs, founders and 80+ partners: two days at Q-Summit 2027 in Mannheim for startups.",
    hero: {
      heading: "Pitch, connect and grow your startup.",
      intro:
        "Two days in Mannheim with 1,500+ participants, VCs, founders and 80+ partners. Pitch in the Qube, battle on stage and grow your network.",
      ctaLabel: "Get your startup ticket",
    },
    stats: [
      { value: "1500+", label: "Participants" },
      { value: "60+", label: "Startups" },
      { value: "80+", label: "Partners" },
      { value: "2", label: "Pitch formats" },
    ],
    activities: {
      heading: "What's in it for founders",
      intro:
        "Everything your ticket gets you, in one place. With your startup ticket you can apply for the Qube and the Pitch Battle at no extra cost.",
      items: [
        {
          title: "The Qube",
          text: "Showcase your startup and pitch directly to investors in our Qube.",
          kind: "apply",
          image: IMG.qube,
        },
        {
          title: "Pitch Battle",
          text: "Pitch on stage in front of the jury and the audience and compete for prize money.",
          kind: "apply",
          image: IMG.pitchbattle,
        },
        {
          title: "Networking with VCs",
          text: "Two days with investors, founders, corporates and 1,500 motivated students.",
          kind: "included",
          image: IMG.investors,
        },
        {
          title: "Evening events & After-party",
          text: "Keep the conversations going after the stages close, and celebrate ten years of Q-Summit.",
          kind: "included",
          image: IMG.afterparty,
        },
      ],
    },
    highlight: {
      kind: "winner",
      eyebrow: "Pitch Battle 2026",
      heading: "Last year's winner: Kobe",
      intro:
        "Kobe pitched in front of the jury, won the battle and took home the prize money. Next April, it could be you.",
      winnerLabel: "Winner · Pitch Battle 2026",
      winnerName: "Kobe",
      // todo(content): the templates leave "[One line on what Kobe does] ·
      // Prize money: [AMOUNT]" open, and the winner photos (stage, jury,
      // audience, prize handover) are not delivered yet. Set winnerLine and
      // the images once they are; until then the slots show the wash.
      moments: [
        { alt: "The jury of the Pitch Battle 2026" },
        { alt: "The audience at the Pitch Battle 2026" },
        { alt: "Kobe receiving the Pitch Battle 2026 prize" },
      ],
    },
    ticket: {
      heading: "Your startup ticket",
      intro: "Valid for both Summit days, April 1-2.",
      keys: ["start-up"],
      side: [
        {
          title: "The Qube",
          text: "Pitch to investors in the Qube. Apply once you have your startup ticket.",
          status: "Applications open soon",
        },
        {
          title: "Pitch Battle",
          text: "Your chance to pitch on the big stage, in front of the jury and the audience, and win prize money.",
          status: "Applications open soon",
        },
        {
          title: "Networking",
          text: "Two days with investors, founders, corporates and 1,500 motivated students. Included in your ticket.",
          status: "Included",
        },
      ],
    },
    faq: {
      heading: "Questions from founders",
      items: [
        {
          question:
            "Do I need a ticket to apply for the Qube or the Pitch Battle?",
          answer:
            "Yes. Get your startup ticket first, then apply for the Qube and the Pitch Battle at no extra cost.",
        },
        {
          question: "Can my co-founder join on the same ticket?",
          answer:
            "No, each ticket is valid for one person. Every founder on your team needs their own startup ticket.",
        },
        {
          question: "What is included in the startup ticket?",
          answer:
            "Both Summit days, applications for the Qube and the Pitch Battle, networking with VCs and founders, the evening events and the after-party.",
        },
        {
          question: EARLY_BIRD_FAQ,
          answer:
            "The Early Bird price of {price:start-up} is available until {saleEnd}. After that, the startup ticket costs {regular:start-up}.",
        },
      ],
    },
  },

  corporates: {
    crumb: "For Corporates",
    metaDescription:
      "Meet 1,500+ participants, show your brand and find your next hires: two days at Q-Summit 2027 in Mannheim for companies.",
    hero: {
      heading: "Meet the talent shaping tomorrow.",
      intro:
        "Two days of innovation in Mannheim with 1,500 ambitious students, young professionals and industry leaders. Show your brand, find your next hires and connect with everyone in one place.",
      ctaLabel: "Get your corporate ticket",
    },
    stats: [
      { value: "1500+", label: "Participants" },
      { value: "30+", label: "Speakers" },
      { value: "10", label: "Years of Q-Summit" },
      { value: "80+", label: "Partners" },
    ],
    activities: {
      heading: "Built for recruiting",
      intro: "Everything your ticket gets you, in one place.",
      items: [
        {
          title: "Recruiting",
          text: "Meet 1,500 motivated students and young professionals with an entrepreneurial mindset, all in one place.",
          kind: "included",
          image: IMG.partners,
        },
        {
          title: "Corporate Lounge",
          text: "Your dedicated chill and working area with exclusive drinks and snacks.",
          kind: "included",
        },
        {
          title: "Networking",
          text: "Connect with industry leaders, investors, students and fellow corporates across both days.",
          kind: "included",
          image: IMG.attendees,
        },
        {
          title: "Evening events & After-party",
          text: "Keep the conversations going after the stages close and celebrate ten years of Q-Summit.",
          kind: "included",
          image: IMG.afterparty,
        },
      ],
    },
    highlight: {
      kind: "logos",
      eyebrow: "In good company",
      heading: "Companies at Q-Summit 2026",
      intro:
        "Q-Summit brings together people with an entrepreneurial mindset. That's why companies come back to meet them every year.",
      // todo(content): the templates name two companies and leave six tiles
      // as placeholders; the logo files are not delivered yet. Only the
      // named companies are shown.
      names: ["McKinsey & Company", "Osborne Clarke"],
    },
    ticket: {
      heading: "Your corporate ticket",
      intro: "Valid for both Summit days, April 1-2.",
      keys: ["corporate"],
      side: [
        {
          title: "Corporate Lounge",
          text: "Take a break or get some work done in your own area with exclusive drinks and snacks.",
          status: "Included",
        },
        {
          title: "Recruiting & Networking",
          text: "Meet ambitious students, young professionals and industry leaders across both days.",
          status: "Included",
        },
        {
          title: "Evening events & After-party",
          text: "Continue your conversations at the evening events and celebrate at the after-party.",
          status: "Included",
        },
      ],
      // The template's partner panel; its contacts belong on the partner
      // page, which the button opens.
      more: {
        eyebrow: "Partner packages",
        heading: "Want more visibility? Become a partner.",
        text: "With a partner package, your company gets its own space at Q-Summit and direct formats with participants.",
        perks: [
          "Booth or InnoVillage stand",
          "Workshops",
          "Speed Dating",
          "Partner-only check-ins",
          "Private workspaces",
        ],
        linkLabel: "Become a partner",
        href: "/partner/",
      },
    },
    faq: {
      heading: "Questions from companies",
      items: [
        {
          question: "Who is the corporate ticket for?",
          answer:
            "For employees of companies who want to meet talent, show their brand and network at Q-Summit.",
        },
        {
          question: "What is included in the corporate ticket?",
          answer:
            "Both Summit days, a dedicated chill and working area with exclusive drinks and snacks, networking, the evening events and the after-party.",
        },
        {
          question: "Can my company host a booth, workshop or speed dating?",
          answer:
            "These formats are part of our partner packages. Get in touch with our partnerships team to find the right package.",
        },
        {
          question: EARLY_BIRD_FAQ,
          answer:
            "The Early Bird price of {price:corporate} is available until {saleEnd}. After that, the corporate ticket costs {regular:corporate}.",
        },
      ],
    },
  },

  investors: {
    crumb: "For Investors",
    metaDescription:
      "Sit on the Qube jury, meet founders and discover 60+ startups: two days at Q-Summit 2027 in Mannheim for investors.",
    hero: {
      heading: "Discover the startups before everyone else does.",
      intro:
        "Two days in Mannheim with 60+ startups, 1,500+ participants and 80+ partners. Sit on the Qube jury, meet founders and connect with everyone in one place.",
      ctaLabel: "Get your investor ticket",
    },
    stats: [
      { value: "60+", label: "Startups on site" },
      { value: "15", label: "Startups pitching in the Qube" },
      { value: "30+", label: "Investors in the Qube" },
      { value: "1500+", label: "Participants" },
    ],
    activities: {
      heading: "Built for sourcing",
      intro: "Everything your ticket gets you, in one place.",
      items: [
        {
          title: "Qube Jury",
          text: "Sit on the Qube jury and see 15 startups pitch in 3 minutes each.",
          kind: "included",
          image: IMG.founders,
        },
        {
          title: "Meet the Qube startups",
          text: "Talk to the founders who pitched in the Qube right after their pitch.",
          kind: "included",
        },
        {
          title: "Pitch Battle",
          text: "Watch startups battle it out on the main stage in front of the jury and the audience.",
          kind: "included",
          image: IMG.pitchbattle,
        },
        {
          title: "Networking",
          text: "Connect with founders, students, corporates and fellow investors across both days.",
          kind: "included",
          image: IMG.investors,
        },
        {
          title: "Evening events & After-party",
          text: "Keep the conversations going after the stages close, with full catering throughout.",
          kind: "included",
          image: IMG.afterparty,
        },
      ],
    },
    highlight: {
      kind: "qube",
      eyebrow: "The Qube",
      heading: "15 startups. 3 minutes each.",
      intro:
        "In the Qube, 15 hand-picked startups pitch to 30+ investors. You sit on the jury and meet the teams right after.",
      image: IMG.qube,
      logosEyebrow: "In the Qube 2026",
      logosHeading: "Investors who joined last year",
      // todo(content): three names from the templates; the other tiles were
      // placeholders and the logo files are not delivered yet.
      names: ["HV Capital", "10x Founders", "Extantia"],
    },
    ticket: {
      heading: "Your investor ticket",
      intro: "Valid for both Summit days, April 1-2.",
      keys: ["investor"],
      side: [
        {
          title: "Qube Jury",
          text: "Sit on the jury while 15 startups pitch to 30+ investors, then meet the teams.",
          status: "Included",
        },
        {
          title: "Pitch Battle",
          text: "Watch the startups pitch on the main stage and spot the next big thing.",
          status: "Included",
        },
        {
          title: "Networking",
          text: "Connect with founders, students, corporates and fellow investors across both days.",
          status: "Included",
        },
      ],
    },
    faq: {
      heading: "Questions from investors",
      items: [
        {
          question: "Who is the investor ticket for?",
          answer:
            "For everyone who invests in startups: VCs, business angels and corporate VCs.",
        },
        {
          question: "How does the Qube work?",
          answer:
            "15 startups pitch to 30+ investors, with 3 minutes per pitch. With your investor ticket you sit on the jury and can meet the startups afterwards.",
        },
        {
          question: "What is included in the investor ticket?",
          answer:
            "Both Summit days, a seat on the Qube jury, meetings with the Qube startups, the Pitch Battle, networking, the evening events, the after-party and full catering.",
        },
        {
          question: EARLY_BIRD_FAQ,
          answer:
            "The Early Bird price of {price:investor} is available until {saleEnd}. After that, the investor ticket costs {regular:investor}.",
        },
      ],
    },
  },
};

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
