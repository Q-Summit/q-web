# 12 · Glossary

<!-- arc42 section 12: shared vocabulary. -->

The terms the docs and issues assume you know. Domain terms land here when the first docs that need them arrive.

## Domain

| Term | Meaning |
| --- | --- |
| **Division** | An organizational unit of Q-Summit e.V. (for example partner, PR, concept). Each division edits its own content in the CMS under its own accounts. |
| **Editor** | A division member with a personal, scoped Payload account. Edits drafts; cannot publish without approval. |
| **Approver** | Someone with publish rights; the gate between drafts and the live site. |
| **Edition** | One conference year's content. Year fields exist on some collections; the full create/archive rollover mechanism is still owed ([section 9](09-architecture-decisions.md)). |
| **Collection** | A content type in Payload (Users, Media, Partners, Jobs, Speakers, Team, PastTeams, Faqs, Testimonials). Pages and site settings are globals. |
| **Content package** | Versioned JSON transfer artifact (`bundle.json`) under `scripts/content-packages/`; not the git source of truth. Procedure: [`../dev/content-sync.md`](../dev/content-sync.md). |
| **Content sync / propose** | `POST /api/content-sync`: draft-only upserts as the operator's own Workspace user, stamped `@agent.q-summit.com` so the changelog reads "(agent)". Never publishes or deploys. |

## Process and docs

| Term | Meaning |
| --- | --- |
| **ADR** | Architecture Decision Record in [`../decisions/`](../decisions/): a system-wide decision chosen among alternatives. Append-only. |
| **arc42** | The standard architecture doc template ([arc42.org](https://arc42.org/overview)) structuring `architecture/`. Always describes the system as it works right now. |
| **C4** | A way to describe software at four zoom levels (context, container, component, code). Our diagrams are plain flowcharts styled at the context/container level. |
| **Same-PR rule** | Every doc a change invalidates is updated in the same PR ([`../README.md`](../README.md)). |

## Platform

| Term | Meaning |
| --- | --- |
| **Astro** | The static site framework for `apps/web`; builds all pages to plain HTML at deploy time. |
| **Payload** | The open-source (MIT) CMS for `apps/cms`; where all content lives and editors work. |
| **Neon** | Managed Postgres (Frankfurt) backing Payload. |
| **R2** | Cloudflare object storage for media, S3-compatible. |
| **PostHog** | Cookieless analytics, EU cloud ([ADR-0003](../decisions/0003-posthog-cookieless-analytics.md)); decided so the site can stay banner-free. Client not shipped yet. |
| **Deploy hook** | Workers Builds URL the CMS POSTs on approver live-site changes: publish, unpublish, restore, live delete (`CLOUDFLARE_DEPLOY_HOOK_URL`; [section 6](06-runtime.md)). |
| **vivenu** | The external ticketing provider; the site only links out to it. |
| **llms.txt** | Curated Markdown index at `/llms.txt` for AI agents ([llmstxt.org](https://llmstxt.org/)); identity from Site Settings → `llms`, link blurbs from page meta descriptions. |
| **llms-full.txt** | Full-text companion corpus at `/llms-full.txt` for single-pass ingestion (page bodies). |
| **Open Graph** | HTML meta tags (`og:*`) that drive WhatsApp, LinkedIn, and similar link previews. |
