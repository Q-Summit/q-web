// Builders for /llms.txt and /llms-full.txt. Route tables are hand-curated.
import type { PageContent, SiteSettings } from "./content";
import {
  WHYQ_AUDIENCE_PAGES,
  whyqAudienceNames,
  whyqAudiencePath,
} from "./whyq-audiences";

export interface LlmsLink {
  slug: string;
  label: string;
  description: string;
}

export interface LlmsRouteTable {
  mainPages: LlmsLink[];
  optional: LlmsLink[];
}

/** Absolute trailing-slash URL matching Astro `trailingSlash: "always"`. */
export function toAbsoluteUrl(site: string, slug: string): string {
  const parsed = new URL(slug, site);
  if (!parsed.pathname.endsWith("/")) parsed.pathname += "/";
  return parsed.toString();
}

/** Collapse CMS textarea newlines so Markdown list/blockquote lines stay intact. */
export function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function toLink(site: string, entry: LlmsLink): string {
  const url = toAbsoluteUrl(site, entry.slug);
  const description = oneLine(entry.description);
  return description
    ? `- [${entry.label}](${url}): ${description}`
    : `- [${entry.label}](${url})`;
}

/** Join short announcement fragments into one readable paragraph. */
export function joinAnnouncement(lines: string[]): string {
  return lines
    .map((line) => (/[.!?]$/.test(line) ? line : `${line}.`))
    .join(" ");
}

/** Title of an audience page in both llms surfaces, named from the nav. */
function whyqAudienceTitle(slug: string, settings?: SiteSettings): string {
  return `Why Q-Summit: ${whyqAudienceNames(slug, settings?.nav ?? []).label}`;
}

export function buildRouteTable(
  content: PageContent,
  settings?: SiteSettings,
): LlmsRouteTable {
  // "Why Q?" is the four audience pages under /whyq/ (there is no overview
  // page; /whyq/ redirects to the homepage, astro.config.mjs). They share
  // the page-whyq blurb; their names come from the nav.
  const audiencePages: LlmsLink[] = WHYQ_AUDIENCE_PAGES.map(({ slug }) => ({
    slug: whyqAudiencePath(slug),
    label: whyqAudienceTitle(slug, settings),
    description: content.whyq.metaDescription,
  }));

  const mainPages: LlmsLink[] = [
    { slug: "/", label: "Home", description: content.home.metaDescription },
    ...audiencePages,
    {
      slug: "/speaker",
      label: "Speakers",
      description: content.speaker.metaDescription,
    },
    {
      slug: "/partner",
      label: "Partners",
      description: content.partner.metaDescription,
    },
    // /program is offline (astro.config.mjs redirects it to the homepage),
    // so it is listed neither here nor in the full-text corpus below.
    {
      slug: "/hackathon",
      label: "Hackathon",
      description: content.hackathon.metaDescription,
    },
    {
      slug: "/ticket-categories",
      label: "Ticket Categories",
      description: content.ticketCategories.metaDescription,
    },
    {
      slug: "/our-team",
      label: "Our Team",
      description: content.ourTeam.metaDescription,
    },
    {
      slug: "/job-listings",
      label: "Job Listings",
      description: content.jobs.metaDescription,
    },
    {
      slug: "/contact",
      label: "Contact",
      description: content.contact.metaDescription,
    },
  ];

  // Legal HTML pages have no CMS SEO fields; name-only links.
  const optional: LlmsLink[] = [
    {
      slug: "/past-teams",
      label: "Past Teams",
      description: content.pastTeams.metaDescription,
    },
    ...(settings?.kickoff?.pageEnabled && content.kickoff
      ? [
          {
            slug: "/kickoff",
            label: content.kickoff.title,
            description: content.kickoff.metaDescription,
          },
        ]
      : []),
    { slug: "/imprint", label: "Imprint", description: "" },
    { slug: "/privacy-policy", label: "Privacy Policy", description: "" },
    {
      slug: "/terms-and-conditions",
      label: "Terms and Conditions",
      description: "",
    },
  ];

  return { mainPages, optional };
}

function section(heading: string, bodyLines: string[]): string[] {
  const body = bodyLines.filter((line) => line.trim().length > 0);
  if (body.length === 0) return [];
  return [`## ${heading}`, "", ...body, ""];
}

function bullet(label: string, value: string): string {
  return `- ${label}: ${value}`;
}

function pageHeader(
  site: string,
  slug: string,
  title: string,
  metaDescription: string,
): string[] {
  const url = toAbsoluteUrl(site, slug);
  const lines = [`# ${title}`, "", `Source: ${url}`, ""];
  const blurb = oneLine(metaDescription);
  if (blurb) lines.push(blurb, "");
  return lines;
}

/** Curated index (llmstxt.org). Identity: Site Settings → llms; link blurbs: page metaDescription. */
export function buildLlmsTxt(opts: {
  site: string;
  siteSettings: SiteSettings;
  pageContent: PageContent;
}): string {
  const { site, siteSettings, pageContent } = opts;
  const { mainPages, optional } = buildRouteTable(pageContent, siteSettings);
  const fullUrl = new URL("/llms-full.txt", site).href;
  const sitemapUrl = new URL("/sitemap-index.xml", site).href;
  const { home } = pageContent;
  const llms = siteSettings.llms;

  const summary = oneLine(llms?.summary?.trim() || siteSettings.footer.tagline);
  const pitch = oneLine(llms?.pitch?.trim() || home.hero.tagline);
  const curatedFacts = (llms?.keyFacts ?? [])
    .map((fact) => oneLine(fact))
    .filter(Boolean);
  const lastReviewed = llms?.lastReviewed?.trim();

  const identity: string[] = [pitch, ""];
  if (curatedFacts.length > 0) {
    identity.push("Key facts:", ...curatedFacts.map((fact) => `- ${fact}`));
  }
  if (lastReviewed) {
    identity.push("", `Last reviewed: ${lastReviewed}.`);
  }

  const lines = [
    `# ${siteSettings.siteTitle}`,
    "",
    `> ${summary}`,
    "",
    ...identity,
    "",
    "## Main pages",
    "",
    ...mainPages.map((entry) => toLink(site, entry)),
    "",
    "## Optional",
    "",
    `- [Full text corpus](${fullUrl}): Single-file Markdown of selected main-page sections (plus Past Teams) for offline or single-pass ingestion.`,
    `- [HTML sitemap](${sitemapUrl}): Full URL list for crawlers.`,
    ...optional.map((entry) => toLink(site, entry)),
    "",
  ];

  return lines.join("\n");
}

/** Main page sections for offline / single-pass ingestion. Legal HTML stays Optional links only. */
export function buildLlmsFullTxt(opts: {
  site: string;
  siteSettings: SiteSettings;
  pageContent: PageContent;
}): string {
  const { site, siteSettings, pageContent } = opts;
  const indexUrl = new URL("/llms.txt", site).href;
  const summary = oneLine(
    siteSettings.llms?.summary?.trim() || siteSettings.footer.tagline,
  );
  const {
    home,
    whyq,
    speaker,
    partner,
    hackathon,
    ticketCategories,
    ourTeam,
    jobs,
    contact,
    pastTeams,
    kickoff,
  } = pageContent;

  const blocks: string[][] = [
    [
      `# ${siteSettings.siteTitle}`,
      "",
      `> ${summary}`,
      "",
      joinAnnouncement(home.hero.announcementLines),
      "",
      `Index: [${indexUrl}](${indexUrl})`,
      "",
      "---",
      "",
    ],
    [
      ...pageHeader(site, "/", home.title, home.metaDescription),
      ...section("Hero", [
        home.hero.headline,
        home.hero.tagline,
        bullet("CTA", `${home.hero.cta.label} (${home.hero.cta.href})`),
      ]),
      ...section("Stats", [
        home.stats.heading,
        home.stats.intro,
        ...home.stats.items.map((item) => bullet(item.label, item.value)),
      ]),
      ...section("Why attend", [
        home.whyAttend.heading,
        home.whyAttend.intro,
        ...home.whyAttend.cards.map((card) =>
          bullet(card.title, card.description),
        ),
      ]),
      "---",
      "",
    ],
    // One block per audience page, as the site shows them: the page-whyq
    // intro and that audience's section. An audience an editor removed
    // leaves its page without a section, and its block without one.
    ...WHYQ_AUDIENCE_PAGES.map(({ slug, audienceId }) => {
      const audience = whyq.audiences.find((entry) => entry.id === audienceId);
      return [
        ...pageHeader(
          site,
          whyqAudiencePath(slug),
          whyqAudienceTitle(slug, siteSettings),
          whyq.metaDescription,
        ),
        whyq.intro,
        "",
        ...(audience
          ? section(audience.heading, [
              audience.intro,
              ...audience.items.map((item) =>
                bullet(item.title, item.description),
              ),
            ])
          : []),
        "---",
        "",
      ];
    }),
    [
      ...pageHeader(site, "/speaker", speaker.title, speaker.metaDescription),
      speaker.heading,
      "",
      speaker.intro,
      "",
      ...section(
        "Panels",
        speaker.panels.map((panel) => bullet(panel.title, panel.description)),
      ),
      "---",
      "",
    ],
    [
      ...pageHeader(site, "/partner", partner.title, partner.metaDescription),
      partner.heading,
      "",
      ...section("Partner with us", [
        partner.cta.heading,
        partner.cta.text,
        bullet("CTA", `${partner.cta.buttonLabel} (${partner.cta.buttonHref})`),
      ]),
      "---",
      "",
    ],
    [
      ...pageHeader(
        site,
        "/hackathon",
        hackathon.title,
        hackathon.metaDescription,
      ),
      ...section("Hero", [hackathon.hero.headline, hackathon.hero.tagline]),
      ...section("Benefits", [
        hackathon.benefits.heading,
        ...hackathon.benefits.cards.map((card) =>
          bullet(card.title, card.description),
        ),
      ]),
      ...section("Schedule", [
        hackathon.schedule.heading,
        hackathon.schedule.intro,
        ...hackathon.schedule.items.map(
          (item) => `- ${item.date}: **${item.title}**: ${item.description}`,
        ),
      ]),
      ...section("Closing", [
        hackathon.closingCta.heading,
        hackathon.closingCta.text,
        bullet(
          "Email",
          `${hackathon.closingCta.mailtoLabel} <${hackathon.closingCta.mailtoEmail}>`,
        ),
      ]),
      "---",
      "",
    ],
    [
      ...pageHeader(
        site,
        "/ticket-categories",
        ticketCategories.title,
        ticketCategories.metaDescription,
      ),
      ...section("Tickets", [
        ticketCategories.hero.heading,
        ticketCategories.hero.intro,
        ...ticketCategories.offer.tickets.map((ticket) => {
          const note = ticket.note ? ` (${ticket.note})` : "";
          return bullet(
            ticket.name,
            `€${ticket.price} (regular €${ticket.regularPrice})${note}. ${ticket.description}. ${ticket.highlights.join("; ")}`,
          );
        }),
        ticketCategories.offer.footnote,
      ]),
      ...section(
        ticketCategories.included.heading,
        ticketCategories.included.groups.map((group) =>
          bullet(
            group.heading,
            group.rows
              .map((row) => {
                const names = ticketCategories.offer.tickets
                  .filter((t) => row.tickets.includes(t.key))
                  .map((t) => t.name);
                return `${row.label} (${names.length ? names.join(", ") : "none"})`;
              })
              .join("; "),
          ),
        ),
      ),
      "---",
      "",
    ],
    [
      ...pageHeader(site, "/our-team", ourTeam.title, ourTeam.metaDescription),
      ourTeam.heading,
      "",
      "---",
      "",
    ],
    [
      ...pageHeader(site, "/job-listings", jobs.title, jobs.metaDescription),
      jobs.heading,
      "",
      jobs.intro,
      "",
      "---",
      "",
    ],
    [
      ...pageHeader(site, "/contact", contact.title, contact.metaDescription),
      ...section(contact.board.heading, [
        ...contact.board.paragraphs,
        ...contact.board.members.map((member) =>
          bullet(member.name, `${member.role} <${member.email}>`),
        ),
      ]),
      ...section(contact.reachOut.heading, [
        ...contact.reachOut.paragraphs,
        ...contact.reachOut.items.map((item) => {
          const detail = item.details.join(" ");
          const email = item.email ? ` <${item.email}>` : "";
          return bullet(item.label, `${detail}${email}`.trim());
        }),
      ]),
      "---",
      "",
    ],
    [
      ...pageHeader(
        site,
        "/past-teams",
        pastTeams.title,
        pastTeams.metaDescription,
      ),
      pastTeams.heading,
      "",
      pastTeams.intro,
      "",
    ],
  ];

  if (siteSettings.kickoff?.pageEnabled && kickoff) {
    blocks.push([
      "---",
      "",
      ...pageHeader(site, "/kickoff", kickoff.title, kickoff.metaDescription),
      ...section("Hero", [kickoff.hero.headline, kickoff.hero.copy]),
      ...section(kickoff.kickoff.heading, [kickoff.kickoff.intro]),
      ...section("Application", [
        kickoff.application.heading,
        kickoff.application.applicationUrl
          ? `Apply: ${kickoff.application.applicationUrl}`
          : "",
      ]),
    ]);
  }

  return blocks.flat().join("\n");
}
