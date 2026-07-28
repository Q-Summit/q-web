/**
 * Legal pages (verbatim German HTML from the live site).
 */
import { fetchGlobal, memoizeCms } from "./cms";
import { CONTENT_SOURCE, readJson } from "./source";

export type LegalSlug = "imprint" | "privacy-policy" | "terms-and-conditions";

interface CmsLegalDoc {
  imprint: string;
  privacyPolicy: string;
  termsAndConditions: string;
}

async function cmsGetLegal(): Promise<Record<LegalSlug, string>> {
  const doc = await fetchGlobal<CmsLegalDoc>("legal");
  return {
    imprint: doc.imprint,
    "privacy-policy": doc.privacyPolicy,
    "terms-and-conditions": doc.termsAndConditions,
  };
}

export function getLegal(): Promise<Record<LegalSlug, string>> {
  return CONTENT_SOURCE === "cms"
    ? memoizeCms("legal", cmsGetLegal)
    : readJson<Record<LegalSlug, string>>("legal.json");
}
