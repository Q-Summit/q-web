# AGENTS.md

The website for [Q-Summit](https://q-summit.com), Germany's largest student-organized startup conference: an Astro static site on Cloudflare, fed by Payload CMS on Vercel with Neon Postgres, plus cookieless PostHog Cloud EU (see [ADR-0001](docs/decisions/0001-astro-static-site.md), [ADR-0002](docs/decisions/0002-payload-cms-on-vercel-neon.md), and [ADR-0003](docs/decisions/0003-posthog-cookieless-analytics.md)). Content is edited by division accounts in Payload, never in this repo. `docs/architecture/` is always the current system truth. Nested `AGENTS.md` guides merge with this one; the closest wins on conflict.

Docs tree: [`docs/AGENTS.md`](docs/AGENTS.md). Process and homes: [`docs/README.md`](docs/README.md). Humans: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Commands

Node `>=22.18`, pnpm `>=10` (exact version pinned in `package.json` `packageManager`).

```sh
pnpm run setup      # clone: install, hooks, skills symlink, structural validate
pnpm run check      # must be green before finish
pnpm run check:docs # structure / pairing / links only
pnpm run format     # Prettier write (md/json/yml)
```

Git hooks (installed by `pnpm run setup`) run `pnpm run check` plus a commit-message dash scan on every commit.

## ALWAYS

- Same-PR: update every doc, diagram, and index your change invalidates.
- English only. No em/en dashes. No spaced hyphen as dash punctuation.
- Spell check flags a real word: add it to `words` in `cspell.config.yaml` (sorted), never an inline disable.
- Mermaid via the **docs-diagrams** skill (`.agents/skills/docs-diagrams/`).
- Agent guide edits (`AGENTS.md`/`CLAUDE.md`) via the **agent-files** skill (`.agents/skills/agent-files/`).
- Pin GitHub Actions to a full commit SHA with a trailing `# vX.Y.Z` comment.
- New workflows declare a least-privilege `permissions:` block. Quality gates extend `pnpm run check`, never a parallel workflow. workflow-lint is path-filtered and not a required check; treat its findings as blocking anyway.
- Run `pnpm run check`. Do not assume failures are unrelated.
- Report vulns privately ([`SECURITY.md`](SECURITY.md)).

## PREFER

- Small, reviewable diffs.
- Boring, documented tech; match nearby patterns.
- Branch names: `feat/`, `fix/`, `docs/`, `adr/`, `ci/`; commit and PR-title prefixes: `feat:`, `fix:`, `docs:`, `ci:`, `chore:` ([`CONTRIBUTING.md`](CONTRIBUTING.md)).
- Links over copying docs into new prose.
- Obvious fake sample data (`user@example.com`).
- TypeScript for new code. The stack is decided ([ADR-0001](docs/decisions/0001-astro-static-site.md), [ADR-0002](docs/decisions/0002-payload-cms-on-vercel-neon.md), [ADR-0003](docs/decisions/0003-posthog-cookieless-analytics.md)): Astro static + Payload 3 + Neon Postgres + R2 + PostHog EU; new vendors or paid services need a new ADR.

## NEVER

- Commit secrets, tokens, `.env` files, or database URLs. All credentials live in provider dashboards or GitHub secrets.
- Add cookies, third-party CDNs (fonts, scripts), or consent-requiring embeds to the site; the cookieless/no-banner setup is a compliance property ([`docs/architecture/08-concepts.md`](docs/architecture/08-concepts.md)).
- Publish or edit CMS content through this repo; content belongs to the divisions in Payload ([`docs/README.md`](docs/README.md), state ownership).
- Invent GitHub labels (only `scripts/setup-labels.sh`).
- Reformat or restyle legal text (`LICENSE.md`, `LEGAL.md`); it stays byte-for-byte as drafted (see `.prettierignore`).
- Put shared, cross-tool rules in `CLAUDE.md` (those belong in `AGENTS.md`). Claude-only notes may follow the `@AGENTS.md` import in `CLAUDE.md`.
- Add workspace packages beyond `apps/web` and `apps/cms` without an accepted ADR; when a package lands, nest `AGENTS.md` + `CLAUDE.md` in it and wire its checks into `pnpm run check` in the same PR.
