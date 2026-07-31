# scripts/check/

Quality-gate CLIs (`check:*`).

| File | pnpm |
| --- | --- |
| `fast.mjs` | `check:fast` (pre-commit): docs then md/spell/prettier/design/events/cms-styles/scripts-tests |
| `docs.mjs` | `check:docs` |
| `design.mjs` | `check:design` (apps/web visual identity) |
| `events.mjs` | `check:events` (analytics taxonomy gate; see [`docs/dev/analytics.md`](../../docs/dev/analytics.md)) |
| `cms-styles.mjs` | `check:cms-styles` (apps/cms admin surfaces) |
| `scripts.test.mjs` | `check:scripts` (node:test) |
| `vrt-report.mjs` | advisory `visual.yml` (sticky PR comment + AUTO baseline staging); not in `check` |
| `vrt-report.test.mjs` | part of `check:scripts` |
| `vrt-cleanup.mjs` | advisory `visual-cleanup.yml` (sweep closed PRs' Pages reports) |
| `budgets.mjs` | runs inside `check:web:build` (asset size / share image budgets after the web build) |
| `run-parallel.mjs` | used by `check`, `check:web`, `check:cms` |

Catalog: [`docs/dev/scripts.md`](../../docs/dev/scripts.md). Visual regression runbook: [`docs/dev/visual-testing.md`](../../docs/dev/visual-testing.md).
