# Analytics (PostHog, cookieless)

The site runs cookieless PostHog Cloud EU per [ADR-0003](../decisions/0003-posthog-cookieless-analytics.md). This page is the reference for how the client works and what it collects. Turning collection on in production lives in the single go-live runbook, [go-live.md](go-live.md). Event and code conventions for agents live in the **posthog-analytics** skill (`.agents/skills/posthog-analytics/`).

## How it works

The client lives in `apps/web/src/lib/analytics/`. `events.ts` holds the frozen event taxonomy, `config.ts` holds the pure cookieless configuration (its invariants are unit tested), `dom.ts` and `props.ts` handle the delegated DOM wiring, and `boot.ts` is the single entry point, loaded once by `Base.astro`.

The SDK is bundled from `posthog-js/dist/module.full.no-external`, which compiles every extension we use (exception autocapture, web vitals) into the site's own hashed chunk, so the page never loads a script from a PostHog host. The one consequence is that the in-page toolbar cannot load; heatmaps and insights are viewed in the PostHog app instead. `config.ts` also pins the SDK's dated `defaults` tier, so a posthog-js upgrade can never silently change client behavior; that pin moves only as a deliberate part of an SDK upgrade.

Ingestion is first party. The Worker (`apps/web/worker/index.ts`) proxies `/qm/*` to `eu.i.posthog.com`, passing the visitor IP along and stripping cookies. Because every request stays on the site's own origin, content blockers that key on PostHog's domains never see them.

Country data works without an IP. The same Worker serves `/qm/geo`, which returns the coarse 2-letter country Cloudflare already knows at the edge (`request.cf.country`, never the IP). `boot.ts` fetches it once and registers it as a super property under two keys: `country_coarse` for our own breakdowns, and `$geoip_country_code` because PostHog's native world map is hard-coded to that exact property name. This is why the world map is not blank even though PostHog's own IP GeoIP yields nothing in cookieless mode. The values `"XX"` and `"T1"` (unknown, Tor) collapse to no property at all.

Collection is gated fail-safe. The client boots only when `PUBLIC_POSTHOG_KEY` is set and the page is served from `q-summit.com` or `www.q-summit.com` (the `shouldCollect` allowlist, so an unknown host defaults to not collecting). Local dev, CI, VRT, previews, and `*.workers.dev` hosts never send anything, key or no key, and because the SDK chunk is lazy loaded behind that guard, a non-collecting page never even downloads it.

## What is collected

The site captures `$pageview`, `$pageleave`, `$web_vitals`, heatmap coordinates, `$exception` (with network and engine-internal noise filtered out in `before_send`), a coarse `country_coarse` on every event, and the custom events defined in `events.ts`. The automatic signals are each turned on explicitly through the `capture_*` flags in `config.ts`; `country_coarse` is registered from the `/qm/geo` lookup, and the custom events fire through the `data-ph-*` wiring.

`before_send` in `config.ts` holds two anchored noise patterns, both for exceptions the site cannot act on. `EXCEPTION_NETWORK_NOISE` covers per-engine fetch-layer failures on flaky or content-blocked mobile networks, which otherwise include the SDK recapturing its own failed beacons. `EXCEPTION_BROWSER_NOISE` covers WebKit reporting a skipped native view transition as an unhandled rejection: nothing in the codebase touches the view-transition API, so no script ever holds the promise WebKit rejects, and every iOS browser files it on ordinary navigations. Both are anchored on the exact message, so a real error that merely contains one of those phrases still reports. Add a pattern only for an exception with no stack that no code change could fix.

It does not collect autocapture click events, session replay, surveys, person profiles, cookies, IPs, or any client-stored identifier. Unique visitors come from PostHog's server-side daily-salt hash, so cross-day uniques are approximate; that is the trade ADR-0003 accepts.

## Environment variables

| Variable | Where it is set | Notes |
| --- | --- | --- |
| `PUBLIC_POSTHOG_KEY` | Cloudflare Workers Builds (`q-web` variables) | The project API key (`phc_...`). Public by design, not a secret; leave it unset in CI and locally. Astro inlines `PUBLIC_*` values into the bundle at build time, so setting or clearing the key takes effect only on the next Workers Builds deploy, never on the already-built site. |
| `PUBLIC_POSTHOG_HOST` | optional override | Defaults to `/qm`, the Worker proxy. Point it at `https://eu.i.posthog.com` only to debug the proxy itself. |
| `POSTHOG_PERSONAL_API_KEY` | your shell only, never a file in git | The personal API key for the MCP server, described below. |

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| The key is set and deployed, but no events reach PostHog | The cookieless server hash mode toggle is off (PostHog drops the events silently), the key was set without a fresh deploy, or you are looking at a non-production host; the client only collects on `q-summit.com` and `www.q-summit.com`. |
| Events arrive but the world map stays empty | `/qm/geo` returned `XX`, `T1`, or null, or `$geoip_country_code` is no longer registered in `boot.ts`. |
| `/qm/e/` returns 404 in the network tab | The request path falls outside the proxy allowlist (`/e/`, `/i/`, `/flags/`, `/array/`, `/batch/`) in `worker/index.ts`. |
| `/qm/*` returns 202 but nothing lands in PostHog | `eu.i.posthog.com` was unreachable from the edge, so the proxy accepted and dropped the events rather than hanging. This is transient. |
| Every event lacks `country_coarse` | `/qm/geo` returned `XX`, `T1`, or null (an unknown or Tor edge location), or the lookup was blocked; the client registers country before the first event, so a partial miss points at the `/qm/geo` response rather than timing. |

## The MCP server

`.mcp.json` registers PostHog's MCP server for everyone who opens this repo in Claude Code; it reads `POSTHOG_PERSONAL_API_KEY` from the environment. The key comes from PostHog EU (Settings, Personal API keys), created with the **MCP Server** preset so it is scoped to what the server needs. Export it (`phx_...`) in your shell profile and nowhere else: `.env*` files are gitignored, and the committed `.mcp.json` holds only the variable reference. Once the variable is set, `claude mcp list` shows `posthog` without a missing-variable warning, and the first use asks for a one-time project approval.

The server is there to query insights, dashboards, HogQL, and error tracking issues. Reading and creating insights is fine; the project settings that back the cookieless posture stay untouched unless a human confirms the change.

## CI gates

Three gates keep this setup honest. The taxonomy gate, `pnpm run check:events` (part of `check:fast`), requires every event name to be an `EVENTS.*` reference into the frozen taxonomy, rejects property keys that look like PII, and fails on any `identify()` call in `apps/web/src`. The unit tests in `apps/web/test/analytics.test.ts` assert the cookieless invariants (`persistence: memory`, `cookieless_mode: always`, replay and surveys off, `person_profiles: never`); flipping any one of them fails `check:web`. And the proxy tests in `apps/web/test/analytics-proxy.test.ts` verify that `/qm/*` forwards path, query, and body to PostHog EU, strips cookies, and never trusts a client-supplied `X-Forwarded-For`.
