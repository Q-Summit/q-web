# 0002 · Payload CMS, hosted on Vercel with Neon Postgres

- **Status:** Accepted
- **Date:** 2026-07-15
- **Trigger:** Team IT decision "Where the Q-Summit website should live for the next three years" (15 July 2026); adversarial validation pass on the hosting variant

## Context

Hard requirements for content editing:

- Every division edits its own content under its own account, scoped per collection and per field.
- Drafts and an approval step before anything goes live.
- Content must survive the yearly changeover (editions).
- About EUR 0 for unlimited editors; about 40 non-technical editors, no GitHub accounts required.

## Considered options

1. **Git-based or SaaS headless CMS free tiers**: git-based CMSs put editors into pull requests, the wrong tool for non-technical editors; SaaS free tiers lack per-team roles and approval workflows or price them far beyond the budget.
2. **Payload 3** (open source, MIT, TypeScript): per-collection and per-field access control, drafts and scheduled publishing built in, version history, runs anywhere Node and Postgres run.

## Decision

Option 2. Payload delivers scoped division accounts with an approval gate at EUR 0, and it is open source with the content in our own Postgres, so there is no lock-in.

This choice implies the hosting: Payload needs a Node runtime and Postgres.

- **Postgres: Neon free tier, Frankfurt.** EU region, about 10 MB of content against a 500 MB cap, point-in-time restore, database branching for schema tests.
- **Runtime: Vercel.** Fallback: the CMS container moves to Railway (a config-level change, same day).
- **Media: Cloudflare R2** through Payload's S3-compatible upload adapter.

**Considered and rejected within this decision:** running Payload on Cloudflare Workers + D1 to keep a single vendor. The D1 adapter was beta with open data-loss bugs at evaluation time (payloadcms/payload#15219 data loss, #15070 silent deletes, #17195 broken template). A CMS that can silently lose content is disqualifying; do not re-propose until the adapter is out of beta and those issues are closed. Watch **EmDash** (Cloudflare's first-party CMS, beta since April 2026; Cloudflare acquired Astro in January 2026) as a possible long-term successor once it reaches 1.0.

## Consequences

- Unlimited editors with scoped accounts, drafts, and approval, at about EUR 0/month.
- Publishing fires the deploy hook that rebuilds the static site ([ADR-0001](0001-astro-static-site.md)).
- The stack spans Cloudflare, Vercel, and Neon; every layer is open source or standards-based (static files, Postgres, S3 API), so any single provider can be swapped without touching the others. That is the exit strategy.
- Each provider needs a DPA; tracked offsite.
