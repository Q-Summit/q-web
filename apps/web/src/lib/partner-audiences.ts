/**
 * The three "Become a Partner" audiences on /partner/; each one owns a page
 * at /partner/<key>/ (pages/partner/[audience].astro). Kept free of the
 * content loaders so llms.ts and the tests can use it without a content
 * source.
 */
import type { PartnerAudience, PartnerPageContent } from "./content/pages";

export const PARTNER_AUDIENCE_KEYS = [
  "startup",
  "corporate",
  "investor",
] as const;
export type PartnerAudienceKey = (typeof PARTNER_AUDIENCE_KEYS)[number];

/**
 * The audience pages that can actually be built: the three keys in their
 * fixed order, minus any the CMS has not filled in yet (a doc published
 * before these fields existed has them empty). An unfilled audience drops
 * its field on /partner/ and its page instead of failing the whole site
 * build, so publishing the migration never blocks a deploy; the build log
 * says which one is waiting for copy.
 */
export function partnerAudiencePages(
  partner: PartnerPageContent,
): { key: PartnerAudienceKey; audience: PartnerAudience }[] {
  return PARTNER_AUDIENCE_KEYS.flatMap((key) => {
    const audience = partner.audiences?.[key];
    if (!audience?.label?.trim() || !audience.heading?.trim()) {
      console.warn(
        `[content] partner.audiences.${key} has no label or heading yet; /partner/${key}/ is not built.`,
      );
      return [];
    }
    return [{ key, audience }];
  });
}
