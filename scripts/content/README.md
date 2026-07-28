# scripts/content/

Content **package** CLIs (`content:*`). Agents MAY run these (drafts only). Working dir: `scripts/content-packages/current/`.

**FAQ quick path** (edit `bundle.json` only; upsert key `question` + `page`):

```sh
make pull ARGS='--collections faqs'
# edit scripts/content-packages/current/bundle.json
make propose ARGS='--dry-run'
make propose
```

| File | pnpm / Make | What |
| --- | --- | --- |
| `pull.mjs` | `make pull` / `content:pull` | Published REST → JSON package (no Neon) |
| `export.mjs` | `make package` / `content:export` | Local CMS published state → JSON package (drafts ignored) |
| `import.mjs` | `content:import` | Package → local drafts |
| `propose.mjs` | `make propose` / `content:propose` | Package → remote/local drafts via API |
| `sync-scope.mjs` | (module) | Allowlist |

**Not** Neon/R2 mirroring. That is `scripts/ops/` (`ops:mirror-db`, `ops:mirror-media`). Never `make package` after `make pull`.

`bundle.json` is the only file `propose` reads. `pull.mjs` does not write the per-collection/global sidecar JSONs under `collections/` and `globals/` by default (editing them without also updating `bundle.json` has no effect on propose); pass `--sidecars` to opt in to browse per-slug files.

`make-fixture.mjs` (`pnpm content:fixture -- --from <snapshot dir>`) regenerates the committed fake CI fixture at `apps/web/test/fixtures/ci-content/` from a maintainer-held content snapshot; rerun it after content-schema changes.

Runbook: [`docs/dev/content-sync.md`](../../docs/dev/content-sync.md). Catalog: [`docs/dev/scripts.md`](../../docs/dev/scripts.md).
