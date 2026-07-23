/**
 * Shared http(s)/mailto/relative link validator. Originally written twice
 * (Partners.websiteUrl, Jobs.applyUrl) with slightly different rules per
 * field; factored here so every href/URL text field in the schema gets the
 * same editor-facing check instead of failing silently at build or runtime
 * on the live site.
 */

export interface UrlValidateOptions {
  /** Allow the literal placeholder "#" (Partners: no website yet). */
  allowHashPlaceholder?: boolean;
  /** Allow a mailto: address (Jobs, PagePartner cta, hackathon closing cta). */
  allowMailto?: boolean;
  /**
   * Allow same-site paths ("/whyq") and in-page anchors ("#why-attend").
   * Needed for nav/footer/CTA links (pageLinkFields), which route inside the
   * static site as often as they point off-site.
   */
  allowRelative?: boolean;
  /** Field is optional; empty/undefined passes. Defaults to required. */
  optional?: boolean;
}

/** Payload field `validate` signature: return `true` or an error string. */
export type FieldValidate = (value: string | null | undefined) => true | string;

export function urlOrMailtoValidate(
  opts: UrlValidateOptions = {},
): FieldValidate {
  return (value) => {
    if (typeof value !== "string" || value.length === 0) {
      return opts.optional ? true : "Enter a URL.";
    }
    if (opts.allowHashPlaceholder && value === "#") return true;
    if (
      opts.allowRelative &&
      (value.startsWith("/") || value.startsWith("#"))
    ) {
      return true;
    }
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") return true;
      if (opts.allowMailto && url.protocol === "mailto:") return true;
      return opts.allowMailto
        ? "Must be an http(s) URL or a mailto: address."
        : "Must be an http(s) URL.";
    } catch {
      if (opts.allowRelative) {
        return (
          'Must be a full URL (https://...), a mailto: address, an internal path (e.g. "/whyq"), ' +
          'or an in-page anchor (e.g. "#faq").'
        );
      }
      return opts.allowMailto
        ? "Enter a valid URL (https://...) or mailto: address."
        : "Must be a valid URL, e.g. https://example.com";
    }
  };
}
