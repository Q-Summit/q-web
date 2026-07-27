# `.lighthouse/` -- local Lighthouse artifacts (Q1)

**Shared in git (this folder's contract):**

| File | Role |
| --- | --- |
| [`README.md`](README.md) | This page: how agents/devs use the loop |
| [`AGENT.example.md`](AGENT.example.md) | Example agent report shape (committed) |

**Local only (gitignored after `make lighthouse`):**

| File | Role |
| --- | --- |
| `AGENT.md` | Fresh report for this machine: **agents read this after a run** |
| `summary.json` | Machine-readable aggregate |
| `*.findings.json` | Per-route findings (CWV, CLS, LCP, opportunities) |
| `*.report.html` / `*.report.json` | Full Lighthouse outputs |

If `AGENT.md` is missing, run `make lighthouse` (needs `make setup` once for Chrome-for-Testing). Until then, use [`AGENT.example.md`](AGENT.example.md) only as the **format reference**, not as live scores.

## Agent workflow

1. `make lighthouse` (prod-shaped: plain `/media/` imgs, like CI). Fast re-audit: `make lighthouse ARGS='--skip-build --skip-seed --urls=/'`. Local Picture optimism: `--with-picture`.
2. Open **`.lighthouse/AGENT.md`** (generated, not committed).
3. Fix issues called out under **Actionable findings** (LCP element, CLS culprits, opportunities with sample URLs).
4. Re-run until Verdict is PASS and CWV ratings stay `good` where possible.

Orchestration: `scripts/check/lighthouse.mjs`. Findings parser: `scripts/check/lighthouse-report.mjs`. Procedure: [`docs/dev/local-development.md`](../docs/dev/local-development.md) (Responsive images + Lighthouse).

## Simulation (what "real" means here)

- **Serve:** Cloudflare-shaped `wrangler --local` (Assets + Worker `/media/*` from local R2), unless `--mode=astro`.
- **Media markup:** Default skips `picture:sync` so HTML matches CI/prod (plain `/media/` `<img>`). Pass `--with-picture` only when intentionally measuring the local Astro `<Picture>` path.
- **Throttle:** Lighthouse mobile defaults (moto g power, Slow 4G simulate, CPU 4x).
- **Gates:** performance / accessibility / best-practices / SEO ≥ 90 (Q1). CWV bands from [web.dev](https://web.dev/articles/vitals).
