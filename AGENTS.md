# AGENTS.md

The website for [Q-Summit](https://q-summit.com): Astro static site on Cloudflare, Payload CMS on Vercel + Neon, cookieless PostHog EU, Workers Builds deploys, and Google-only prod SSO with group roles decided ([ADR-0001](docs/decisions/0001-astro-static-site.md), [ADR-0002](docs/decisions/0002-payload-cms-on-vercel-neon.md), [ADR-0003](docs/decisions/0003-posthog-cookieless-analytics.md), [ADR-0004](docs/decisions/0004-cloudflare-workers-builds-deploy.md), [ADR-0005](docs/decisions/0005-google-sso-group-roles.md), [ADR-0006](docs/decisions/0006-content-source-required.md); PostHog client still owed; publish → deploy hook shipped). **Content truth is Payload** (drafts + approver Publish); production builds read it with `CONTENT_SOURCE=cms`. **No real website content lives in git**: Q internals get remote-CMS creds from a maintainer (gitignored `apps/cms/.env.remote`, shared out-of-band) and work via `make pull` / `make propose`; without creds, everything runs on the committed fake fixture (`apps/web/test/fixtures/ci-content/`), which seeds and CI-builds by default. Content packages are transfer artifacts, never git source of truth. `docs/architecture/` is current system truth. Nested `AGENTS.md` files merge with this one; closest wins on conflict.

## Where to look

| Task | Go to |
| --- | --- |
| Doc homes (dev / editors / architecture / decisions) | [`docs/README.md`](docs/README.md) |
| Scripts overview (main / ops / admin, Make↔pnpm, who may run) | [`docs/dev/scripts.md`](docs/dev/scripts.md) |
| Architecture truth (arc42) | [`docs/architecture/`](docs/architecture/) |
| Local workbench how-to | [`docs/dev/local-development.md`](docs/dev/local-development.md) |
| Content pull / propose runbook | [`docs/dev/content-sync.md`](docs/dev/content-sync.md) |
| Production go-live (CF + Vercel keys) | [`docs/dev/go-live.md`](docs/dev/go-live.md) |
| Other maintainer how-tos | [`docs/dev/`](docs/dev/) |
| Editor handbook | [`docs/editors/`](docs/editors/) |
| Astro / Worker | [`apps/web/AGENTS.md`](apps/web/AGENTS.md) |
| Visual identity (tokens, color, layout, components) | [`apps/web/DESIGN.md`](apps/web/DESIGN.md) |
| CMS admin visual system (Payload surfaces) | [`apps/cms/DESIGN.md`](apps/cms/DESIGN.md) |
| Payload schema / access | [`apps/cms/AGENTS.md`](apps/cms/AGENTS.md) |
| Human contributing | [`CONTRIBUTING.md`](CONTRIBUTING.md) |

Do not nest AGENTS under `scripts/` or `.github/`. Script folders by purpose: `local/`, `content/`, `check/`, `preview/`, `ops/` (+ `lib/`). Catalog: [`docs/dev/scripts.md`](docs/dev/scripts.md).

## Agent quick card

```text
Default:   make setup && make dev ; make check before finish.
           Local Postgres + MinIO volumes persist; seed-if-empty only on empty DB.
           Astro reads local Payload (CONTENT_SOURCE=cms). Escape hatch: make dev-web (JSON).
Content:   docs/dev/content-sync.md: pull (read-only down) / propose (drafts only up)
Scripts:   docs/dev/scripts.md (local/ content/ check/ preview/ ops/; update catalog same PR)
Make flags: make propose ARGS='--local --dry-run'  or  pnpm content:* -- …
After propose: tell human drafts await approver Publish. No Publish. No wrangler deploy.
Never: Neon / ops:mirror-db / ops:cms-remote / _status published / sync users|legal
```

## Commands

Node `>=22.19`, pnpm `>=10` (pinned in `package.json` `packageManager`). Make is a zero-arg front door; pass flags with `ARGS='…'` or `pnpm content:* -- …`.

```sh
make setup
make dev                                  # default: local DB + CMS + Astro (persists)
make pull                                 # published REST → current/ (read-only down)
make package                              # alias: content:export from local CMS only
make propose                              # drafts via /api/content-sync (up only)
make propose ARGS='--dry-run'
make dev-web                              # escape hatch: JSON, no Docker/CMS
make preview
make check                                # full gate (also pre-push + CI); still JSON until cutover
pnpm run check:fast                       # docs + design + scripts tests (pre-commit)
pnpm run check:docs
pnpm run check:design
pnpm run check:scripts
pnpm run format
```

Hooks (via `setup`): **pre-commit** → `check:fast` (docs structure, then markdownlint / cspell / prettier / design / cms-styles / scripts tests in parallel); **pre-push** → full `check` (fast, then web and cms in parallel; build overlaps tests where safe). CI runs full `check`. Agents always finish with full `make check` / `pnpm run check`, never `check:fast` alone.

## Agents MAY

- `make pull`, `make propose` (drafts only; propose is not TTY-gated)
- `make package` / `content:export` only for the **local CMS export** loop (never after a pull)
- `make setup`, `make dev`, `make dev-web`, `make preview`, `make check`
- `pnpm dev:web:remote` for read-only published text

## ALWAYS

- Same-PR: update every doc, diagram, and index your change invalidates. Script add/move/rename: place it in the matching purpose folder (`local/`, `content/`, `check/`, `preview/`, `ops/`), extend `scripts/lib/`, update [`docs/dev/scripts.md`](docs/dev/scripts.md) + `package.json` / Make in the same PR.
- English only. No em/en dashes. No spaced hyphen as dash punctuation in docs or UI text (in code comments, a spaced double hyphen is the accepted idiom).
- Spell check flags a real word: add it to `words` in `cspell.config.yaml` (sorted), never an inline disable.
- `pnpm run format` covers source as well as docs (`ts,tsx,astro,css` alongside `md,json,jsonc,yml,yaml,mjs`); `.astro` needs `prettier-plugin-astro`, wired in `.prettierrc.json`. Generated files are exempt in `.prettierignore` (`payload-types.ts`, `migrations/*.ts`, `importMap.js`, `worker-configuration.d.ts`, `env.d.ts`, `apps/cms/tsconfig.json`); never reformat those by hand, and never remove an exemption to make a diff smaller.
- Mermaid via **docs-diagrams**; agent guide edits via **agent-files**; SEO/llms/social via **discoverability**; styling, tokens, and `ui/` primitives via **design-system** (`.agents/skills/`). **design-system** covers `apps/web` only; CMS admin styling follows Payload's tokens per [`apps/cms/DESIGN.md`](apps/cms/DESIGN.md).
- Pin GitHub Actions to a full commit SHA with a trailing `# vX.Y.Z` comment.
- New workflows: least-privilege `permissions:`. Quality gates extend `pnpm run check`, never a parallel workflow. Treat workflow-lint findings as blocking even when path-filtered.
- Run `pnpm run check` (full). Do not assume failures are unrelated. Do not finish on `check:fast` alone.
- After propose, tell the human drafts are ready for an approver; do not Publish.
- Report vulns privately ([`SECURITY.md`](SECURITY.md)).

## PREFER

- Small, reviewable diffs; boring documented tech; match nearby patterns.
- Branch prefixes `feat/` `fix/` `docs/` `adr/` `ci/`; PR titles `feat:` `fix:` `docs:` `ci:` `chore:` ([`CONTRIBUTING.md`](CONTRIBUTING.md)).
- Links over copying docs. Obvious fake sample data.
- Stack is decided (Astro static + Payload 3 + Neon + R2 + PostHog EU); new vendors need an ADR.
- Local workbench: `make dev` (Payload + Astro CMS mode against Docker volumes). Use `make dev-web` only when you need JSON without Docker.
- Remote content: follow [`docs/dev/content-sync.md`](docs/dev/content-sync.md). Pull is read-only down; propose is drafts only up. Edit `bundle.json` only. Dry-run before write.
- Scoped packages (`--collections` / `--globals`); upsert keys in content-sync.md; media by filename.

## NEVER

- Commit secrets, tokens, `.env` files, or database URLs. Day-to-day remote creds (`REMOTE_CMS_URL`, `CONTENT_SYNC_TOKEN`) live only in gitignored `apps/cms/.env.remote`; `REMOTE_DATABASE_URI` is never written to a file, export it in the shell per use for break-glass ops scripts only.
- Add cookies, third-party CDNs, or consent-requiring embeds ([`docs/architecture/08-concepts.md`](docs/architecture/08-concepts.md)).
- Publish on remote (`_status: published`), use approver credentials, or treat content packages as git source of truth (Payload is; packages are transfer artifacts under gitignored `scripts/content-packages/`).
- Run `wrangler deploy`, hit a Cloudflare deploy hook, or otherwise promote production from agent workflows. `make preview` is local only.
- Invent or document a SQL/`pg_restore` / `data:push` write path to production. Draft-only `POST /api/content-sync` is the only automated remote content write.
- Hold or use `REMOTE_DATABASE_URI` / Neon for day-to-day work. Prefer `make pull` over `pnpm ops:mirror-db`.
- Run `ops:cms-remote`, `ops:mirror-db`, or `ops:mirror-media` (under `scripts/ops/`) non-interactively (TTY human-confirm required).
- Weaken `requireApproverToPublish*`, division scoping, or the content-sync allowlist; never sync `users` or `legal` via packages.
- Invent GitHub labels (only `.github/admin/setup-labels.sh`).
- Put day-to-day tooling one-shots under `scripts/` (GitHub admin → `.github/admin/`; Neon/R2 break-glass → `scripts/ops/` only).
- Reformat `LICENSE.md` / `LEGAL.md` (see `.prettierignore`).
- Put shared rules only in `CLAUDE.md` (they belong in `AGENTS.md`).
- Add workspace packages beyond `apps/web` and `apps/cms` without an ADR; nest AGENTS+CLAUDE and wire `pnpm run check` in the same PR.
- Hand-edit generated content JSON that `build-page-content.mjs` owns (exception: the curated `llms` block in site-settings; see apps/web AGENTS).
