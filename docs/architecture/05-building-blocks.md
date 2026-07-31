# 5 · Building blocks

<!-- arc42 section 5: C4 Container/Component views. -->

Set by [ADR-0001](../decisions/0001-astro-static-site.md) and [ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md).

## Container view

| Container | Package | Holds |
| --- | --- | --- |
| Public site | `apps/web` (Astro, static output) | 16 Astro pages, layouts and components, build-time content loaders (`src/lib/content.ts`), SEO head (`Base.astro`), `/llms.txt` + `/llms-full.txt`, `robots.txt`, sitemap |
| Media Worker | `apps/web/worker` + `wrangler.jsonc` | Serves `/media/*` from the R2 `MEDIA` binding and proxies `/qm/*` to PostHog EU; static assets otherwise |
| CMS | `apps/cms` (Payload 3) | Collection schemas, globals for pages/settings, per-division access control, drafts and approver publish rights, R2 upload adapter, draft-only `POST /api/content-sync`, Publish → Workers Builds deploy hook ([section 6](06-runtime.md), [`../dev/content-sync.md`](../dev/content-sync.md), [`../dev/go-live.md`](../dev/go-live.md)) |
| Database | Neon Postgres (Frankfurt) | All CMS content and editor accounts; about 10 MB against a 500 MB free cap |
| Media | Cloudflare R2 (`qweb-media`) | Images uploaded through Payload; hero/hack video and HLS are seeded into R2 outside the image-only Media allowlist (media pipeline: [section 9](09-architecture-decisions.md)) |

## Content collections

Nine collections in `apps/cms/src/collections/`: Users, Media, Partners, Jobs, Speakers, Team, PastTeams, Faqs, Testimonials. Page and site settings live as **globals**, not collections. Expected volumes are the scraped-site order of magnitude (for example partners ~137, jobs ~70, speakers ~36, team ~32, faqs ~19). Exact schemas live in `apps/cms/src/collections/`; [section 8](08-concepts.md) holds the rules they implement.
