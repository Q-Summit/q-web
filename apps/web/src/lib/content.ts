/**
 * Content layer for the Webflow port.
 *
 * Two modes, selected by the CONTENT_SOURCE env var:
 *  - "json": reads structured JSON from an emergency-restored
 *    content/ dir (docs/dev/go-live.md) or the committed fake fixture;
 *    prefer CONTENT_SOURCE=cms. Real content is never committed to git;
 *    it comes from the CMS (production build, or make pull locally).
 *  - "cms": fetches from the Payload CMS REST API (apps/cms, ADR-0002) at
 *    CMS_URL (default http://localhost:3000), paginating over published
 *    docs (collections) or reading the single published document (globals)
 *    at depth=1, and mapping API shapes back onto the exact types this
 *    module already exports, so pages and components never change.
 *
 * The per-page Payload globals (page-home, page-whyq, ..., site-settings,
 * legal) described in docs/architecture/08-concepts.md exist
 * (apps/cms/src/globals); getSiteSettings, getPageContent, and getLegal
 * fetch and map them in cms mode below. In cms mode nothing reads
 * pages.json, page-content.json, site-settings.json, or legal.json.
 *
 * Implementation lives under ./content/; this file is the public barrel.
 */

export { normalizeHrefsDeep } from "./content/hrefs";
export { stableOrderCompare } from "./content/cms";
export { resolveMediaFilename } from "./content/media";

export type {
  PartnerTier,
  Partner,
  PartnerTestimonial,
} from "./content/partners";
export { getPartners, getPartnerTestimonials } from "./content/partners";

export type { JobWorkload, Job } from "./content/jobs";
export { getJobs } from "./content/jobs";

export type { SpeakerGroup, Speaker } from "./content/speakers";
export {
  currentSpeakerEdition,
  speakersForEdition,
  getSpeakers,
} from "./content/speakers";

export type { TeamMember, PastTeam } from "./content/team";
export { getTeam, getPastTeamPhotos } from "./content/team";

export type { FaqPage, Faq } from "./content/faqs";
export { getFaqs } from "./content/faqs";

export type {
  PageLink,
  SocialLink,
  SiteSettings,
} from "./content/site-settings";
export { getSiteSettings } from "./content/site-settings";

export type {
  PageStat,
  AgendaItem,
  TicketTier,
  PricingComparisonTier,
  PricingComparisonGroup,
  PricingComparison,
  TicketCategoryDetail,
  BoardMember,
  ContactItem,
  PartnerGroup,
  FeatureCard,
  WhyCard,
  HomeContent,
  WhyqAudienceItem,
  WhyqAudience,
  WhyqContent,
  ProgramContent,
  TicketCategoriesContent,
  ContactContent,
  HackathonContent,
  OurTeamContent,
  PastTeamsContent,
  PartnerPageContent,
  SpeakerPanel,
  SpeakerPageContent,
  JobsPageContent,
  PageContent,
} from "./content/pages";
export { getPageContent } from "./content/pages";

export type { LegalSlug } from "./content/legal";
export { getLegal } from "./content/legal";
