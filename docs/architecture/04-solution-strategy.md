# 4 · Solution strategy

<!-- arc42 section 4: goal-to-approach mapping. -->

| Goal (from [section 1](01-introduction-and-goals.md)) | Approach | Driven by |
| --- | --- | --- |
| Fast and correct for visitors | Pre-built static HTML on Cloudflare's edge; media re-encoded and served from R2; no client-side CMS calls | [ADR-0001](../decisions/0001-astro-static-site.md) |
| Self-serve for divisions | Payload CMS with per-division accounts, field-level access, drafts, and an approval step before publish | [ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md) |
| Compliant by construction | PostHog EU cookieless (no banner), self-hosted assets, EU database region, legal pages on the site | [ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md), [ADR-0003](../decisions/0003-posthog-cookieless-analytics.md), rules in [section 8](08-concepts.md) |
| Near-zero cost | About EUR 0/month; each layer open source or standards-based, so any single provider can be swapped | [ADR-0001](../decisions/0001-astro-static-site.md), [ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md), [ADR-0003](../decisions/0003-posthog-cookieless-analytics.md) |
| Maintainable across turnover | Entire configuration in git; docs as code with the same-PR rule; TypeScript throughout | [`../README.md`](../README.md), [section 2](02-constraints.md) |
| Resilient for visitors | Static architecture: the site keeps serving even when Payload, Vercel, or Neon are down; only editing pauses | [ADR-0001](../decisions/0001-astro-static-site.md) |
