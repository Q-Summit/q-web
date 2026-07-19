# 8 · Concepts

<!-- arc42 section 8: content model, authorization, crosscutting rules. -->

The standing rules of the system, set by [ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md) (content and authorization) and [ADR-0003](../decisions/0003-posthog-cookieless-analytics.md) (cookieless / no-banner). The Payload schema in `apps/cms` implements them; a PR that changes the schema updates this chapter.

## Authorization

- Every editor has a personal account scoped to their division; there are no shared logins.
- Access is per collection and per field: a division edits its own content and nothing else (for example, the partner division edits partners and jobs; the PR division edits speakers and FAQ).
- Publishing is restricted to approvers; editors work in drafts.
- Accounts are removed when members leave, at latest at board handover.

## Content lifecycle

- **Drafts before publish:** all edits are drafts with preview; an approval step gates go-live.
- **Editions:** content is modeled per conference year. Next year's content is created alongside the current year's; past editions archive themselves instead of being overwritten.
- **Media:** uploaded through Payload into R2; images are optimized at build time.

## Crosscutting rules

- No cookies, no third-party CDNs, no consent-requiring embeds; every asset is self-hosted. This keeps the site consent-banner-free ([ADR-0003](../decisions/0003-posthog-cookieless-analytics.md)) and it is a review gate, not a preference.
- Personal data in the CMS (speakers, team, contact persons) must stay answerable, exportable, and deletable per GDPR; DPAs with sub-processors are tracked offsite.
- Published URLs are permanent: pages that move get redirects in the site config, never dead links.
- The site never fetches from the CMS at runtime; all content is baked in at build time.
