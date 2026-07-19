# 11 · Risks and technical debt

<!-- arc42 section 11: known risks and consciously taken shortcuts. -->

## Risks

| # | Risk | Mitigation |
| --- | --- | --- |
| R1 | Vercel hosting becomes unavailable or unsuitable | Fallback is a config-level move to Railway (about EUR 5 to 11/month), same code ([ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md)) |
| R2 | Low bus factor on the codebase | Entire configuration lives in git with docs; Q7 in [section 10](10-quality-requirements.md) |
| R3 | Provider terms or pricing get worse over time | Every layer is open source or standards-based (static files, Postgres, S3 API); any single provider swaps without touching the others |
| R4 | Payload major upgrades outpace volunteer capacity | Pin majors; upgrade off-season only; the 3-day dependency quarantine in `pnpm-workspace.yaml` |
| R5 | Stale content after the yearly changeover | Editions model ([section 8](08-concepts.md)): past years archive instead of being overwritten |

## Technical debt

- Every entry in the owed-decisions list in [section 9](09-architecture-decisions.md) is debt until its ADR is accepted.

Add an entry when a PR knowingly takes a shortcut; remove it in the PR that pays it off.
