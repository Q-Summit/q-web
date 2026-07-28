# q-web

The website for [Q-Summit](https://q-summit.com), Germany's largest student-organized startup conference.

## How it works

The public site is pre-built static HTML, served from Cloudflare's edge. Content lives in Payload CMS, where division members edit their own collections under personal, division-scoped accounts, with drafts and approver publish before anything goes live. Merges to `main` and approver Publish both rebuild the site through Cloudflare Workers Builds (Publish needs `CLOUDFLARE_DEPLOY_HOOK_URL` on the CMS). The live site never depends on the CMS being up.

| Layer     | Technology                   | Where                           |
| --------- | ---------------------------- | ------------------------------- |
| Site      | Astro (static output)        | Cloudflare (free plan)          |
| CMS       | Payload 3                    | Vercel Hobby                    |
| Database  | Postgres                     | Neon free tier, Frankfurt       |
| Media     | R2 object storage            | Cloudflare                      |
| Analytics | PostHog Cloud EU, cookieless | Decided; client not shipped yet |

Setup and cutover: [`docs/dev/go-live.md`](docs/dev/go-live.md).

Agents and maintainers can **propose** content packages as remote drafts via `make propose` (`POST /api/content-sync`); only human approvers Publish, and propose never deploys the site. Runbook: [`docs/dev/content-sync.md`](docs/dev/content-sync.md).

The full decision trail is in [`docs/decisions/`](docs/decisions/), starting with [ADR-0001](docs/decisions/0001-astro-static-site.md).

## Repository layout

| Path | Holds |
| --- | --- |
| `apps/web/` | Astro site, Worker, build-time JSON under `content/` |
| `apps/cms/` | Payload CMS (+ `/api/content-sync`) |
| `docs/` | Decisions, architecture, editor handbook, `dev/` how-tos |
| `scripts/` | Purpose folders: local, content, check, preview, ops ([catalog](docs/dev/scripts.md)) |
| `docker-compose.yml` | Local Postgres + MinIO |
| `Makefile` | Front door: `setup`, `dev`, `pull`, `package`, `propose`, … |
| `.github/` | CI workflows, issue and PR templates |

## Getting started

Requires Node `>=22.18`, pnpm `>=10` (exact version pinned in `package.json`), and Docker for the CMS database.

```sh
make setup    # install, git hooks, skills symlink, Chrome-for-Testing, docs validation
make dev      # Postgres + MinIO + seed-if-empty + CMS + Astro
make check    # full gate (pre-push + CI): docs/design + web + cms (apps in parallel)
make lighthouse  # Q1 mobile loop; contract in .lighthouse/README.md, live report → AGENT.md
```

Local default is `make dev` (Docker volumes persist; Astro reads local Payload). JSON escape hatch: `make dev-web`. Details: [`docs/dev/local-development.md`](docs/dev/local-development.md). Pull (read-only) / propose (drafts only): [`docs/dev/content-sync.md`](docs/dev/content-sync.md). Production go-live (CF + Vercel): [`docs/dev/go-live.md`](docs/dev/go-live.md). Pre-commit runs `check:fast` only; push runs the full gate.

## Contributing

Code and docs changes: see [`CONTRIBUTING.md`](CONTRIBUTING.md). Division editors work in Payload admin; code agents may pull/package/propose drafts but never Publish or production-deploy.

## Security

Please report vulnerabilities privately; see [`SECURITY.md`](SECURITY.md).

## License

Code is MIT ([`LICENSE.md`](LICENSE.md)). Site content, media, and the Q-Summit marks are all rights reserved ([`LEGAL.md`](LEGAL.md)).
