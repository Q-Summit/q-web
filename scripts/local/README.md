# scripts/local/

Day-to-day local workbench CLIs. Agents MAY: `setup`, `dev`, `web-remote`. Humans TTY: `reset`.

| File | pnpm / Make |
| --- | --- |
| `setup.mjs` | `make setup` |
| `dev.mjs` | `make dev` |
| `assert-db.mjs` | used by `seed`, cms `predev`, content export/import |
| `reset.mjs` | `make reset-local` (TTY) |
| `web-remote.mjs` | `pnpm dev:web:remote` (read-only published REST; not a content package) |

Catalog: [`docs/dev/scripts.md`](../../docs/dev/scripts.md). Content drafts: [`docs/dev/content-sync.md`](../../docs/dev/content-sync.md).
