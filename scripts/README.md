# scripts/

Purpose-named tooling folders (same pattern as `content/`).

**Catalog:** [`docs/dev/scripts.md`](../docs/dev/scripts.md) · **Scars:** [`docs/dev/AGENTS.md`](../docs/dev/AGENTS.md) · **MAY/NEVER:** [`../AGENTS.md`](../AGENTS.md) · **Content runbook:** [`docs/dev/content-sync.md`](../docs/dev/content-sync.md)

| Folder | Purpose | Who |
| --- | --- | --- |
| `lib/` | Shared helpers (extend; do not copy) | Agents OK |
| `local/` | Workbench: setup, dev, assert-db, reset, web-remote | Agents OK (except `reset` TTY) |
| `content/` | Pull / package / propose drafts | Agents OK |
| `check/` | Quality gates (`check:*`) | Agents OK |
| `preview/` | Local CF preview (`r2:sync`, `preview:cf`) | Agents OK |
| `ops/` | Neon/R2/CMS-remote break-glass | Humans TTY only |
| `content-packages/` | Transfer artifacts (not source of truth) | Agents OK (read/write packages) |

Do not nest `AGENTS.md` here. One-shot GitHub admin: [`.github/admin/`](../.github/admin/).
