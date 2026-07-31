// Unit tests for the pure analytics modules (src/lib/analytics/config.ts and
// props.ts). Like content.test.ts these run in the "node" vitest project (see
// ../vitest.config.ts) and are typechecked by ./tsconfig.node.json: config.ts
// reads import.meta.env at module load (vitest provides it; the PUBLIC_* vars
// are unset here, which is exactly the CI posture under test).
import { describe, expect, it } from "vitest";

import type { CaptureResult } from "posthog-js";
import {
  beforeSend,
  HOST,
  POSTHOG_OPTIONS,
  shouldCollect,
} from "../src/lib/analytics/config";
import { propsFromAttrs } from "../src/lib/analytics/props";

/** Minimal CaptureResult for the filter under test (only event + properties are read). */
const capture = (
  event: string,
  properties: Record<string, unknown> = {},
): CaptureResult => ({ event, properties }) as unknown as CaptureResult;

describe("analytics config -- cookieless invariants (ADR-0003)", () => {
  it("is genuinely cookieless (no device storage, no replay, no identity)", () => {
    // The privacy contract: if any of these flips, "no consent banner
    // needed" no longer holds and ADR-0003 must be superseded first.
    expect(POSTHOG_OPTIONS.persistence).toBe("memory");
    expect(POSTHOG_OPTIONS.cookieless_mode).toBe("always");
    expect(POSTHOG_OPTIONS.disable_session_recording).toBe(true);
    expect(POSTHOG_OPTIONS.disable_surveys).toBe(true);
    expect(POSTHOG_OPTIONS.person_profiles).toBe("never");
  });

  it("enables the full collection tier without autocapture event spam", () => {
    expect(POSTHOG_OPTIONS.autocapture).toBe(false);
    expect(POSTHOG_OPTIONS.capture_pageview).toBe(true);
    expect(POSTHOG_OPTIONS.capture_pageleave).toBe(true);
    expect(POSTHOG_OPTIONS.capture_exceptions).toBe(true);
    expect(POSTHOG_OPTIONS.capture_heatmaps).toBe(true);
    // Explicit so web vitals never silently depend on a remote project toggle.
    expect(POSTHOG_OPTIONS.capture_performance).toEqual({ web_vitals: true });
  });

  it("pins the SDK defaults tier so an upgrade cannot change behavior silently", () => {
    // Any non-empty pinned date is fine; the point is that it is never left
    // unset (legacy), which would let an SDK bump shift unset options.
    expect(POSTHOG_OPTIONS.defaults).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("ingests through the first-party Worker proxy by default", () => {
    // PUBLIC_POSTHOG_HOST may override for debugging, but the built-in
    // default must be the same-origin /qm route (worker/index.ts).
    expect(HOST).toBe("/qm");
    expect(POSTHOG_OPTIONS.api_host).toBe(HOST);
    expect(POSTHOG_OPTIONS.ui_host).toBe("https://eu.posthog.com");
  });
});

describe("shouldCollect -- fail-safe apex allowlist", () => {
  it("collects only on the production apex hosts", () => {
    expect(shouldCollect("q-summit.com")).toBe(true);
    expect(shouldCollect("www.q-summit.com")).toBe(true);
  });

  it("never collects on previews, local, LAN, or unknown hosts", () => {
    for (const host of [
      "q-web.example.workers.dev",
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      "[::1]",
      "192.168.1.42",
      "q-summit.com.evil.test",
      "cms.q-summit.de",
      "",
      undefined,
    ]) {
      expect(
        shouldCollect(host),
        `expected no collect on ${String(host)}`,
      ).toBe(false);
    }
  });
});

describe("beforeSend -- exception noise filter", () => {
  const exc = (value: string) =>
    capture("$exception", { $exception_list: [{ value }] });

  it("drops unactionable network-noise exceptions", () => {
    expect(beforeSend(exc("Load failed"))).toBeNull();
    expect(beforeSend(exc("Failed to fetch"))).toBeNull();
    expect(beforeSend(exc("The network connection was lost."))).toBeNull();
  });

  it("keeps real exceptions and non-exception events", () => {
    expect(
      beforeSend(exc("Cannot read properties of undefined")),
    ).not.toBeNull();
    // A real error that merely CONTAINS a noise phrase must not be dropped
    // (the regex is anchored on both ends).
    expect(beforeSend(exc("Load failed while parsing config"))).not.toBeNull();
    const pageview = capture("$pageview");
    expect(beforeSend(pageview)).toBe(pageview);
    expect(beforeSend(null)).toBeNull();
  });

  it("also reads the legacy $exception_values payload shape", () => {
    expect(
      beforeSend(
        capture("$exception", { $exception_values: ["Failed to fetch"] }),
      ),
    ).toBeNull();
  });
});

describe("propsFromAttrs -- data-ph-prop-* extraction", () => {
  it("maps prop attribute names to snake_case taxonomy keys, ignoring others", () => {
    expect(
      propsFromAttrs([
        ["data-ph-event", "ticket_purchase_initiated"],
        ["data-ph-prop-tier-name", "Early Bird"],
        ["data-ph-prop-tier-price", "89"],
        ["data-lp", "hero.cta"],
        ["href", "/tickets"],
      ]),
    ).toEqual({ tier_name: "Early Bird", tier_price: "89" });
  });

  it("round-trips a key containing a digit (dataset camelCasing could not)", () => {
    expect(propsFromAttrs([["data-ph-prop-utm-h1-count", "3"]])).toEqual({
      utm_h1_count: "3",
    });
  });

  it("ignores a bare data-ph-prop- with no key", () => {
    expect(propsFromAttrs([["data-ph-prop-", "x"]])).toEqual({});
  });
});
