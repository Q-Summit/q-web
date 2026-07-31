# Scripts index

Purpose-named folders, one per concern. Implementation source of truth is root `package.json`; `Makefile` is the zero-arg front door (`ARGS='…'` for flags).

Agent MAY/NEVER: root [`AGENTS.md`](../../AGENTS.md). Maintainer scars: [`docs/dev/AGENTS.md`](AGENTS.md) (not under `scripts/`). Procedures: [`local-development.md`](local-development.md), [`content-sync.md`](content-sync.md). One-shot GitHub admin: `.github/admin/` (not here).

## Layout (decision)

| Folder | Purpose | pnpm prefix / examples |
| --- | --- | --- |
| `lib/` | Shared helpers only (not CLIs) | imported by other scripts |
| `local/` | Day-to-day workbench | `setup`, `setup:chrome`, `dev`, `reset:local`, `dev:web:remote` |
| `content/` | Content package transfer | `content:*` |
| `check/` | Quality gates | `check:*`, `lighthouse` |
| `preview/` | Local Cloudflare-shaped preview | `r2:sync`, `preview:cf`, `picture:sync` |
| `ops/` | Human TTY break-glass (Neon / remote CMS admin) | `ops:mirror-db`, `ops:cms-remote` |
| `content-packages/` | Transfer artifacts (gitignored working dirs + examples) | not source of truth |

Rule: new CLI goes in the folder that matches its purpose; file name matches the pnpm suffix (`check:docs` → `check/docs.mjs`). Extend `lib/`; do not copy helpers. Wire `package.json` (+ Make if day-to-day) and update this page in the same PR.

## Content package vs ops mirror (do not confuse)

Full comparison table: [`content-sync.md`](content-sync.md#content-package-vs-ops-mirror).

`make pull` is **only** `content:pull`. There is no Make target for Neon mirroring.

```text
scripts/
  lib/                 paths, run, args, env, s3, human-confirm, …
  local/               setup, ensure-chrome, dev, assert-db, reset, web-remote
  content/             pull, export, import, propose, sync-scope
  check/               fast, docs, design, cms-styles, build-web, budgets, lighthouse*, vrt-report, vrt-cleanup, run-parallel, scripts.test
  preview/             r2-sync, seed-local-r2, serve, cf, sync-picture-assets
  ops/                 mirror-db, mirror-media, cms-remote
  content-packages/    current/ (gitignored) + examples/
```

`lighthouse*` = `lighthouse.mjs` + `lighthouse-report.mjs` + `lighthouse-urls.mjs`.

## Pick a path

| You need… | Do this |
| --- | --- |
| Local workbench (default) | `make setup` → `make dev` → `make check` |
| Site only, no Docker | `make dev-web` (JSON escape hatch) |
| Remote published text (read-only, no local CMS) | `pnpm dev:web:remote` |
| Content drafts (down then up) | [`content-sync.md`](content-sync.md): `make pull ARGS='--collections faqs'` → edit `bundle.json` → `make propose` |
| Local CF Worker + media | `make preview` |
| Mobile Lighthouse (Q1) | `make lighthouse` → read `.lighthouse/AGENT.md` (local). Format: [`.lighthouse/README.md`](../../.lighthouse/README.md) + [`AGENT.example.md`](../../.lighthouse/AGENT.example.md) |
| Visual regression (advisory PR review) | Runs in `.github/workflows/visual.yml` (comment + hosted report); local compare `pnpm --filter web run vrt:docker`; accept via AUTO / the `Update visual baselines` workflow / `vrt:docker:update`. Guide: [`visual-testing.md`](visual-testing.md) |
| Wipe local DB volumes | `make reset-local` (human TTY) |
| Neon / R2 / remote CMS admin (break-glass) | `pnpm ops:mirror-db` / `ops:mirror-media` / `ops:cms-remote` (prefer `make pull` for text) |
| New GitHub labels / repo settings | `.github/admin/` |
| Add a root script | Put it in the matching folder; extend `lib/`; update this page |

## Agent routing

| Band | Commands | Notes |
| --- | --- | --- |
| Agent OK | `make setup`, `setup-chrome`, `dev`, `dev-web`, `preview`, `lighthouse`, `check`, `pull`, `propose`, `package` (local export only) | Finish with full `make check`. Propose = drafts only. |
| Agent OK (read-only remote text) | `pnpm dev:web:remote` | Published REST; no Neon. |
| Humans only (TTY) | `make reset-local`; `pnpm ops:mirror-db`, `ops:mirror-media`, `ops:cms-remote` | Prefer `make pull` over Neon. |
| Never from agents | Publish, `wrangler deploy`, Neon day-to-day, `data:push` | See root AGENTS NEVER. |

## Make ↔ pnpm ↔ script

| Make | pnpm | Script |
| --- | --- | --- |
| `setup` | `setup` | `local/setup.mjs` |
| `setup-chrome` | `setup:chrome` | `local/ensure-chrome.mjs` |
| `dev` | `dev` | `local/dev.mjs` |
| `dev-web` | `dev:web` | (filter web) |
| `seed` | `seed` | cms seed bins + `local/assert-db.mjs` |
| `reset-local` | `reset:local` | `local/reset.mjs` |
| `package` | `content:export` | `content/export.mjs` |
| `pull` | `content:pull` | `content/pull.mjs` |
| `propose` | `content:propose` | `content/propose.mjs` |
| `preview` | `r2:sync` + `preview:cf` | `preview/r2-sync.mjs`, `preview/cf.mjs` |
| `lighthouse` | `lighthouse` | `check/lighthouse.mjs` |
| `check` | `check` | `check/fast.mjs` then `check/run-parallel.mjs` |
| `check-fast` | `check:fast` | `check/fast.mjs` |
| `db-up` / `db-down` | `db:up` / `db:down` | docker compose |

Also (pnpm only): `content:import`, `content:fixture`, `picture:sync`, `seed:local-r2`, `dev:web:remote` → `local/web-remote.mjs`, `check:docs`, `check:design`, `check:cms-styles`, `check:scripts`, `check:lint`, `check:md`, `check:spell`, `check:web` / `check:cms` (and their `:build` / `:test` / `:types` sub-gates), `test`, `format`, `format:check` (both cover `md,json,jsonc,yml,yaml,mjs,ts,tsx,astro,css`; generated files are exempt in `.prettierignore`).

## Shared lib rules

- Import from `lib/paths.mjs`, `lib/run.mjs`, `lib/args.mjs` (no private `fileURLToPath` root walks).
- Env file parsing and hostname checks: `lib/env.mjs`.
- Parallel gates: `check/run-parallel.mjs` / `lib/run.mjs`.
- Human-only remote: `lib/human-confirm.mjs`.
- S3 from cms deps: `lib/s3.mjs` only.
- Local Payload package bins: `lib/local-payload.mjs`.
- Seed-if-empty: `lib/seed-if-empty.mjs` (called by `local/dev.mjs`, not a CLI).

## Per-folder map

### `local/`

| File | Role |
| --- | --- |
| `setup.mjs` | Hooks, skills symlink, env bootstrap, Chrome-for-Testing, docs validate |
| `ensure-chrome.mjs` | Download Chrome-for-Testing into `.browsers/` (`setup:chrome`) |
| `dev.mjs` | Docker + assert-db + seed-if-empty + CMS + Astro CMS mode |
| `assert-db.mjs` | Refuse non-local `DATABASE_URI` |
| `reset.mjs` | Human TTY: wipe volumes + reseed |
| `web-remote.mjs` | Astro against remote published REST (read-only) |

### `content/`

| File | Role |
| --- | --- |
| `make-fixture.mjs` | Maintainer snapshot (`--from <dir>`) → committed fake CI fixture (`content:fixture`; rerun after content-schema changes) |
| `pull.mjs` | Published REST → JSON package (`make pull`; not Neon). Sidecar files only with `--sidecars`; `bundle.json` is the only propose input |
| `export.mjs` | Local CMS published state → package (drafts ignored). Sidecar files only with `--sidecars` |
| `import.mjs` | Package → local drafts |
| `propose.mjs` | Package → `/api/content-sync` drafts |
| `sync-scope.mjs` | Allowlist (parity with cms keys) |

### `check/`

| File | Role |
| --- | --- |
| `fast.mjs` | Docs structure, then md/spell/prettier/design/cms-styles/scripts-tests in parallel |
| `docs.mjs` | Structural docs / AGENTS pairing / house style |
| `design.mjs` | apps/web: DESIGN.md ↔ tokens ↔ citations ↔ baseline |
| `cms-styles.mjs` | apps/cms admin: no inline style objects, `custom.css` stays on Payload tokens (`check:cms-styles`) |
| `build-web.mjs` | Fixture build, failing on any content warning (part of `check:web:build`); `WARNING_TAG` must list every tag apps/web can emit, and `scripts.test.mjs` enforces that |
| `budgets.mjs` | Dist asset caps + share-image size/dimensions (part of `check:web:build`) |
| `lighthouse.mjs` | Local mobile Lighthouse vs CF-shaped preview (`make lighthouse`; not in CI) |
| `lighthouse-report.mjs` | Agent findings from LHR (CWV bands, CLS/LCP, opportunities) |
| `lighthouse-urls.mjs` | Default audit routes |
| `scripts.test.mjs` | Root scripts unit + fail-closed smoke (`check:scripts`) |
| `vrt-report.mjs` | Playwright JSON into the sticky PR comment; AUTO stages refreshed baselines (advisory `visual.yml`, not in `check`) |
| `vrt-report.test.mjs` | Unit tests for `vrt-report.mjs` (`check:scripts`) |
| `vrt-cleanup.mjs` | Sweep closed PRs' Cloudflare Pages VRT reports (advisory `visual-cleanup.yml`) |
| `run-parallel.mjs` | CLI: parallel `pnpm run` scripts |

### `preview/`

| File | Role |
| --- | --- |
| `r2-sync.mjs` | MinIO (+ public/media seed) → wrangler local R2 |
| `seed-local-r2.mjs` | public/media → wrangler local R2 without MinIO (`seed:local-r2`) |
| `serve.mjs` | Programmatic wrangler / astro preview (used by Lighthouse) |
| `cf.mjs` | Build + wrangler dev on a free port |
| `sync-picture-assets.mjs` | Hardlink `public/media` images → `src/assets/media` for local `<Picture>` |

### `ops/` (break-glass; not Make targets; not content packages)

| pnpm | File | What |
| --- | --- | --- |
| `ops:mirror-db` | `mirror-db.mjs` | Neon → local Docker (keeps the newest 5 dumps under `scripts/backups/`; `REMOTE_DATABASE_URI` is exported in the shell per use, never stored in a file) |
| `ops:mirror-media` | `mirror-media.mjs` | R2 → MinIO |
| `ops:cms-remote` | `cms-remote.mjs` | Payload admin on real Neon |

### One-shots (not under `scripts/`)

| Path                            | Role                                   |
| ------------------------------- | -------------------------------------- |
| `.github/admin/setup-repo.sh`   | Idempotent GitHub repo settings        |
| `.github/admin/setup-labels.sh` | Label scheme (only invent labels here) |

App-local: `apps/web/scripts/build-page-content.mjs` (see `apps/web/AGENTS.md`).
