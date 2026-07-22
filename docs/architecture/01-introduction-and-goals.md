# 1 · Introduction and goals

<!-- arc42 section 1: what the system is, its goals, its stakeholders. -->

## What this is

The public website of [Q-Summit](https://q-summit.com), Germany's largest student-organized startup conference (about 1,500 attendees, annual, Mannheim): about 15 Astro pages of marketing content (partners, speakers, jobs, team, FAQ, tickets) backed by a CMS that the org's divisions edit themselves.

## Top goals

1. **Fast and correct for visitors.** The site is the conference's storefront; performance and accuracy sell tickets and partners.
2. **Self-serve for divisions.** Each division edits its own content under its own account, with an approval step; no shared logins, no bottleneck through IT.
3. **Compliant by construction.** Cookieless analytics, self-hosted assets, Impressum and Datenschutzerklaerung; no consent banner needed.
4. **Near-zero cost.** About EUR 0/month; any paid service needs an ADR.
5. **Maintainable across turnover.** The board changes yearly; a successor clones the repo and runs the stack locally from the docs alone.
6. **Resilient for visitors.** The public site keeps serving when Payload, Vercel, or Neon are down; only editing pauses.

[Section 10](10-quality-requirements.md) turns these into reviewable scenarios.

## Stakeholders

| Who | Stake |
| --- | --- |
| Visitors (prospective attendees, applicants) | Fast, accurate information; ticket and job links that work |
| Partners and sponsors | Correct logos, profiles, and job listings; their brand handled with care |
| Division editors | Edit their own content without technical help; approved publishes go live in minutes via the deploy hook |
| Maintainers (IT) | Small, boring, well-documented codebase; portfolio-grade public work |
| Q-Summit e.V. (board) | Cost, compliance, continuity across handovers |
