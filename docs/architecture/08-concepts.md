# 8 · Concepts

<!-- arc42 section 8: content model, authorization, crosscutting rules. -->

The standing rules of the system, set by [ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md) (content and authorization), [ADR-0003](../decisions/0003-posthog-cookieless-analytics.md) (cookieless / no-banner), and [ADR-0005](../decisions/0005-google-sso-group-roles.md) (sign-in and role assignment). The Payload schema in `apps/cms` implements them; a PR that changes the schema updates this chapter.

## Authentication and authorization

- **Sign-in (production) is Google only:** members authenticate with their `q-summit.com` Workspace account through the `payload-oauth2` plugin ([ADR-0005](../decisions/0005-google-sso-group-roles.md)); the email/password strategy is disabled in production. The local dev workbench keeps seeded password logins ([`../dev/local-development.md`](../dev/local-development.md)).
- **Roles and divisions come from Workspace groups,** re-synced on every login (the group is the source of truth): `cms-admins` and `cms-approvers` grant the admin and approver roles; `cms-<division>` grants editor plus that division (group names adjustable via `GOOGLE_GROUP_MAP`, [`../dev/go-live.md`](../dev/go-live.md#google-sso-setup)). First login provisions the account (JIT); a member in no role-granting group is refused and no account is created; a Workspace email alone grants nothing.
- **Access changes by group membership,** not by hand-editing roles in the admin UI, since login overwrites roles/divisions from the groups. Removing a member from the Workspace groups removes their access at their next login. The content-sync actor is not an exception: it is a real person's account, provisioned by the same Google login and carrying the same roles/divisions as their manual editing ([`../dev/go-live.md`](../dev/go-live.md#cms-admin-bootstrap)).
- **Login fails closed:** if the group-membership lookup (Admin SDK Directory API) is unavailable, sign-in is refused rather than granting a fallback role.
- Every account is personal and scoped to a division; there are no shared logins.
- Access is **per collection and per page global** (division-scoped helpers in `apps/cms/src/access/`), not per content field. Example: partner edits partners, jobs, testimonials, and the partner/jobs page globals; concept and PR share FAQs and most page globals; PR owns speakers and site settings. Matrix: [`../editors/README.md`](../editors/README.md).
- Publishing **and unpublishing** are restricted to Heads (and Admins); editors work in drafts. The gate is symmetric on purpose: taking a live page down is the same editorial act as putting one up. It reads the live row rather than the hook's `originalDoc`, because Payload passes the latest _version_ there and a pending draft would otherwise disable the check.
- Version history is scoped like the documents it belongs to (`access.readVersions`). Left unset, Payload grants version reads to any logged-in user, which would expose every division's unpublished drafts and the admin-only Legal text.

## Content lifecycle

- **Drafts before publish:** edits are drafts; only approvers publish (`requireApproverToPublish`). A deeper per-division review step is still owed ([section 9](09-architecture-decisions.md)).
- **Audit trail:** every draft-enabled collection/global records who last edited and who last published (email + timestamp). Hooks stamp after the publish gate; fields are not client-writable. Editors see this in the sidebar, Versions tab, list columns, and (Heads) Publish audit. Content-sync strips audit keys on ingest so packages cannot spoof publishers.
- **Agent / maintainer propose:** `POST /api/content-sync` may upsert **draft versions only** as the operator's own Workspace user (stamped `@agent.q-summit.com` so the changelog reads "(agent)"); it never publishes or deploys. `POST /api/content-sync/media` may create **new** Media rows (same token and actor; create-if-missing; never overwrite or delete). Media create is live the same way an editor upload is; page attachments still need propose + Publish ([section 6](06-runtime.md), [`../dev/content-sync.md`](../dev/content-sync.md)).
- **Editions:** some collections carry a year field. Full create-alongside / archive rollover is still owed ([section 9](09-architecture-decisions.md)).
- **Media:** images upload through Payload into R2 (editors create; admins update/delete so one division cannot overwrite another's assets). The site references `/media/<filename>` (Worker → R2); binaries are never committed. Large hero/hack video is seeded into R2 outside the image-only Media allowlist. Deletion is additionally guarded by reverse reference: a `beforeDelete` hook resolves every collection and global pointing at the file (`apps/cms/src/lib/media-usage.ts`) and refuses while any live or draft entry still uses it. The same loader backs the "Used on" panel on a media document and the `/media-usage` admin view. It covers published rows plus the latest draft, not older version rows, so a delete can still orphan a restorable version; the UI says so in all three places.
- **Structure is code, content is CMS:** page layouts and components live in `apps/web`; every user-visible string comes from the content layer (Payload in production; a local JSON snapshot or the committed fake fixture in JSON mode). No literal marketing copy in `.astro` files. The homepage Event JSON-LD dates now come from a real CMS field too (`event.startDate` / `event.endDate` on the Home page global); `pages/index.astro` only formats them. They were previously regex-parsed out of the hero announcement copy, which meant a routine rephrasing failed the build.
- **Page globals (12):** one drafts-enabled `page-*` global per public marketing page. Slugs: `page-home` (`/`), `page-whyq` (`/whyq/`), `page-speaker` (`/speaker/`), `page-partner` (`/partner/`), `page-program` (`/program/`), `page-hackathon` (`/hackathon/`), `page-our-team` (`/our-team/`), `page-jobs` (`/job-listings/`), `page-tickets` (`/ticket-categories/`), `page-contact` (`/contact/`), `page-past-teams` (`/past-teams/`), and **`page-kickoff` (`/kickoff/`, Join Q / Kickoff)**. PR and Concept share most pages; Partner owns `page-partner` and `page-jobs`. Payload registers 14 globals in total: these 12, plus `site-settings` and `legal`. A CMS-mode site build treats a missing `page-kickoff` (404 before the CMS migration is live) as an empty page rather than failing the whole deploy.
- **Site Settings Kickoff flags** (PR-owned group `kickoff` on `site-settings`): `pageEnabled` makes `/kickoff/` a public route; `redirectRoot` forwards `/` there when the page is on (ignored while it is off). Both bake in at build time. Off `pageEnabled` means the public path 404s; Live Preview still works.
- **Join Q speaker cards** take portrait crop (`crop.x` / `y` / `zoom` / `shiftY`) and the optional location-card badge (`kickoff.ui.registerLabel` + `registerHref`) from `page-kickoff`. An empty label hides the pill. A URL turns the pill into an outbound link (Luma or similar); no third-party embed. Code must not key crops or copy to speaker names.
- **Semantic fields:** editors see named fields (`home.hero.headline`, ticket tiers, and so on), not scrape-shaped positional headings. Deterministic `order` fields on every ordered list collection keep list order stable across CMS and JSON mode; seeds space them in steps of 10 so editors insert between neighbors without renumbering.
- **Legal globals:** imprint / privacy / terms stay raw HTML, admin-only, never rich-text converted.

## Crosscutting rules

- No cookies, no third-party CDNs, no consent-requiring embeds; every asset is self-hosted. This keeps the site consent-banner-free ([ADR-0003](../decisions/0003-posthog-cookieless-analytics.md)) and it is a review gate, not a preference.
- Personal data in the CMS (speakers, team, contact persons) must stay answerable, exportable, and deletable per GDPR; DPAs with sub-processors are tracked offsite.
- Published URLs are permanent: when a page moves, add an explicit redirect in the site config in the same PR; never leave a dead public path.
- The site never fetches from the CMS at runtime; all content is baked in at build time.
- **Type-mirror contract:** the `Cms*Doc` interfaces in `apps/web/src/lib/content.ts` are hand-written mirrors of the Payload schema; `apps/cms/src/payload-types.ts` is the generated authority, and `apps/web` deliberately does not import it (the two apps build in isolation). Any PR that renames, removes, or retypes a Payload field must update the matching `Cms*Doc` interface and mapper in `content.ts` in the same PR, or CMS-mode builds silently map the field to `undefined` with no type or test failure.

## Discoverability (SEO, social, LLM)

Hybrid model: **identity is curated in CMS; pages stay the source for blurbs and full text.** Editor guides: [`../editors/llms.md`](../editors/llms.md) (AI index) and [`../editors/seo.md`](../editors/seo.md) (search and social).

| Surface | Implementation | Content source |
| --- | --- | --- |
| HTML meta + Open Graph + Twitter | `apps/web/src/layouts/Base.astro` | Page `title` / `metaDescription`; site `siteTitle` / footer `tagline`; default OG image `/media/hero-poster.jpg` |
| Sitemap | `@astrojs/sitemap` (`astro.config.mjs` `site`) | All prerendered routes |
| `robots.txt` | `apps/web/public/robots.txt` | Static allow-all + named AI bots; points at sitemap |
| `/llms.txt` identity | `apps/web/src/lib/llms.ts` | **Site Settings → `llms`** (`summary`, `pitch`, `keyFacts`, `lastReviewed`); empty `summary`/`pitch` fall back to footer tagline / home hero tagline |
| `/llms.txt` page links | same | Each page `metaDescription` + curated route table in `llms.ts`. `/kickoff` is listed under Optional only when Site Settings `kickoff.pageEnabled` is on |
| `/llms-full.txt` | `apps/web/src/pages/llms-full.txt.ts` via `llms.ts` | Main page sections from the content layer (not every nested block; no legal HTML). Kickoff adds a short hero / spotlight / application heading block when `pageEnabled`; the quiz is omitted |
| JSON-LD | `apps/web/src/components/seo/JsonLd.astro` + page usage | Real content fields only; no invented facts |

Page SEO is `title` + `metaDescription` via `seoFields()`. Site Settings → `llms` holds AI identity only ([llmstxt.org](https://llmstxt.org/) index + community `/llms-full.txt`). Route lists in `llms.ts` stay hand-curated; update that table in the same PR as a new public Astro route. Kickoff is flag-gated: `buildRouteTable` reads `site-settings.kickoff.pageEnabled`.
