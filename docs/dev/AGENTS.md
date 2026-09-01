# docs/dev AGENTS.md

Maintainer how-tos. Extends [`../AGENTS.md`](../AGENTS.md). Index: [`README.md`](README.md).

## Where to look

| Task | Go to |
| --- | --- |
| Scripts catalog (main / ops / admin, Make↔pnpm, agent bands) | [`scripts.md`](scripts.md) |
| Clone, Docker, seed, Astro/CMS, local CF preview | [`local-development.md`](local-development.md) |
| Pull / package / propose, upsert keys, sync security | [`content-sync.md`](content-sync.md) |
| Production CF / Vercel keys | [`go-live.md`](go-live.md) |
| Visual regression (`*.vrt.ts`, baselines, advisory CI) | [`visual-testing.md`](visual-testing.md) |
| Incident response runbook | [`incident.md`](incident.md) |
| Topology / system truth | [`../architecture/`](../architecture/) |
| Root MAY/NEVER | [`../../AGENTS.md`](../../AGENTS.md) |

## ALWAYS

- When a root script, env key, or wrangler/compose contract changes, update the matching how-to in this folder in the same PR.
- Treat root `package.json` scripts as the implementation source of truth; `Makefile` is the zero-arg front door (`ARGS='…'` for flags). Catalog: [`scripts.md`](scripts.md).
- New, moved, or rewritten root scripts follow the placement and same-PR catalog rule in [`scripts.md`](scripts.md).
- Keep day-to-day tooling in `local/`, `content/`, `check/`, `preview/`. Human Neon/R2 break-glass → `scripts/ops/` (pnpm only, not Make). One-shot GitHub admin → `.github/admin/` (not under `scripts/`).
- Link [`../architecture/`](../architecture/) for topology; keep this folder to procedures.
- Pull / propose / upsert keys / sync security live in [`content-sync.md`](content-sync.md); local Docker/seed in [`local-development.md`](local-development.md); production keys in [`go-live.md`](go-live.md). Do not restate the full package allowlist in multiple how-tos.

## NEVER

- Duplicate arc42 diagrams or ADR rationale here.
- Document a SQL/`pg_restore` / `data:push` write path to production. Draft-only `make propose` → `POST /api/content-sync` (and create-if-missing `POST /api/content-sync/media`) is the allowed automated remote content write.
- Invent dashboard clicks not verified against `wrangler.jsonc` / `payload.config.ts`.
- Run or document `ops:cms-remote`, `ops:mirror-db`, or `ops:mirror-media` as non-interactive (TTY human-confirm required; files under `scripts/ops/`).
- Promote Neon/R2 mirror commands onto the Make front door; `make pull` means `content:pull` only.
- Document `make propose` as publishing or deploying; it creates drafts only.
