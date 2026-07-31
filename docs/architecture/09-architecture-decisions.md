# 9 · Architecture decisions

<!-- arc42 section 9: index over ../decisions/. -->

| # | Decision | Status |
| --- | --- | --- |
| [0001](../decisions/0001-astro-static-site.md) | Astro static site on Cloudflare | Accepted |
| [0002](../decisions/0002-payload-cms-on-vercel-neon.md) | Payload CMS, hosted on Vercel with Neon Postgres | Accepted |
| [0003](../decisions/0003-posthog-cookieless-analytics.md) | PostHog Cloud EU, cookieless analytics | Accepted |
| [0004](../decisions/0004-cloudflare-workers-builds-deploy.md) | Production deploy via Cloudflare Workers Builds | Accepted |
| [0005](../decisions/0005-google-sso-group-roles.md) | Google SSO with Workspace-group roles for the CMS | Accepted |
| [0006](../decisions/0006-content-source-required.md) | `CONTENT_SOURCE` is required and validated | Accepted |
| [0007](../decisions/0007-visual-regression-testing.md) | Git-native visual regression testing | Accepted |

> **ADR-0002 scope note:** ADR-0002's context describes access "scoped per collection and per field." The delivered model is per collection and per page global (see [section 8](08-concepts.md)); "per field" names a Payload capability, not what shipped. ADR-0002 stays accepted as written; this note reconciles it with the built system.
>
> **ADR-0004 scope note:** ADR-0004's Environment and Consequences bullets say `CONTENT_SOURCE` stays unset in Workers Builds and that "the committed JSON snapshot stays the one-edition fallback." Both are superseded by [ADR-0006](../decisions/0006-content-source-required.md); its deploy model is unchanged. The reason: no real content lives in git, so `apps/web/content/` is gitignored, so a production checkout has no snapshot to fall back to. Production and preview builds run CMS mode from the first deploy, per [`../dev/go-live.md`](../dev/go-live.md) and [section 7](07-deployment.md). `CONTENT_SOURCE` is now required and validated in `apps/web/src/lib/content.ts`: unset or unrecognized throws, because the old fallback silently built the fake CI fixture into a green, deployable site. ADR-0004 stays accepted as written; this note reconciles it with the built system.
>
> **ADR-0005 scope note:** ADR-0005 says "the content-sync editor user is the exception (no interactive login, so its roles stay as an admin set them)." That exception no longer exists. The content-sync actor is each operator's own Workspace account: it is provisioned by their normal Google sign-in, its roles and divisions re-sync from Workspace groups on every login like anyone else's, and the only thing that distinguishes a propose is the `@agent.q-summit.com` stamp on the audit trail. Drafts-only is enforced by `forceDraftData` plus `draft: true` on every write, not by the actor's role. ADR-0005 stays accepted as written; this note reconciles it with the built system.

## Decisions we already know we owe

Implied by the stack decisions; each becomes an ADR PR when the work that needs it starts:

- Edition rollover mechanism in the Payload schema (how a new year is created, how past years archive)
- Form handling on a static site (contact or application forms, if ever needed)
- Media pipeline conventions (image sizes, hero/HLS video seeding into R2; Payload Media is images-only today)
- Neon backup and export policy beyond point-in-time restore
- Approval workflow depth (approval itself is decided): Payload built-in drafts + publish rights vs a dedicated review step per division
- Content-sync hardening follow-ups: Payload API keys on the sync user, per-division tokens, staging-first propose default (draft-only `POST /api/content-sync` is shipped; see [`../dev/content-sync.md`](../dev/content-sync.md))
