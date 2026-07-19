# 10 · Quality requirements

<!-- arc42 section 10: the quality goals changes are reviewed against.
     Scenarios use the form: stimulus → expected response. -->

| # | Quality | Scenario (stimulus → response) |
| --- | --- | --- |
| Q1 | Performance | A visitor opens any page on a mid-range phone → Lighthouse mobile score of 90 or better; no multi-MB assets ship |
| Q2 | Editor autonomy | A division editor drafts, previews, and submits a change → entirely self-serve, no maintainer involved |
| Q3 | Publish latency | An approved publish → live site updated within about 5 minutes (the 2 to 4 minute rebuild plus hook and CDN latency) |
| Q4 | Resilience | Payload, Vercel, or Neon goes down → the public site keeps serving; only editing pauses |
| Q5 | Cost | Any month's invoices → about EUR 0 across all providers; a cost increase triggers an ADR, not a surprise bill |
| Q6 | Privacy | A visitor loads any page → no cookies set, no third-party CDN requests, no consent banner needed ([ADR-0003](../decisions/0003-posthog-cookieless-analytics.md)) |
| Q7 | Maintainability | A new maintainer after board handover → runs the full stack locally from repo docs alone within one day |
