# Local development

Maintainer how-to for the Astro site, Payload CMS, and Cloudflare-shaped media stack. Topology: [`../architecture/`](../architecture/). Content pull / propose: [`content-sync.md`](content-sync.md). Production CF/Vercel steps: [`go-live.md`](go-live.md).

Agent MAY/NEVER and the quick card live in root [`AGENTS.md`](../../AGENTS.md). Script catalog (lib, Make↔pnpm, who may run what): [`scripts.md`](scripts.md). This page is the local workbench procedure; package security and upsert keys live in content-sync.

## Prerequisites

- Node `>=22.19` and pnpm `>=10` (exact pnpm in root `package.json` `packageManager`)
- Docker Compose (Postgres + MinIO)
- Optional media: gitignored `apps/web/public/media/` (seed CMS / `r2:sync`) or `pnpm ops:mirror-media` (humans only). Never commit binaries; prod serves R2.

```sh
make setup
make check          # full gate (also runs on git push + CI)
pnpm run check:fast # docs structure + md/spell/prettier/design/cms-styles/scripts-tests (pre-commit; not a finish gate)
make lighthouse     # local mobile Lighthouse (Q1); needs Chrome-for-Testing from setup
```

`make setup` copies `apps/cms/.env.example` to `.env` when missing, and downloads Chrome-for-Testing into gitignored `.browsers/` (one-time, ~150 MB) so `make lighthouse` works without a system Chrome install. Set `PAYLOAD_SECRET`. Replace example `CONTENT_SYNC_USER_EMAIL=dev@…` with `<you>@q-summit.com` (CMS rejects `dev`), then seed so that user exists locally. Hooks: pre-commit → `check:fast`; pre-push → full `check`. Override the browser with `CHROME_PATH=/path/to/chrome` if you prefer a system install (`pnpm run setup:chrome` re-runs the download alone).

## Default loop

| Goal | Command |
| --- | --- |
| Local workbench (default) | `make dev` |
| Site only, no Docker (escape hatch; fake fixture content) | `make dev-web` |
| Wipe local DB volumes + reseed | `make reset-local` |
| Quality gate | `make check` |
| Mobile Lighthouse (Q1) | `make lighthouse` |
| Visual regression vs baselines (pinned Playwright image) | `pnpm --filter web run vrt:docker` |
| Accept visual baselines (pinned image) | `pnpm --filter web run vrt:docker:update` |

Visual regression is advisory CI, not part of `make check`. Variants, accepting baselines, and the PR comment: [`visual-testing.md`](visual-testing.md).

`make dev` starts Postgres + MinIO, seeds if the users table is empty, then runs Payload (`:3000`) and Astro CMS mode (`:4321`). If ports 5433/9000/9001 are taken by another project's containers, `assert-db.mjs` detects the foreign compose project and fails loudly naming the container's working directory; reuse that stack only if it is this repo's (same creds as `.env.example`), otherwise stop it and re-run `make dev` / `pnpm db:up`. `pnpm seed` and CMS `predev` run `scripts/local/assert-db.mjs`.

### Local data persistence

Docker named volumes (`qweb-pg-data`, `qweb-minio-data` in `docker-compose.yml`) keep Postgres and MinIO across `make dev` restarts, Ctrl+C, and `pnpm db:down` / `pnpm db:up`. Stopping the workbench does **not** wipe content. Seed runs only when the users table is missing or empty (`seed-if-empty`); your local edits stay until you deliberately wipe.

Wipe + reseed: `make reset-local` (human TTY; `docker compose down -v`).

Real website content is never in git. A fresh clone seeds the committed fake fixture (`apps/web/test/fixtures/ci-content/`); `make dev` gives a working workbench with no extra setup, and the seed log marks the data as fake. Q internals working on real content get the remote CMS values (`REMOTE_CMS_URL`, `CONTENT_SYNC_TOKEN`, `CONTENT_SYNC_USER_EMAIL`) from a maintainer out-of-band; they live only in gitignored `apps/cms/.env.remote` and are never committed. Pull real content into the local CMS with `make pull ARGS='--import'`: it upserts drafts only for docs that differ and leaves the rest untouched ([content-sync.md](content-sync.md)). Media binaries do not live in git. Propose can upload files from gitignored `current/media/` (or `--media-dir`); pull/import still skip docs whose media the local CMS lacks, so missing images are expected after a text-only pull. Day-to-day remote sync is packages, not a Neon dump; [Content packages](#content-packages) below has the down/up commands.

Set `SITE_URL=http://localhost:4321` in `apps/cms/.env` so Live Preview iframes the local Astro site (that is the default if unset). Production sets `SITE_URL=https://q-summit.com` on Vercel and `PUBLIC_CMS_URL=https://cms.q-summit.de` on the site build. In the Payload admin, open any **Website pages** global → click the **Live Preview** toggle (eye icon) so the side-by-side iframe appears; nodes marked `data-lp` update as you type. Collection grids (speakers, FAQs, partners) still come from published build data and do not live-update from a page-global edit.

Which content the site builds from:

| Mode | How | When |
| --- | --- | --- |
| CMS | `CONTENT_SOURCE=cms` + `CMS_URL` + `PUBLIC_CMS_URL` | Local default (`make dev`); prod after cutover |
| JSON | `CONTENT_SOURCE=json`; committed fake fixture, or an emergency-restored `apps/web/content/` | `make dev-web` escape hatch; emergency builds |
| JSON fixture | `CONTENT_SOURCE=json` + `WEB_CONTENT_DIR=test/fixtures/ci-content` | `make check` / CI build gate (`check:web:build`); regenerate with `pnpm content:fixture` |

`CONTENT_SOURCE` is required: unset or unrecognized fails the build rather than quietly picking a source. In CMS mode `PUBLIC_CMS_URL` is required too (the Live Preview origin check). `WEB_CONTENT_DIR` pins the JSON directory, which is why the fixture gate stays the fixture gate even on a machine that has the real snapshot restored at `apps/web/content/`.

### Local accounts (after seed)

| Email | Password | Role |
| --- | --- | --- |
| `admin@example.com` | `localdev-admin1` | admin |
| `approver@example.com` | `localdev-approver1` | approver (Publish) |
| `partner-team@example.com` | `localdev-partner1` | editor |
| `<you>@q-summit.com` | `localdev-sync1` | from `CONTENT_SYNC_USER_EMAIL` (local stand-in for your Google user) |

Local dev uses these seeded email/password logins and the normal login form, and needs no Google credentials by default: Google sign-in stays disabled until its env is set ([ADR-0005](../decisions/0005-google-sso-group-roles.md), [go-live](go-live.md#google-sso-setup)).

### Test Google sign-in locally

The same Google flow that runs in production can be exercised against the local workbench; with `GOOGLE_*` set, the login page shows only **Continue with Google** (the password form is hidden in the UI; the local strategy stays in the schema so schema-push does not drop password columns).

1. On the Google Cloud OAuth client (or a separate dev-only client), add the redirect URI `http://localhost:3000/api/users/oauth/google/callback`.
2. Copy the `GOOGLE_*` values from [go-live](go-live.md#google-sso-setup) into `apps/cms/.env` (gitignored; the service-account key is a real secret, treat the file accordingly).
3. Restart `make dev` and use **Continue with Google** on `localhost:3000` (or `/login`). Group membership drives roles/divisions exactly as in production, including the refusal of accounts in no mapped group; sign out and back in to pick up group changes.

To try a different mapping without touching Workspace groups, set `GOOGLE_GROUP_MAP` in `apps/cms/.env` (format: `apps/cms/.env.example`).

## Content packages

Full runbook (env, upsert keys, failure modes, security): [`content-sync.md`](content-sync.md).

Working directory: **`scripts/content-packages/current/bundle.json`** (only file propose sends). Make is a front door; flags via `ARGS='…'` or `pnpm content:* -- …`.

- Down (read-only): `make pull` = `content:pull` (published REST → JSON package). Needs `REMOTE_CMS_URL` only. **Not** a Neon dump.
- Up (drafts only): `make propose` needs `CONTENT_SYNC_TOKEN`. Cannot publish or deploy the live site.
- Prefer `make dev` for the local workbench. Use `make dev-web` only when you want JSON without Docker/CMS.
- Do not run `make package` after pull.

## Media preview

```sh
make preview
```

Local preview is not a production deploy.

### Responsive images + Lighthouse (Q1)

CI and production builds leave `src/assets/media/` empty and fall back to plain `/media/…` `<img>` tags. Locally, after you have `apps/web/public/media/`:

```sh
pnpm picture:sync    # hardlink images into src/assets/media/ for Astro <Picture>
make lighthouse ARGS='--with-picture'  # measure that local Picture path
make lighthouse      # default: prod-shaped (no Picture sync) + CF + mobile Slow 4G
```

`make lighthouse` (after `make setup`):

1. Ensures Chrome-for-Testing (`.browsers/`)
2. Builds the fixture site **without** Picture sync by default (same markup as CI/prod)
3. Seeds **images** into wrangler local R2 (`seed:local-r2 --images-only`; skips video/HLS for speed)
4. Serves via **wrangler --local** (Assets + Worker `/media/*` -- same topology as prod)
5. Runs Lighthouse with shipped mobile defaults (moto g power, Slow 4G simulate, CPU 4x)
6. Writes agent-ready artifacts under `.lighthouse/` (gitignored except the shared contract):
   - **Shared:** [`README.md`](../../.lighthouse/README.md), [`AGENT.example.md`](../../.lighthouse/AGENT.example.md)
   - **Local after a run:** `AGENT.md` (agents read this), `summary.json`, `*.findings.json`, HTML/JSON reports

Flags: `make lighthouse ARGS='--skip-build --urls=/'`, `--with-picture`, `--mode=astro` (faster, no Worker), `--runs=3` (median), `--skip-seed`.

Portrait `/media/` URLs prefer `-p-800` keys when the local mirror is absent (`resolvePhotoMediaKey`), matching how R2 is seeded.

Full media including video: `pnpm r2:sync` (MinIO) or `pnpm run seed:local-r2` (no `--images-only`), then `make preview`.

## Remote access: two different tools

Content package vs break-glass mirror comparison: [`content-sync.md`](content-sync.md#content-package-vs-ops-mirror). Full remote-access tool list and agent bands (read-only REST, mirror-db/media, cms-remote): [`scripts.md`](scripts.md#agent-routing).

```sh
pnpm ops:mirror-db
pnpm ops:mirror-media
pnpm ops:cms-remote
```

## Also useful

```sh
make db-down
pnpm --filter web run cf-typegen
pnpm --filter cms run generate:types
pnpm --filter cms run generate:migrations
rm -rf apps/web/.wrangler
```
