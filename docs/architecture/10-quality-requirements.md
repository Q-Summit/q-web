# 10 · Quality requirements

<!-- arc42 section 10: the quality goals changes are reviewed against.
     Scenarios use the form: stimulus → expected response. -->

| # | Quality | Scenario (stimulus → response) |
| --- | --- | --- |
| Q1 | Performance | A visitor opens any page on a mid-range phone → Lighthouse mobile score of 90 or better; no multi-MB assets ship. Asset/share-image budgets: `scripts/check/budgets.mjs` (CI). Local loop: `make lighthouse` → `.lighthouse/AGENT.md` (gitignored). Shared contract: [`.lighthouse/README.md`](../../.lighthouse/README.md) + [`AGENT.example.md`](../../.lighthouse/AGENT.example.md) |
| Q2 | Editor autonomy | A division editor drafts and saves a change → entirely self-serve, no maintainer involved (approver publish; dedicated submit UX still owed in [section 9](09-architecture-decisions.md)) |
| Q3 | Publish latency | An approved publish → live site updated within about 2 to 4 minutes via the Workers Builds deploy hook ([go-live](../dev/go-live.md), [section 6](06-runtime.md)) |
| Q4 | Resilience | Payload, Vercel, or Neon goes down → the public site keeps serving; only editing pauses |
| Q5 | Cost | Any month's invoices → about EUR 0 across all providers; a cost increase triggers an ADR, not a surprise bill |
| Q6 | Privacy | A visitor loads any page → no cookies set, no third-party CDN requests, no consent banner needed ([ADR-0003](../decisions/0003-posthog-cookieless-analytics.md); PostHog client still owed) |
| Q7 | Maintainability | A new maintainer after board handover → runs the full stack locally from repo docs alone within one day |
| Q8 | AI discoverability | An assistant fetches `/llms.txt` → gets a factual identity block plus curated main-page links within one request; `/llms-full.txt` covers the main page sections without crawling HTML |
| Q9 | Draft-only sync | `CONTENT_SYNC_TOKEN` is used (or stolen) → drafts may change in the sync user's divisions; Publish and Cloudflare deploy remain impossible ([content-sync](../dev/content-sync.md)) |
| Q10 | Visual regression | A token or `global.css` edit reflows a component the author did not open → the advisory `visual.yml` job renders every variant, diffs against `main`'s baselines, and surfaces the change on the PR before merge; never a silent ship ([ADR-0007](../decisions/0007-visual-regression-testing.md)) |
