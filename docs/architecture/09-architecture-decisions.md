# 9 · Architecture decisions

<!-- arc42 section 9: index over ../decisions/. -->

| # | Decision | Status |
| --- | --- | --- |
| [0001](../decisions/0001-astro-static-site.md) | Astro static site on Cloudflare | Accepted |
| [0002](../decisions/0002-payload-cms-on-vercel-neon.md) | Payload CMS, hosted on Vercel with Neon Postgres | Accepted |
| [0003](../decisions/0003-posthog-cookieless-analytics.md) | PostHog Cloud EU, cookieless analytics | Accepted |

## Decisions we already know we owe

Implied by the stack decisions; each becomes an ADR PR when the work that needs it starts:

- Edition rollover mechanism in the Payload schema (how a new year is created, how past years archive)
- Deploy model: Cloudflare git-connected builds vs a gated GitHub Actions deploy; PR preview deployments
- Form handling on a static site (contact or application forms, if ever needed)
- Media pipeline conventions (image sizes, hero video encoding)
- Neon backup and export policy beyond point-in-time restore
- Approval workflow depth (approval itself is decided): Payload built-in drafts + publish rights vs a dedicated review step per division
