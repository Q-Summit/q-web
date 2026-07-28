# 0006 · CONTENT_SOURCE is required and validated

- **Status:** Accepted
- **Date:** 2026-07-26
- **Trigger:** A release audit found that an unset `CONTENT_SOURCE` builds the committed fake CI fixture into a complete, green, deployable site.

## Context

[ADR-0004](0004-cloudflare-workers-builds-deploy.md) was written while a committed JSON snapshot was still the fallback content source, and it says `CONTENT_SOURCE` stays unset in Workers Builds. That premise no longer holds: real content is never committed, so `apps/web/content/` is gitignored and a production checkout has no snapshot to fall back to.

The loader resolved anything that was not exactly `"cms"` to JSON mode, and JSON mode walks up looking for content, finding `apps/web/test/fixtures/ci-content/`. So an operator who followed ADR-0004 got a successful build of "Fixture Platinum Partner 1" placeholder data, deployed to the live domain, with nothing in the build, the Worker, or the budget check objecting.

A deploy misconfiguration has to be loud. Silently substituting fake content is the worst available outcome because every signal says the release worked.

## Considered options

1. **Keep the default, add a separate guard**: leave the loader permissive and detect fixture content later (a post-build check for known fixture strings). Pro: no change to existing entry points. Con: the guard is a denylist that has to be kept in step with the fixture, and it fires after a full build rather than before one.
2. **Require the variable, validate it**: accept only `"cms"` or `"json"`, throw on anything else including unset. Pro: the failure is immediate, at the one place the decision is made, and it cannot drift. Con: every entry point must now state its mode, and any doc that said "unset" becomes wrong.
3. **Default to `cms`**: invert the fallback. Pro: a forgotten variable fails at fetch time rather than shipping fixtures. Con: it fails with a confusing connection error, and it breaks CI and fresh clones, which legitimately have no CMS.

## Decision

Option 2. `apps/web/src/lib/content.ts` requires `CONTENT_SOURCE` to be exactly `"cms"` or `"json"` and throws otherwise, unset included. CMS mode additionally requires `PUBLIC_CMS_URL`, since defaulting that to localhost bakes an origin into production HTML that can never match.

What decided it: the failure mode being replaced was not a crash but a plausible-looking success, and only a check at the decision point can turn that into a stop.

`WEB_CONTENT_DIR` was added alongside it so a build can pin its content directory. `build:fixture` sets it, which is what keeps `pnpm run check` gating on the committed fixture even on a machine that has the real snapshot restored at `apps/web/content/`.

## Consequences

- Supersedes the **Environment** and **Consequences** bullets of [ADR-0004](0004-cloudflare-workers-builds-deploy.md) that describe `CONTENT_SOURCE` staying unset and a committed JSON snapshot serving as the fallback. ADR-0004's deploy model (Workers Builds, git-connected, build from `main`) is unchanged and still current.
- Every entry point now names its mode: the `apps/web` package scripts, `scripts/local/dev.mjs`, `scripts/local/web-remote.mjs`, `scripts/preview/cf.mjs`, `.github/workflows/cms-build.yml`, and `apps/web/vitest.config.ts`.
- The CMS-outage fallback in [`../dev/go-live.md`](../dev/go-live.md) sets `CONTENT_SOURCE=json` instead of unsetting it. Getting this wrong produces a failed emergency deploy during an outage, so the runbook says so explicitly.
- A bare `pnpm --filter web run build` now fails by design. That is the intended tradeoff: no command builds content without saying which content.
- Revisit if a third content source appears (a preview branch reading unpublished drafts, say); the validation is a two-value allowlist and would need widening rather than loosening.
