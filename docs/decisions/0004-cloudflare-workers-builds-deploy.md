# 0004 · Production deploy via Cloudflare Workers Builds

- **Status:** Accepted
- **Date:** 2026-07-21
- **Trigger:** launch-readiness audit found the deploy model owed while everything upstream is built

> **Supersession:** Environment / `CONTENT_SOURCE` bullets below are superseded by [ADR-0006](0006-content-source-required.md). Production Workers Builds run `CONTENT_SOURCE=cms` from the first deploy ([go-live](../dev/go-live.md)). The git-connected Workers Builds deploy model is unchanged.

## Context

The static site ([ADR-0001](0001-astro-static-site.md)), the CMS ([ADR-0002](0002-payload-cms-on-vercel-neon.md)), and the content path are built, but how `main` reaches production was left as an owed decision. Before launch, someone has to decide the mechanism that turns a merge into a live deploy. The standing rule that agents never deploy production must survive whatever we pick, and the choice must keep the near EUR 0 cost of the rest of the stack.

## Considered options

1. **Cloudflare Workers Builds, git-connected to this repo**: merges to `main` build `apps/web` and deploy atomically; the platform owns the build and deploy, humans only merge. No CI secrets, no agent path to production, rollback from the deployment history. Con: the pipeline is opaque platform config we do not own, debuggable only through the Cloudflare dashboard.
2. **Gated GitHub Actions deploy via OIDC**: more control over the pipeline, but it adds a deploy credential surface (even keyless OIDC is a trust relationship to guard) and puts a deploy step next to the code agents work in, rubbing against the agents-never-deploy rule.
3. **Manual `wrangler deploy`**: the status quo; a human builds and promotes by hand. No new infrastructure, but error-prone exactly at launch, and it makes every deploy a person remembering a command.

## Decision

Option 1. Cloudflare Workers Builds, git-connected to this repo. A merge to `main` builds `apps/web` and deploys atomically to the edge; humans merge, the platform deploys. This keeps deploys off any credential an agent could reach, so the agents-never-deploy rule holds without a new guard, and it gives an atomic edge deploy with a rollback history at no added cost.

- **Build configuration:** the pnpm workspace installs at the repo root; the Worker is `apps/web` (`wrangler.jsonc`: assets `./dist`, `MEDIA` bound to `qweb-media`, `run_worker_first: ["/media/*"]`). Build command `pnpm --filter web run build` (Astro static output to `apps/web/dist/`); the platform then runs `wrangler deploy` against that config. Exact dashboard fields: [go-live](../dev/go-live.md).
- **Environment:** Production Workers Builds set `CONTENT_SOURCE=cms`, `CMS_URL`, and `PUBLIC_CMS_URL` from the first deploy ([ADR-0006](0006-content-source-required.md), [go-live](../dev/go-live.md)). Do not leave `CONTENT_SOURCE` unset.
- **Rollback:** restore a previous deployment from the Workers Builds deployment history, or `git revert` on `main` and let the next build redeploy. A failed build does not replace the live deployment.
- **Cost:** Workers Builds is included in the free plan; a roughly 10-page site merging infrequently stays well inside the free build allotment. No new spend.

## Consequences

- Merges to `main` are the deploy trigger: humans merge, the platform builds and deploys atomically. Agents never merge to `main` and never deploy, so the agents-never-deploy rule is unchanged.
- A Payload live-site change schedules a Workers Builds deploy hook (`CLOUDFLARE_DEPLOY_HOOK_URL`; [section 6](../architecture/06-runtime.md)). Rebuilds also ride on merges to `main`. **Rebuild site** is the override for missed hooks.
- Production builds from published CMS content (`CONTENT_SOURCE=cms`); the maintainer JSON snapshot is emergency fallback only ([go-live](../dev/go-live.md), [ADR-0006](0006-content-source-required.md)).
- Deployment topology and rollback are now current truth in [section 7](../architecture/07-deployment.md), not an owed model.
- Revisit if a deploy ever needs a human approval gate (for example a staged production promotion) or if build minutes approach the free allotment; a gated Actions pipeline is the fallback then.
