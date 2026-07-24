import { describe, expect, it } from "vitest";

import { urlOrMailtoValidate } from "../src/lib/url-validate";

// Regression coverage for the shared validator: originally hand-written
// (differently) on Partners.websiteUrl and Jobs.applyUrl, now reused across
// pageLinkFields().href, PageTickets.buyHref, PagePartner.cta.buttonHref,
// PageHackathon's partner href, and SiteSettings' socialLinks href.
describe("urlOrMailtoValidate", () => {
  it("accepts http(s) URLs in every mode", () => {
    const validate = urlOrMailtoValidate();
    expect(validate("https://example.com")).toBe(true);
    expect(validate("http://example.com")).toBe(true);
  });

  it("rejects an empty value by default", () => {
    expect(urlOrMailtoValidate()(undefined)).not.toBe(true);
    expect(urlOrMailtoValidate()("")).not.toBe(true);
  });

  it("accepts an empty value when optional", () => {
    expect(urlOrMailtoValidate({ optional: true })(undefined)).toBe(true);
    expect(urlOrMailtoValidate({ optional: true })("")).toBe(true);
  });

  it("rejects mailto: unless allowMailto is set", () => {
    expect(urlOrMailtoValidate()("mailto:jane@example.com")).not.toBe(true);
    expect(
      urlOrMailtoValidate({ allowMailto: true })("mailto:jane@example.com"),
    ).toBe(true);
  });

  it("rejects a non-http(s) protocol like ftp", () => {
    expect(
      urlOrMailtoValidate({ allowMailto: true })("ftp://example.com/file"),
    ).not.toBe(true);
  });

  it("rejects garbage input", () => {
    expect(urlOrMailtoValidate()("not a url")).not.toBe(true);
  });

  it('allows the literal "#" placeholder only when allowHashPlaceholder is set', () => {
    expect(urlOrMailtoValidate()("#")).not.toBe(true);
    expect(urlOrMailtoValidate({ allowHashPlaceholder: true })("#")).toBe(true);
  });

  it("rejects an internal path or anchor unless allowRelative is set", () => {
    expect(urlOrMailtoValidate()("/whyq")).not.toBe(true);
    expect(urlOrMailtoValidate()("#why-attend")).not.toBe(true);
  });

  it("accepts an internal path or in-page anchor when allowRelative is set", () => {
    const validate = urlOrMailtoValidate({ allowRelative: true });
    expect(validate("/whyq")).toBe(true);
    expect(validate("#why-attend")).toBe(true);
    expect(validate("https://example.com")).toBe(true);
  });
});
