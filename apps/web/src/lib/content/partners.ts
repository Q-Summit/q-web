/**
 * Partners collection + testimonials.
 */
import { fetchPublishedDocs, memoizeCms, stableOrderCompare } from "./cms";
import {
  resolveOptionalUploadFilename,
  resolveUploadFilename,
  uploadDimensions,
  type CmsMediaRef,
} from "./media";
import { CONTENT_SOURCE, readJson } from "./source";

export type PartnerTier =
  | "Platinum"
  | "Gold"
  | "Silver"
  | "Starter"
  | "Knowledge"
  | "Event"
  | "Mobility"
  | "University and Network"
  | "Media";

export interface Partner {
  name: string;
  tier: PartnerTier;
  websiteUrl: string;
  logoFilename: string;
  /** Two or three sentences for the pop-up on /partner/; optional. */
  description?: string;
  /** Intrinsic logo size from the CMS Media doc; unset in JSON mode (the logo manifest covers those). */
  logoWidth?: number;
  logoHeight?: number;
  /** The partner's own white logo for dark grounds (/partner/); unset puts
   * the regular logo on a white plate there. Sizes as for the logo. */
  logoOnDarkFilename?: string;
  logoOnDarkWidth?: number;
  logoOnDarkHeight?: number;
}

export interface PartnerTestimonial {
  quote: string;
  attribution: string;
  photoFilename?: string;
}

// tier select values (Partners.ts) -> the display labels this module exports.
const PARTNER_TIER_LABELS: Record<string, PartnerTier> = {
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  starter: "Starter",
  knowledge: "Knowledge",
  event: "Event",
  mobility: "Mobility",
  "university-and-network": "University and Network",
  media: "Media",
};

interface CmsPartnerDoc {
  id: number | string;
  name: string;
  tier: string;
  websiteUrl: string;
  description?: string | null;
  logo: CmsMediaRef | number | string | null;
  logoOnDark?: CmsMediaRef | number | string | null;
  order?: number | null;
}

async function cmsGetPartnerDocs(): Promise<CmsPartnerDoc[]> {
  const docs = await fetchPublishedDocs<CmsPartnerDoc>("partners");
  return docs.sort(stableOrderCompare);
}

async function cmsLogoOnDark(
  doc: CmsPartnerDoc,
): Promise<
  Pick<Partner, "logoOnDarkFilename" | "logoOnDarkWidth" | "logoOnDarkHeight">
> {
  const filename = await resolveOptionalUploadFilename(
    doc.logoOnDark,
    `partner ${doc.name} logo for dark backgrounds`,
  );
  const dims = uploadDimensions(doc.logoOnDark ?? null);
  if (!filename || !dims) return {};
  return {
    logoOnDarkFilename: filename,
    logoOnDarkWidth: dims.width,
    logoOnDarkHeight: dims.height,
  };
}

async function cmsGetPartners(): Promise<Partner[]> {
  const docs = await cmsGetPartnerDocs();
  const partners: Partner[] = [];
  for (const doc of docs) {
    const dims = uploadDimensions(doc.logo);
    const tier = PARTNER_TIER_LABELS[doc.tier];
    if (!tier) {
      // Unmapped tier values never match a tier grouping anyway; skip instead
      // of casting a lie into the PartnerTier union.
      console.warn(
        `[content:cms] unmapped partner tier "${doc.tier}" for partner "${doc.name}"; skipped`,
      );
      continue;
    }
    partners.push({
      name: doc.name,
      tier,
      websiteUrl: doc.websiteUrl ?? "",
      logoFilename: await resolveUploadFilename(
        doc.logo,
        `partner ${doc.name}`,
      ),
      ...(doc.description?.trim()
        ? { description: doc.description.trim() }
        : {}),
      ...(dims ? { logoWidth: dims.width, logoHeight: dims.height } : {}),
      ...(await cmsLogoOnDark(doc)),
    });
  }
  return partners;
}

interface CmsTestimonialDoc {
  quote: string;
  attribution: string;
  photo?: CmsMediaRef | number | string | null;
  order?: number | null;
}

async function cmsGetPartnerTestimonials(): Promise<PartnerTestimonial[]> {
  const docs = await fetchPublishedDocs<CmsTestimonialDoc>("testimonials");
  docs.sort(stableOrderCompare);
  const testimonials: PartnerTestimonial[] = [];
  for (const doc of docs) {
    const photoFilename = await resolveOptionalUploadFilename(
      doc.photo,
      `testimonial ${doc.attribution}`,
    );
    testimonials.push({
      quote: doc.quote,
      attribution: doc.attribution,
      ...(photoFilename ? { photoFilename } : {}),
    });
  }
  return testimonials;
}

export function getPartners(): Promise<Partner[]> {
  return CONTENT_SOURCE === "cms"
    ? memoizeCms("partners", cmsGetPartners)
    : readJson<Partner[]>("partners.json");
}

export function getPartnerTestimonials(): Promise<PartnerTestimonial[]> {
  return CONTENT_SOURCE === "cms"
    ? memoizeCms("partner-testimonials", cmsGetPartnerTestimonials)
    : readJson<PartnerTestimonial[]>("partner-testimonials.json");
}
