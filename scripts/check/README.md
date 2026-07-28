# scripts/check/

Quality-gate CLIs (`check:*`).

| File | pnpm |
| --- | --- |
| `fast.mjs` | `check:fast` (pre-commit): docs then md/spell/prettier/design/cms-styles/scripts-tests |
| `docs.mjs` | `check:docs` |
| `design.mjs` | `check:design` (apps/web visual identity) |
| `cms-styles.mjs` | `check:cms-styles` (apps/cms admin surfaces) |
| `scripts.test.mjs` | `check:scripts` (node:test) |
| `budgets.mjs` | runs inside `check:web:build` (asset size / share image budgets after the web build) |
| `run-parallel.mjs` | used by `check`, `check:web`, `check:cms` |

Catalog: [`docs/dev/scripts.md`](../../docs/dev/scripts.md).
