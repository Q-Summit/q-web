# Incident response

What to do when the live site, the CMS, or published content is down or wrong. Setup and keys live in [`go-live.md`](go-live.md); topology and the deploy model in [`../architecture/07-deployment.md`](../architecture/07-deployment.md); the content propose and publish flow in [`content-sync.md`](content-sync.md). Keep this page to response steps, not architecture.

## Detection

- **External uptime monitor.** A dedicated external service, deliberately not a workflow in this repo. At go-live, point it (owner picks the service; any plain HTTPS checker works, no vendor config enters the repo) at `https://q-summit.com/`, `/whyq/`, `/llms.txt`, and `/media/hero-poster.jpg` (stable ops-controlled key; a 404 there means R2 seeding regressed, see [`go-live.md`](go-live.md)), treat any non-2xx as down, and alert to email or the team channel. On an alert, open or update one tracking issue titled "Uptime: production is failing" (label `area: infra`) and run the response in it.
- **Human report.** Someone reports that a page is down or broken. Capture the URL, the time, what they saw, and whether it reproduces from another network, then open or comment on that same tracking issue.

## Triage

Check provider status first, to rule out an upstream outage before touching our code:

- Cloudflare (site Worker, R2): <https://www.cloudflarestatus.com/>
- Vercel (CMS): <https://www.vercel-status.com/>
- Neon (CMS database): <https://neonstatus.com/>
- GitHub (Actions, this repo): <https://www.githubstatus.com/>

If a provider is down, wait it out and note that on the issue. Otherwise identify the failing layer (site, CMS, or content) against the topology in [`../architecture/07-deployment.md`](../architecture/07-deployment.md), then roll back that layer.

## Rollback

- **Site.** Roll back to the previous deployment in Cloudflare Workers Builds (the git-connected build-from-`main` deploy model, ADR-0004, indexed in [architecture decisions](../architecture/09-architecture-decisions.md)). If a known commit is the cause, `git revert` it and merge to `main` so Workers Builds rebuilds a clean version.
- **CMS.** Promote the previous known-good Vercel deployment to production (Vercel dashboard, Deployments, Promote to production). Never push schema in production; migrations run per [`go-live.md`](go-live.md).
- **Content.** Restore or unpublish in Payload (both schedule a rebuild). If the site stays stale, run **Rebuild site** (Actions → Rebuild site). Drafts from [`content-sync.md`](content-sync.md) never go live until an approver publishes.

## Backup and recovery

Rollback above handles a bad deploy. This is the path when data is lost or corrupted, not just when a deploy is wrong.

- **CMS database (Neon).** Neon point-in-time restore (PITR) is the recovery path for the Postgres database behind the CMS. It replays the write-ahead log to a chosen timestamp; see the Neon docs on point-in-time restore. The retention window is a project setting, so verify the actual window in the Neon dashboard rather than assuming one. No SQL or `pg_restore` write path is documented here.
- **R2 media.** After cutover, R2 (`qweb-media`) has no backup: a deletion or bucket loss is not recoverable from within our setup. Treat this as an accepted risk to revisit; a periodic copy of the bucket is the mitigation candidate if the maintainers decide media needs a backup.

The PITR retention window and whether R2 gets a backup are decisions the maintainers must confirm at go-live; this page does not fix a number for either.

## Credential compromise

- **`CONTENT_SYNC_TOKEN`.** Rotate immediately on Vercel (CMS env) and in every operator's gitignored `.env.remote`. Redeploy the CMS so the new value is live. Audit recent drafts in the admin Review queue for unexpected `(agent)` stamps (`name@agent.q-summit.com`). A stolen token can only propose drafts in the named actor's scope (cannot Publish, deploy, or touch `users`/`legal`); still treat it as a credential. Procedure: [`content-sync.md`](content-sync.md).
- **`CLOUDFLARE_DEPLOY_HOOK_URL`.** Rotate in Workers Builds (create a new deploy hook, disable the old one), then update the Vercel CMS env var and the GitHub repository secret. A stolen hook URL can trigger rebuilds from current published CMS content only.

## Escalation

Escalate to the maintainers named in [`SECURITY.md`](../../SECURITY.md) and [`.github/CODEOWNERS`](../../.github/CODEOWNERS). Use the role-based contacts there; keep personal emails out of this repo.
