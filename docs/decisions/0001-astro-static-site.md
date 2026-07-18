# 0001 · Astro static site on Cloudflare

- **Status:** Accepted
- **Date:** 2026-07-15
- **Trigger:** Team IT decision "Where the Q-Summit website should live for the next three years" (15 July 2026)

## Context

q-summit.com is a content site of 10+ pages for an annual conference. Requirements that drive the hosting choice:

- No server-side product logic; pages are marketing content.
- Performance directly sells tickets and partners; heavy media must stay under our control.
- Budget near EUR 0/month for hosting.
- No one can carry server administration across yearly board handovers.
- GDPR: no third-party trackers or font CDNs without a lawful basis; analytics decided separately in [ADR-0003](0003-posthog-cookieless-analytics.md).

## Considered options

1. **Server-rendered framework (Next.js or similar) on managed hosting**: maximum flexibility; but it puts a running server under pages that are in fact static, adds an operational and cost surface, and the site can go down with its backend.
2. **Astro with static output on Cloudflare**: every page prebuilt to plain HTML, no JavaScript shipped by default, about EUR 0/month on Cloudflare's edge (about 300 locations), media and video in R2.

## Decision

Option 2. A marketing site is static content; prebuilding it makes performance a build property and availability independent of every other system. Cloudflare serves the result from the edge at about EUR 0/month.

## Consequences

- Design and layout changes are code and go through PRs; content changes stay point-and-click in the CMS ([ADR-0002](0002-payload-cms-on-vercel-neon.md)).
- Publishing means rebuilding: changes go live in about 2 to 4 minutes, atomically; a failed build never touches the live site.
- The site cannot overload and cannot go down with its CMS; only editing pauses when the CMS is down.
- Content must be fetched at build time, which requires a headless CMS: decided in [ADR-0002](0002-payload-cms-on-vercel-neon.md).
- Revisit if the site ever needs real server-side behavior (forms are the owed decision in [section 9](../architecture/09-architecture-decisions.md)).
