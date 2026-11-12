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

/**
 * One entry of the main navigation. `children` is the optional submenu
 * under the item (the audience pages under "Why Q?"); an item without
 * children is a plain link, and the parent link itself always navigates.
 */
export type NavLink = PageLink & { children?: PageLink[] };

export interface SiteSettings {
  siteTitle: string;
  nav: NavLink[];
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
  kickoff: {
    pageEnabled: boolean;
    redirectRoot: boolean;
  };
}

export interface CmsPageLink {
  label: string;
  href: string;
}

interface CmsSocialLink extends CmsPageLink {
  platform: string;
}

/**
 * `children` is optional in Payload (and absent from a CMS that predates the
 * field): missing, null or empty all read as a plain link.
 */
export interface CmsNavLink extends CmsPageLink {
  children?: CmsPageLink[] | null;
}

interface CmsSiteSettingsDoc {
  siteTitle: string;
  nav: CmsNavLink[];
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
  kickoff?: {
    pageEnabled?: boolean | null;
    redirectRoot?: boolean | null;
  } | null;
}

export const toPageLink = (link: CmsPageLink): PageLink => ({
  label: link.label,
  href: link.href,
});

/**
 * Nav item with its optional submenu. A missing, null or empty `children`
 * leaves the key off entirely, so "has a submenu" is one test everywhere.
 */
export const toNavLink = (link: CmsNavLink): NavLink => {
  const children = (link.children ?? []).map(toPageLink);
  return children.length > 0
    ? { ...toPageLink(link), children }
    : toPageLink(link);
};

async function cmsGetSiteSettings(): Promise<SiteSettings> {
  const doc = await fetchGlobal<CmsSiteSettingsDoc>("site-settings");
  return {
    siteTitle: doc.siteTitle,
    nav: doc.nav.map(toNavLink),
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
    kickoff: {
      pageEnabled: Boolean(doc.kickoff?.pageEnabled),
      redirectRoot: Boolean(doc.kickoff?.redirectRoot),
    },
  };
}

/**
 * Old JSON snapshots omit kickoff; keep / as home until a fixture sets flags.
 * Nav items go through the same mapper as CMS mode, so a snapshot with no,
 * null or empty `children` reads exactly like one from Payload.
 */
function withJsonDefaults(
  settings: Omit<SiteSettings, "kickoff" | "nav"> & {
    nav: CmsNavLink[];
    kickoff?: { pageEnabled?: boolean; redirectRoot?: boolean };
  },
): SiteSettings {
  return {
    ...settings,
    nav: settings.nav.map(toNavLink),
    kickoff: {
      pageEnabled: settings.kickoff?.pageEnabled ?? false,
      redirectRoot: settings.kickoff?.redirectRoot ?? false,
    },
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings =
    CONTENT_SOURCE === "cms"
      ? memoizeCms("site-settings", cmsGetSiteSettings)
      : readJson<Parameters<typeof withJsonDefaults>[0]>(
          "site-settings.json",
        ).then(withJsonDefaults);
  return normalizeHrefsDeep(await settings);
}
