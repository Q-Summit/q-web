# Maintainer how-tos

Procedures for people who work in this repository. Architecture truth stays in [`../architecture/`](../architecture/); decisions in [`../decisions/`](../decisions/).

| Guide | Use when |
| --- | --- |
| [`local-development.md`](local-development.md) | Clone, Docker, seed, Astro/CMS loop, local CF preview |
| [`scripts.md`](scripts.md) | Purpose folders: `local/`, `content/`, `check/`, `preview/`, `ops/`, `lib/`; Make↔pnpm; agent bands |
| [`content-sync.md`](content-sync.md) | Pull / package / propose drafts, upsert keys, failure modes, security model |
| [`visual-testing.md`](visual-testing.md) | Visual regression: add `*.vrt.ts` variants, run/accept baselines, the CI gate ([ADR-0007](../decisions/0007-visual-regression-testing.md)) |
| [`go-live.md`](go-live.md) | Production CF (R2 + Worker), Vercel connect + migrations, Google SSO setup, admin bootstrap, publish → deploy hook, and keys that exist today. PostHog client is listed as not built yet |
| [`incident.md`](incident.md) | Site, CMS, or content is down or wrong: detect, triage, roll back, recover, escalate |

Later edition rollover and similar ops guides join this folder when that work starts (data-loss recovery already lives in `incident.md`).
