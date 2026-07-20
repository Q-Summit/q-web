# scripts/ops/

Human-only TTY **break-glass**. Agents NEVER run these non-interactively.

**Decision gate:** Need editable JSON drafts? → `make pull` / `make propose` ([`content-sync.md`](../../docs/dev/content-sync.md)). Need a full local DB/media clone? → `ops:mirror-db` / `ops:mirror-media` (human TTY only).

| pnpm | File | What it does |
| --- | --- | --- |
| `ops:mirror-db` | `mirror-db.mjs` | Neon SQL dump → local Docker (PII) |
| `ops:mirror-media` | `mirror-media.mjs` | Remote R2 → local MinIO |
| `ops:cms-remote` | `cms-remote.mjs` | Payload admin on real Neon (no schema push) |

**Do not confuse with** `make pull` / `content:pull` (published REST → JSON package under `scripts/content-packages/current/`).

Safer read-only remote text: `pnpm dev:web:remote` → `scripts/local/web-remote.mjs`.

Catalog: [`docs/dev/scripts.md`](../../docs/dev/scripts.md).
