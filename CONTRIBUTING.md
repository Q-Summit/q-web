# Contributing

This repository holds the code and docs for q-summit.com. Two audiences, two paths:

- **Content editors** (divisions): you do not need this repository at all. Content is edited in Payload CMS with your division account; see the editor handbook in [`docs/editors/`](docs/editors/).
- **Code maintainers**: everything below.

## Setup

Requires Node `>=22.19`, pnpm `>=10` (pinned in `package.json`), and Docker Compose.

```sh
make setup
make dev
```

Advanced (JSON-only site, CF preview): [`docs/dev/local-development.md`](docs/dev/local-development.md). Content pull / propose drafts: [`docs/dev/content-sync.md`](docs/dev/content-sync.md). Production go-live (CF + Vercel): [`docs/dev/go-live.md`](docs/dev/go-live.md).

## Making changes

1. Branch from `main`. Prefixes: `feat/`, `fix/`, `docs/`, `adr/`, `ci/`.
2. Keep diffs small and reviewable.
3. Update every doc your change invalidates in the same PR (see [`docs/README.md`](docs/README.md)).
4. Before you push, `make check` / `pnpm run check` must be green (pre-push runs it too; CI re-runs it). Pre-commit only runs `check:fast` (docs structure, markdownlint, cspell, prettier, design, cms styles, scripts tests) so commits stay quick. Dependency changes commit the updated `pnpm-lock.yaml` in the same PR (CI installs with `--frozen-lockfile`); note that pnpm resolves no release younger than 3 days (`pnpm-workspace.yaml`).
5. Open a PR; `main` is protected and needs one review plus a green Checks run. Merge options: squash (default for small PRs; title and body become the commit), merge commit, or rebase (use those when you want the PR's atomic commits on `main`). PR titles stay prefixed (`feat:`, `fix:`, `docs:`, `ci:`, `chore:`), imperative, under 72 characters.

## House style

- English only, in code, docs, issues, and commits.
- No em or en dashes anywhere; use a comma, colon, or parentheses. The commit hook enforces this for commit messages, CI for files and for the PR title and body (title and body become the squash commit when you squash).
- Spell check flags a real word: add it to `words` in `cspell.config.yaml` (sorted), never an inline disable.
- Architecture-level choices need an ADR in [`docs/decisions/`](docs/decisions/) before code lands on them.
- Visual identity: [`apps/web/DESIGN.md`](apps/web/DESIGN.md) and `pnpm run check:design`. SEO / `/llms.txt`: [`docs/editors/seo.md`](docs/editors/seo.md), [`docs/editors/llms.md`](docs/editors/llms.md).
- Never commit secrets or `.env` files; see the NEVER list in `AGENTS.md`.

## Security

Vulnerabilities go through private disclosure, never public issues: [`SECURITY.md`](SECURITY.md).
