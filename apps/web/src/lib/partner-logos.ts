/**
 * Resolve a partner logo for display walls (index band + partner page).
 * Manifest (mirrored assets) first, then CMS-recorded dimensions, else skip.
 */
import { isFixtureMediaSentinel } from "./media-filename";

export interface PartnerLogoMeta {
  src: string;
  width: number;
  height: number;
}

export interface PartnerLogoInput {
  name: string;
  websiteUrl: string;
  logoFilename: string;
  logoWidth?: number | null;
  logoHeight?: number | null;
}

export interface PartnerLogoDisplay extends PartnerLogoMeta {
  name: string;
  href: string;
}

/**
 * @param warnPrefix e.g. `[index] partner band` or `[partner]`
 */
export function resolvePartnerLogoDisplay(
  partner: PartnerLogoInput,
  manifest: Record<string, PartnerLogoMeta>,
  warnPrefix: string,
): PartnerLogoDisplay | null {
  const meta = manifest[partner.logoFilename];
  if (meta) {
    return {
      name: partner.name,
      href: partner.websiteUrl,
      ...meta,
    };
  }
  if (partner.logoWidth && partner.logoHeight) {
    return {
      name: partner.name,
      href: partner.websiteUrl,
      src: `/media/${partner.logoFilename}`,
      width: partner.logoWidth,
      height: partner.logoHeight,
    };
  }
  // CI fixture uses sentinel logos (no binaries in git): expected, stay quiet.
  if (!isFixtureMediaSentinel(partner.logoFilename)) {
    console.warn(
      `${warnPrefix}: no logo-manifest entry and no CMS dimensions for "${partner.logoFilename}" (partner "${partner.name}"); skipped`,
    );
  }
  return null;
}
