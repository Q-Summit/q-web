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
| R6 | Stolen `CONTENT_SYNC_TOKEN` | Real-person actor stamped `@agent.q-summit.com` (required `CONTENT_SYNC_USER_EMAIL`), draft-forced writes, allowlist, HTTP 422 on apply errors, no deploy path ([content-sync](../dev/content-sync.md), Q9 in [section 10](10-quality-requirements.md)) |
| R7 | Rich-text HTML on the static site | Lexical → HTML allowlists tags/protocols and escapes attributes (`apps/web/src/lib/lexical-html.ts`); covered by unit tests |
| R8 | Dual-source interim window: a maintainer-held JSON snapshot seeds prod Payload while both exist, with no rule for which side wins on a real content diff | Manual parity diff at cutover; snapshot edits become emergency-only once prod Payload is seeded ([go-live.md](../dev/go-live.md#content-cutover)) |
| R9 | Publish hook URL missing on Vercel | Approver Publish no-ops the rebuild (logged skip). Set `CLOUDFLARE_DEPLOY_HOOK_URL` on the CMS and the matching GitHub secret; use **Rebuild site** as override ([go-live.md](../dev/go-live.md)) |
| R14 | Stale site after CMS edit | Deploy gate uses live-row status (not Payload `previousDoc`) + skips `?draft=true` writes; still verify Builds after critical unpublish. Manual **Rebuild site** if hook/build fails ([section 6](06-runtime.md)) |

## Technical debt

- Every entry in the owed-decisions list in [section 9](09-architecture-decisions.md) is debt until its ADR is accepted.
- The `pkce_verifier` cookie set during Google sign-in comes from the third-party `payload-oauth2` plugin, which issues it without `Secure` or `HttpOnly` (it passes only `sameSite: "Lax"`). It is short-lived and single-use, and the CMS host sends HSTS, but the PKCE binding ADR-0005 relies on is weaker than it reads. Revisit if the plugin gains cookie options, or replace it if the flow is ever hardened further.
- Visual identity has no debt list: [`../../apps/web/DESIGN.md`](../../apps/web/DESIGN.md) is the rules, `pnpm run check:design` enforces seven of them, and `apps/web/design-baseline.json` ratchets the four literals still allowed.

Add an entry when a PR knowingly takes a shortcut; remove it in the PR that pays it off.
