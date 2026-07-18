# 5 · Building blocks

<!-- arc42 section 5: C4 Container/Component views. -->

Set by [ADR-0001](../decisions/0001-astro-static-site.md), [ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md), and [ADR-0003](../decisions/0003-posthog-cookieless-analytics.md).

## Container view

| Container | Package | Holds |
| --- | --- | --- |
| Public site | `apps/web` (Astro, static output) | 10+ pages, layouts and components, a build-time Payload client that fetches all collections, redirect rules, cookieless PostHog |
| CMS | `apps/cms` (Payload 3) | Collection schemas, per-division access control, drafts and approval, the publish hook that triggers rebuilds, R2 upload adapter |
| Database | Neon Postgres (Frankfurt) | All CMS content and editor accounts |
| Media | Cloudflare R2 | Images, the re-encoded hero video; uploaded through Payload |
| Analytics | PostHog Cloud EU | Cookieless anonymous usage events; no consent banner |

## Content collections

Six collections, about 300 items: partners (about 150), jobs (about 70), speakers (about 30), team (about 38), FAQ entries, and pages. Exact schemas live in `apps/cms/src/collections/`; [section 8](08-concepts.md) holds the rules they implement.
