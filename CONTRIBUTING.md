# Contributing

This repository holds the code and docs for q-summit.com. Two audiences, two paths:

- **Content editors** (divisions): you do not need this repository at all. Content is edited in Payload CMS with your division account; see the editor handbook in [`docs/editors/`](docs/editors/).
- **Code maintainers**: everything below.

## Setup

Requires Node `>=22.18` and pnpm `>=10` (exact version pinned in `package.json`).

```sh
pnpm run setup
```

This installs dependencies, activates the git hooks, links the agent skills (`.claude/skills`), and validates the docs structure. The hooks run the check suite and a commit-message style scan on every commit.

## Making changes

1. Branch from `main`. Prefixes: `feat/`, `fix/`, `docs/`, `adr/`, `ci/`.
2. Keep diffs small and reviewable.
3. Update every doc your change invalidates in the same PR (see [`docs/README.md`](docs/README.md)).
4. `pnpm run check` must be green before you push. Dependency changes commit the updated `pnpm-lock.yaml` in the same PR (CI installs with `--frozen-lockfile`); note that pnpm resolves no release younger than 3 days (`pnpm-workspace.yaml`).
5. Open a PR; `main` is protected and needs one review plus a green Checks run. PRs are squash-merged, and the squash commit takes the PR title and body, so write the title as the commit message: prefixed (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`), imperative, under 72 characters.

## House style

- English only, in code, docs, issues, and commits.
- No em or en dashes anywhere; use a comma, colon, or parentheses. The commit hook enforces this for commit messages, CI for files and for the PR title and body (which become the squash commit).
- Spell check flags a real word: add it to `words` in `cspell.config.yaml` (sorted), never an inline disable.
- Architecture-level choices need an ADR in [`docs/decisions/`](docs/decisions/) before code lands on them.
- Never commit secrets or `.env` files; see the NEVER list in `AGENTS.md`.

## Security

Vulnerabilities go through private disclosure, never public issues: [`SECURITY.md`](SECURITY.md).
