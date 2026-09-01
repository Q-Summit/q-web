# apps/cms AGENTS.md

Payload 3 CMS on Next.js, hosted on Vercel with Neon Postgres ([ADR-0002](../../docs/decisions/0002-payload-cms-on-vercel-neon.md)). Extends the root [AGENTS.md](../../AGENTS.md); closest wins on conflict. The schema implements [docs/architecture/08-concepts.md](../../docs/architecture/08-concepts.md); a PR that changes the schema or access rules updates that chapter. Setup: [`docs/dev/local-development.md`](../../docs/dev/local-development.md), content packages: [`docs/dev/content-sync.md`](../../docs/dev/content-sync.md), tooling catalog: [`docs/dev/scripts.md`](../../docs/dev/scripts.md), deploy/migrations: [`docs/dev/go-live.md`](../../docs/dev/go-live.md). Admin UI styling rules: [`DESIGN.md`](DESIGN.md).

## Commands

Run from the repo root:

```sh
make dev                                   # full local workbench (preferred)
pnpm db:up                                 # Postgres + MinIO first
pnpm --filter cms dev                      # local admin at localhost:3000/ (needs .env)
pnpm seed                                  # seed local DB from the fake fixture (local-DB guard)
make pull / make package / make propose    # packages in scripts/content-packages/current/
# flags: make propose ARGS='--dry-run'  or  pnpm content:propose -- --dry-run
# media: propose uploads current/media/ (or --media-dir) via /api/content-sync/media
# remote loop: pull → edit current/bundle.json → propose (do not export after pull)
pnpm --filter cms check                    # tsc --noEmit; no database required
pnpm --filter cms run generate:types       # refresh src/payload-types.ts after schema edits
pnpm --filter cms run generate:importmap   # refresh the admin import map after new admin components
pnpm --filter cms run generate:migrations  # after schema shaping; commit migrations/
pnpm --filter cms run migrate              # apply pending migrations (also Vercel build step)
pnpm run check:cms                         # typecheck + tests as wired into root pnpm run check
```

`dev` needs `DATABASE_URI` and `PAYLOAD_SECRET` in `apps/cms/.env` (template: `.env.example`).

Auth: production is Google-only SSO (`src/auth/google.ts`, payload-oauth2); the local email/password strategy is disabled when `NODE_ENV=production`. Google Workspace groups are the source of truth for `roles`/`divisions` and re-sync on every login; a login with no role-granting group is rejected before any user is created (a domain email alone grants nothing). The group mapping is the `cms-` naming convention by default, or an explicit `GOOGLE_GROUP_MAP` JSON override validated fail-fast at boot (`src/auth/google-groups.ts`). Local dev needs no Google env: SSO stays disabled and the seeded password accounts plus the normal login form keep working; setting the `GOOGLE_*` env in `apps/cms/.env` additionally enables the real Google flow locally ([`docs/dev/local-development.md`](../../docs/dev/local-development.md)). Setup (OAuth client, service account, groups): [`docs/dev/go-live.md`](../../docs/dev/go-live.md).

For local propose, also `CONTENT_SYNC_TOKEN` + `CONTENT_SYNC_USER_EMAIL` (`<you>@q-summit.com`; replace example `dev`). Remote propose uses the same actor header; that person must already exist in Payload (Google login once in prod). Remote: `.env.remote` with `REMOTE_CMS_URL` + `CONTENT_SYNC_TOKEN` + actor email; Neon `REMOTE_DATABASE_URI` is never written to a file, humans export it in the shell per use for TTY `pnpm ops:mirror-db` / `pnpm ops:cms-remote` (`scripts/ops/`; prefer `make pull` for text packages).

## Schema conventions

- Collections in `src/collections/`, one file per collection or global, registered in `src/payload.config.ts`.
- Access rules compose the helpers in `src/access/` (`divisionScoped`, `requireApproverToPublish`, `draftVersions`); add new rules there, not inline in collections.
- Every content collection keeps drafts enabled and the approver publish gate; editors save drafts, approvers publish.
- **Draft lists** use `draftCollection()` in `src/collections/base.ts` (mirrors `pageGlobal` for page globals): publish gate → `stampAuditTrail`, `auditFields` (API-locked), custom Versions tab with Edited by / Published by. Do not hand-copy that boilerplate onto a new list collection.
- **Globals** share one review-workflow builder: `reviewWorkflowGlobal()` in `src/globals/base.ts` holds the access/hook/versions wiring; `pageGlobal()` wraps it for page globals, and non-page globals (Site Settings, Legal) call it directly. Never hand-roll that wiring in a global.
- **Upsert keys are unique**: single-field keys carry `unique: true` (DB index); compound keys (speakers, team, faqs) go through `enforceUniqueKey` in `src/lib/unique-key.ts`. A new syncable collection needs one of the two plus a `keys.ts` entry.
- **URL fields** validate with `urlOrMailtoValidate()` from `src/lib/url-validate.ts`; registry-key fields consumed by apps/web code are `select` fields whose options mirror the code-side registry, never free text.
- **Ordered lists** take their sort position from `orderField()` in `src/lib/order-field.ts` (new docs land after the current last one; decimals allowed). Never hand-roll an `order` number field or switch a collection to Payload `orderable`: the internal `_order` column does not travel in content packages.
- Audit identity is email text on `lastEditedBy` / `lastPublishedBy` (not a Users relationship). Hooks stamp after the publish gate; content-sync strips these keys on ingest.
- **Field and collection descriptions are editor-facing UI copy**, not code comments. No `upsert`, `content-sync`, `doc`, `package`, or raw collection slugs in a `description`; put the rationale in a `//` comment beside it instead.
- **Page global layout** goes through `groupSection()` / `section()` in `src/globals/shared-fields.ts`, with `seoFields()` last, wrapped in `section("Search and social", …)`. `groupSection()` keeps the stored named group exactly as it is and only changes how it renders, so it needs no migration. Never restructure a page global by renaming or unwrapping a named group: that is a data-shape change.
- **Nav group order** lives in `src/lib/nav-groups.ts` (`NAV_GROUP_ORDER`), applied by the custom `src/components/nav.tsx`. Payload orders nav groups by first appearance in `[...collections, ...globals]`, so array order in the config cannot lift "Website pages" above the collections. A new `admin.group` string must be added to that list or it silently sorts to the bottom; `test/nav-groups.test.ts` fails if you forget. The custom Nav also drops the `beforeNav`, `afterNavLinks`, `afterNav`, `logout.Button` and `settingsMenu` slots: wiring one means adding it to that component too.
- **Media references** resolve through `src/lib/media-usage.ts`. A new upload field must be registered in `MEDIA_UPLOAD_FIELDS` (collections) or `MEDIA_GLOBAL_FIELDS` (globals) in the same PR, or the "Used on" panel and the `beforeDelete` guard will call a file unused while it is still in use. Join fields cannot do this job: Payload rejects them on globals.
- **Rich text** runs `lexicalEditor()` with the `upload` and `relationship` features removed. `apps/web/src/lib/lexical-html.ts` has no case for either, and an upload node hides a media id where `media-usage.ts` cannot see it. Re-enabling means teaching the renderer first, then the usage loader, then the feature.
- After changing any collection or global, run `generate:types` and commit the updated `src/payload-types.ts`. Schema shape changes that need prod also get a committed migration in the same PR.
- Seed scripts read the committed fake fixture (`seed/content-dir.ts`). Real content comes down via `make pull ARGS='--import'` with maintainer-shared remote creds, never from git. Keep `seed/site-settings.ts` mapped to every Site Settings field including `llms.*`.
- Page SEO: `seoFields()` → `title` + `metaDescription` only. AI identity: Site Settings → `llms` only. No per-page LLM blurb fields. Load **discoverability** when changing these. Guides: [`docs/editors/seo.md`](../../docs/editors/seo.md), [`docs/editors/llms.md`](../../docs/editors/llms.md).

## ALWAYS

- Model content per conference year (editions); past editions archive, never overwrite.
- Keep personal data (speakers, team, contacts) exportable and deletable per GDPR.
- Production migrations run at Vercel build (`migrate && build`); never rely on schema push in prod.

## NEVER

- Commit `.env`, `.env.remote`, or any real `DATABASE_URI`/`PAYLOAD_SECRET`/`CONTENT_SYNC_TOKEN`; credentials live in Vercel and Neon dashboards.
- Weaken the division scoping or the approver publish gate; they are the reason Payload was chosen (ADR-0002).
- Let content-sync publish, sync `users`/`legal`, overwrite or delete media, or call deploy/wrangler from those endpoints. Media create is upload-if-missing only (`POST /api/content-sync/media`). The actor is any real Workspace person (`<name.lastname>@q-summit.com`, resolved to their Payload user, stamped `@agent.q-summit.com` so the changelog reads "(agent)"); drafts-only is enforced by `forceDraftData` + `draft: true` on every package write, not by the actor role, so never relax those two.
- Use `overrideAccess: true` on content-sync **writes** (create/update/updateGlobal). Media filename lookup and sync-user load may use `overrideAccess: true`.
- Commit media binaries (`apps/cms/media/`, `apps/web/public/media/`, `apps/web/src/assets/media/*` except `*.ts`). Seed/upload into MinIO/R2; `bundle.json` carries filenames; binaries may sit in gitignored `scripts/content-packages/current/media/` for propose.
- Hand-edit generated files (`src/payload-types.ts`, `src/app/(payload)/importMap.js`); regenerate them. A stylesheet is not a registered component: adding CSS needs neither `generate:importmap` nor `generate:types`.
- Style an admin surface with inline `style={{}}` objects. Compose from the classes in `src/app/(payload)/custom.css` ([`DESIGN.md`](DESIGN.md)); `pnpm run check:cms-styles` enforces it.
- Schema-push against a remote database (`pnpm ops:cms-remote` in `scripts/ops/` sets `PAYLOAD_DB_PUSH=false` for a reason).
- Add per-page "LLM summary" fields parallel to `metaDescription`.
