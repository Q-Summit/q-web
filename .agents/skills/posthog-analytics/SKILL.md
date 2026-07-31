---
name: posthog-analytics
description: "Instrument and reason about q-web's cookieless PostHog analytics (ADR-0003): decide whether an interaction deserves an event, add it to the frozen taxonomy, wire it with data-ph-* attributes, and query insights, dashboards, errors, or HogQL through the PostHog MCP server. Use when adding, changing, or removing a tracked event, editing apps/web/src/lib/analytics/* or the /qm routes in worker/index.ts, fixing a check:events failure, or when the user mentions PostHog, analytics, tracking, events, conversions, funnels, pageviews, heatmaps, error tracking, web vitals, country/geo, insights, or dashboards."
---

# PostHog analytics (apps/web only)

Cookieless PostHog Cloud EU per [ADR-0003](../../../docs/decisions/0003-posthog-cookieless-analytics.md);
reference: [docs/dev/analytics.md](../../../docs/dev/analytics.md); production turn-on and rollback: [docs/dev/go-live.md](../../../docs/dev/go-live.md) (PostHog analytics).
The client lives in the **public site only**. `apps/cms` never loads it.

| Piece | Path |
| --- | --- |
| Frozen event taxonomy (the source of truth for names) | `apps/web/src/lib/analytics/events.ts` |
| Client config (pure, unit-tested invariants) | `apps/web/src/lib/analytics/config.ts` |
| Delegated DOM wiring + prop extraction | `apps/web/src/lib/analytics/dom.ts`, `props.ts` |
| Boot (only side-effect entry, loaded by `Base.astro`) | `apps/web/src/lib/analytics/boot.ts` |
| First-party ingestion proxy + edge geo | `apps/web/worker/index.ts` (`/qm/*`, `/qm/geo`) |
| Taxonomy gate (part of `check:fast`) | `scripts/check/events.mjs` |
| Tests | `apps/web/test/analytics.test.ts`, `apps/web/test/analytics-proxy.test.ts` |

## Does this interaction deserve an event?

Autocapture is **off on purpose**. Heatmaps already show where people click and
scroll on every page, and `$pageview` / `$pageleave` already cover page
popularity, bounce, and dwell. So a custom event is a deliberate addition, not
the default reflex. Add one only when it clears this bar:

> **It marks a conversion or funnel step whose count someone will act on**, and
> you can state the question it answers in one sentence.

Add an event (yes):

- A high-intent CTA that moves someone toward a goal: buy a ticket, apply to a
  job, contact a partner, join the hackathon.
- The top of a funnel you want to measure completion of (e.g. the ticket page
  view that pairs with the buy click).

Do **not** add an event when something already covers it:

- Generic navigation, footer links, logo clicks, and decorative hovers are
  covered by heatmaps.
- "Track every button so we have the data" is the autocapture firehose we
  deliberately turned off; it inflates event volume and buries the signal.
- Scroll depth, page popularity, and bounce already come from heatmaps,
  `$pageleave`, and `$pageview`.
- Visitor country is already on every event as `country_coarse` (see below), so
  never add a per-event country property.

If you cannot name the question the event answers, do not add it. A small,
funnel-critical set is what keeps the numbers readable.

**Already automatic, never re-add:** `$pageview`, `$pageleave`, `$web_vitals`
(performance), `$exception` (error tracking, with a network-noise filter), and
heatmaps are all turned on in `config.ts` (`POSTHOG_OPTIONS`). If one of these
is not showing up, fix the config or the PostHog project toggle rather than
adding a custom event or a second SDK call for it.

## How to add one

1. **Name it in the taxonomy.** Add a key to `EVENTS` in `events.ts` with a doc
   comment saying where it fires and which props it carries. This is the only
   place names are allowed to originate.

2. **Mark the element declaratively.** Components never import or call
   posthog-js; they set attributes and a delegated listener in `dom.ts` does the
   rest. Import `EVENTS` in the component frontmatter, then use the pattern that
   fits the interaction:

   ```astro
   ---
   import { EVENTS } from "../../lib/analytics/events";
   ---
   <!-- a click (link or button) -->
   <a href={href} data-ph-event={EVENTS.hero_cta_clicked}
      data-ph-prop-cta-label={label} data-ph-prop-cta-href={href}>{label}</a>

   <!-- a <details> opening (FAQ accordions); closing is not tracked -->
   <details data-ph-toggle-event={EVENTS.faq_opened}
            data-ph-prop-question={question}>...</details>
   ```

   For a **once-per-page-load** event (a page view that tops a funnel), pass
   `pageEvent` to `<Base>` instead of marking an element:

   ```astro
   <Base pageEvent={{ name: EVENTS.job_listing_viewed,
                      props: { job_title: job.title, company: job.company } }}>
   ```

3. **Attach properties as `data-ph-prop-<kebab-key>`.** `data-ph-prop-tier-name`
   becomes `tier_name`. String values only, and never PII (see NEVER). `props`
   on `pageEvent` use snake_case keys directly.

4. **Verify** with `pnpm run check:events && pnpm --filter web test`.

Worked example, end to end: a "join the hackathon" apply button. It passes the
bar (a funnel step someone acts on), so add `hackathon_apply_clicked` to
`EVENTS` with a doc comment, put
`data-ph-event={EVENTS.hackathon_apply_clicked} data-ph-prop-team-size={size}`
on the button, and run the two commands above until they pass.

## Naming and properties

- `object_action`, snake_case, past tense throughout, views included
  (`ticket_page_viewed`, `job_listing_viewed`, `hero_cta_clicked`).
- **Append-only.** Hosted PostHog insights, funnels, and dashboards reference
  these exact names. Never rename or delete a shipped event without updating
  PostHog in the same change; prefer adding a new name over repurposing an old
  one.
- Reference events only as `EVENTS.*`. A raw string literal in an event
  attribute fails `check:events`.

## Country is already on every event

`boot.ts` fetches `/qm/geo` (Cloudflare `request.cf.country` at the edge, never
the IP) and registers it once as super properties: `country_coarse` (our
breakdown) plus `$geoip_country_code` (so PostHog's native world map fills in,
since its own IP GeoIP stays empty in cookieless mode). Keep both keys in that
`register()` call. This is how the site gets country breakdowns while staying
cookieless. Do not add per-event country props or ask for the IP.

## ALWAYS

- Keep config changes inside `POSTHOG_OPTIONS` in `config.ts` and mirror any
  new invariant in `apps/web/test/analytics.test.ts`.
- Treat `shouldCollect`'s production-host allowlist as the safety net that keeps
  local, CI, VRT, and previews out of production data. Never widen it to a
  preview or `*.workers.dev` host.

## NEVER

- Call `identify()`, set cookies or a persistent `distinct_id`, or create
  person profiles. Anonymous only; changing this supersedes ADR-0003 and needs
  a consent banner first.
- Put PII (email, phone, names, raw IP, precise location) in an event name or
  property. The gate rejects PII-shaped keys.
- Load the SDK from a PostHog host (the wizard snippet, `array.js`, or the
  default lazy-loaded extensions). Only the bundled
  `posthog-js/dist/module.full.no-external` import in `boot.ts` is allowed;
  runtime data goes to `/qm/*` only.
- Turn on `autocapture`, session replay, or surveys to "get more data".
- Add analytics to `apps/cms`, or reach into posthog-js from a component.

## PostHog MCP

`.mcp.json` registers the PostHog MCP server (HTTP, `mcp.posthog.com/mcp`),
authenticated with `Bearer ${POSTHOG_PERSONAL_API_KEY}` from the environment;
setup in [docs/dev/analytics.md](../../../docs/dev/analytics.md). Use it to read
or build insights, dashboards, HogQL queries, and error-tracking issues against
the EU project instead of guessing numbers. Creating insights and annotations
is fine; never change project settings that back the cookieless posture
(cookieless server hash mode, autocapture, GeoIP) without the human confirming.
