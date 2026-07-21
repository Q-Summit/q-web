# .github/admin/

One-time / rare GitHub repository administration. **Not** day-to-day local dev tooling.

Day-to-day scripts: [`scripts/`](../../scripts/) · Catalog: [`docs/dev/scripts.md`](../../docs/dev/scripts.md) · Labels NEVER in root [`AGENTS.md`](../../AGENTS.md).

| Script | When |
| --- | --- |
| `setup-repo.sh` | Configure merge policy, branch protection, and private vulnerability reporting (idempotent; needs `gh` admin) |
| `setup-labels.sh` | Create/update the label scheme used by issue templates and `links.yml` |

```sh
./.github/admin/setup-repo.sh Q-Summit/q-web
./.github/admin/setup-labels.sh Q-Summit/q-web
```

Only invent new GitHub labels via `setup-labels.sh`.
