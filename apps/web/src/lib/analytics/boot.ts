/**
 * Analytics boot -- COOKIELESS BY DEFAULT (ADR-0003, docs/dev/analytics.md).
 *
 * PostHog Cloud EU through the first-party /qm/* Worker proxy; `persistence:
 * 'memory'` + `cookieless_mode: 'always'`: nothing is written to or read from
 * the device, so no consent banner is required. Events are anonymous (a
 * transient server-side daily-salt hash, no cross-session identity).
 *
 * Boots only when PUBLIC_POSTHOG_KEY is set AND the page is served from a
 * production hostname (fail-safe allowlist in ./config), so local dev, CI,
 * VRT, and preview builds never load the SDK or send a single request.
 *
 * The import is the `full.no-external` build: every extension (exception
 * autocapture, web vitals) is pre-bundled into our own hashed chunk, so the
 * SDK never injects a runtime <script> from a PostHog host -- the no
 * third-party-scripts rule (apps/web AGENTS.md NEVER) holds at runtime, not
 * just at build time. Trade-off: the in-page toolbar cannot load (it is
 * remote-only by design); heatmaps and dashboards are viewed in the PostHog
 * app instead.
 *
 * Framework-free on purpose: this loads as a plain bundled <script> from
 * Base.astro, not an island. All config + gating logic lives in ./config
 * (pure, unit-tested); DOM wiring lives in ./dom; this file is only the
 * browser init side effect.
 */
import { KEY, POSTHOG_OPTIONS, shouldCollect } from "./config";
import { wireAnalyticsDom } from "./dom";

// Local const so the narrowing survives into the import() callback below
// (TypeScript does not carry control-flow narrowing of imported bindings
// across function boundaries).
const key = KEY;

if (
  key &&
  typeof location !== "undefined" &&
  shouldCollect(location.hostname)
) {
  // Look up the coarse visitor country from our own edge (worker /qm/geo ->
  // cf.country, never the IP) in parallel with the SDK chunk. Time-boxed so a
  // slow or blocked lookup can never hold analytics hostage; on failure it
  // resolves to null and events are simply country-less.
  const country: Promise<string | null> = fetch("/qm/geo", {
    signal: AbortSignal.timeout(1500),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((geo: { country?: unknown } | null) =>
      typeof geo?.country === "string" && geo.country ? geo.country : null,
    )
    .catch(() => null);

  // Lazy-load the SDK ONLY on a real collecting host, so every other host
  // ships just this tiny guard, never the SDK chunk. Analytics must never
  // surface an error to the visitor, so a failed chunk load or a throwing
  // init resolves to null and every later capture becomes a no-op rather than
  // an unhandled rejection.
  //
  // Country is registered inside the same tick as init(), before init
  // returns, so it lands on the automatic first `$pageview` and on the
  // page-level events too, not only on later clicks. The two keys are both
  // load-bearing, so do NOT drop or rename either:
  //  - `country_coarse`: our own property, for HogQL and breakdowns.
  //  - `$geoip_country_code`: PostHog's Trends "World map" and the Web
  //    Analytics country tile are hard-coded to this exact property name, so a
  //    custom name would render no map (PostHog issue #9679). It survives
  //    because PostHog's server GeoIP transformation early-returns when there
  //    is no IP, which is always the case in cookieless mode, so it never
  //    overwrites the value we set here.
  const ready = Promise.all([
    import("posthog-js/dist/module.full.no-external"),
    country,
  ])
    .then(([{ default: posthog }, countryCode]) => {
      posthog.init(key, POSTHOG_OPTIONS);
      if (countryCode) {
        posthog.register({
          country_coarse: countryCode,
          $geoip_country_code: countryCode,
        });
      }
      return posthog;
    })
    .catch(() => null);

  // Listeners attach immediately; captures queue on `ready`, so a click in the
  // first moments is queued and fires once the SDK has loaded (as long as the
  // page is still alive). sendBeacon covers the navigation that most tracked
  // clicks trigger after that point.
  wireAnalyticsDom((event, props) => {
    void ready.then((ph) =>
      ph?.capture(event, props, { transport: "sendBeacon" }),
    );
  });
}
