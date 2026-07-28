# scripts/preview/

Local Cloudflare-shaped preview (not a production deploy).

| File          | pnpm         |
| ------------- | ------------ |
| `r2-sync.mjs` | `r2:sync`    |
| `cf.mjs`      | `preview:cf` |

Front door: `make preview` (sync then cf). Catalog: [`docs/dev/scripts.md`](../../docs/dev/scripts.md).
