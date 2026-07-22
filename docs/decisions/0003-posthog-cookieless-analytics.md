# 0003 · PostHog Cloud EU, cookieless analytics

- **Status:** Accepted
- **Date:** 2026-07-15
- **Trigger:** Team IT decision "Where the Q-Summit website should live for the next three years" (15 July 2026); the previous site loaded GA4 and Tag Manager with no consent banner, a live GDPR gap

## Context

The site needs basic usage insight (traffic, page performance, which pages carry ticket and job clicks), especially before ticket sales open in January. The old setup collected it unlawfully: GA4 plus Tag Manager without a consent banner. Any replacement must be lawful without degrading a 10+ page marketing site with a consent wall, keep data in the EU, and cost about EUR 0.

## Considered options

1. **GA4 with a proper consent banner**: familiar tooling; but requires a banner (measurable conversion and UX cost on a marketing site), loses every visitor who declines, and adds EU-US transfer complexity.
2. **No analytics at all**: maximally private, zero cost; but the org is blind on what works, exactly when it matters most (ticket launch, partner season).
3. **PostHog Cloud EU in cookieless mode**: anonymous events, no cookies and no persistent identifiers, EU hosting, free tier of 1M events per month; lawful without a banner on a documented legitimate-interest basis. Con: without cross-visit identity the numbers are directional (unique-visitor counts approximate, no retention funnels).

## Decision

Option 3. Cookieless PostHog Cloud EU. The site sets no cookies and needs no consent banner; the legitimate-interest assessment will be documented in the Datenschutzerklaerung when the client ships.

## Consequences

- No consent banner, as a standing compliance property: adding any cookie-setting or user-identifying analytics, embed, or third-party script requires superseding this ADR and adding a consent banner first (enforced as a NEVER in `AGENTS.md` and a crosscutting rule in [section 8](../architecture/08-concepts.md)).
- Anonymous events only: no user-level funnels, retention, or cross-visit tracking; counts are approximate compared to cookie-based analytics. Accepted trade for a marketing site.
- PostHog is a sub-processor; DPA tracked offsite. Name it on the public legal pages in the same PR as the client lands.
- Revisit if event volume ever approaches the free tier's 1M events per month.
