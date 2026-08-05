/**
 * Site settings global (nav, footer, title, llms identity).
 */
import { normalizeHrefsDeep } from "./hrefs";
import { fetchGlobal, memoizeCms } from "./cms";
import { CONTENT_SOURCE, readJson } from "./source";

/** Undo Payload named-subfield text rows back to string[]. */
export function fromTextRows(
  rows: { text: string }[] | null | undefined,
): string[] {
  return (rows ?? []).map((row) => row.text);
}

export interface PageLink {
  label: string;
  href: string;
}

export interface SocialLink extends PageLink {
  /** Stable key for icon lookup, e.g. "tiktok", "instagram-qsummit". */
  platform: string;
}

export interface SiteSettings {
  siteTitle: string;
  nav: PageLink[];
  footer: {
    tagline: string;
    links: PageLink[];
    socialLinks: SocialLink[];
    copyrightHolder: string;
  };
  /** Curated /llms.txt identity. Empty summary/pitch fall back in `lib/llms.ts`. */
  llms?: {
    summary?: string;
    pitch?: string;
    keyFacts?: string[];
    /** YYYY-MM-DD when the identity block was last checked. */
    lastReviewed?: string;
  };
}

export interface CmsPageLink {
  label: string;
  href: string;
}

interface CmsSocialLink extends CmsPageLink {
  platform: string;
}

interface CmsSiteSettingsDoc {
  siteTitle: string;
  nav: CmsPageLink[];
  footer: {
    tagline: string;
    links: CmsPageLink[];
    socialLinks: CmsSocialLink[];
    copyrightHolder: string;
  };
  llms?: {
    summary?: string | null;
    pitch?: string | null;
    keyFacts?: { text: string }[] | null;
    lastReviewed?: string | null;
  } | null;
}

export const toPageLink = (link: CmsPageLink): PageLink => ({
  label: link.label,
  href: link.href,
});

async function cmsGetSiteSettings(): Promise<SiteSettings> {
  const doc = await fetchGlobal<CmsSiteSettingsDoc>("site-settings");
  return {
    siteTitle: doc.siteTitle,
    nav: doc.nav.map(toPageLink),
    footer: {
      tagline: doc.footer.tagline,
      links: doc.footer.links.map(toPageLink),
      socialLinks: doc.footer.socialLinks.map((link) => ({
        label: link.label,
        href: link.href,
        platform: link.platform,
      })),
      copyrightHolder: doc.footer.copyrightHolder,
    },
    llms: {
      summary: doc.llms?.summary?.trim() || undefined,
      pitch: doc.llms?.pitch?.trim() || undefined,
      keyFacts: (() => {
        const facts = fromTextRows(doc.llms?.keyFacts);
        return facts.length > 0 ? facts : undefined;
      })(),
      lastReviewed: doc.llms?.lastReviewed?.trim() || undefined,
    },
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings =
    CONTENT_SOURCE === "cms"
      ? memoizeCms("site-settings", cmsGetSiteSettings)
      : readJson<SiteSettings>("site-settings.json");
  return normalizeHrefsDeep(await settings);
}
