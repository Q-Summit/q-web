# 7 · Deployment

<!-- arc42 section 7: infrastructure and deployment topology. -->

Set by [ADR-0001](../decisions/0001-astro-static-site.md), [ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md), and [ADR-0003](../decisions/0003-posthog-cookieless-analytics.md).

## Topology

| What | Where | Region |
| --- | --- | --- |
| Static site + builds | Cloudflare | Global edge (about 300 locations) |
| Media (images, hero video) | Cloudflare R2 | Global edge |
| Payload CMS | Vercel | EU function region |
| Postgres | Neon | Frankfurt |
| Analytics | PostHog Cloud EU | EU |

## Release and rollback

- **Site:** every publish or merged code change triggers a static rebuild and an atomic deploy; a failed build never replaces the live version. Rollback is a one-click redeploy of any of the last 100 builds.
- **CMS:** deploys from `main` via Vercel. Database schema changes go through Payload migrations; Neon supports point-in-time restore.
- **Deploy model** (git-connected builds vs a gated GitHub Actions workflow) and **PR preview deployments** are an owed decision; see [section 9](09-architecture-decisions.md).

## Environments

Production, plus full local development (Astro dev server + Payload + a local or Neon-branch database). Neon's branching provides ephemeral databases for schema-change testing.
