import { describe, expect, it } from "vitest";

import { normalizeInternalHref } from "../src/lib/href";

describe("normalizeInternalHref", () => {
  it("appends a trailing slash to root-relative page paths", () => {
    expect(normalizeInternalHref("/whyq")).toBe("/whyq/");
    expect(normalizeInternalHref("/job-listings")).toBe("/job-listings/");
    expect(normalizeInternalHref("/job-listings/tacto")).toBe(
      "/job-listings/tacto/",
    );
  });

  it("leaves the bare root and already-slashed paths unchanged", () => {
    expect(normalizeInternalHref("/")).toBe("/");
    expect(normalizeInternalHref("/whyq/")).toBe("/whyq/");
    expect(normalizeInternalHref("/job-listings/tacto/")).toBe(
      "/job-listings/tacto/",
    );
  });

  it("leaves file-like paths (dot in the last segment) unchanged", () => {
    expect(normalizeInternalHref("/llms.txt")).toBe("/llms.txt");
    expect(normalizeInternalHref("/robots.txt")).toBe("/robots.txt");
    expect(normalizeInternalHref("/favicon.ico")).toBe("/favicon.ico");
    expect(normalizeInternalHref("/media/hero-poster.jpg")).toBe(
      "/media/hero-poster.jpg",
    );
    // Only the last segment counts: a dotted directory still gets slashed.
    expect(normalizeInternalHref("/foo.bar/baz")).toBe("/foo.bar/baz/");
  });

  it("does not touch external, protocol-relative, mailto, tel, or in-page links", () => {
    expect(normalizeInternalHref("https://q-summit.com/whyq")).toBe(
      "https://q-summit.com/whyq",
    );
    expect(normalizeInternalHref("//cdn.example.com/asset")).toBe(
      "//cdn.example.com/asset",
    );
    expect(normalizeInternalHref("mailto:hi@q-summit.com")).toBe(
      "mailto:hi@q-summit.com",
    );
    expect(normalizeInternalHref("tel:+49123")).toBe("tel:+49123");
    expect(normalizeInternalHref("#why-attend")).toBe("#why-attend");
  });

  it("preserves a query string or fragment on the far side of the slash", () => {
    expect(normalizeInternalHref("/contact?ref=x")).toBe("/contact/?ref=x");
    expect(normalizeInternalHref("/whyq#audience")).toBe("/whyq/#audience");
    expect(normalizeInternalHref("/whyq/?ref=x")).toBe("/whyq/?ref=x");
    // A query/fragment on the bare root leaves the root untouched.
    expect(normalizeInternalHref("/#top")).toBe("/#top");
  });

  it("is idempotent", () => {
    for (const href of [
      "/whyq",
      "/contact?ref=x",
      "/whyq#audience",
      "/",
      "/llms.txt",
    ]) {
      expect(normalizeInternalHref(normalizeInternalHref(href))).toBe(
        normalizeInternalHref(href),
      );
    }
  });
});
