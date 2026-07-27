# Lighthouse agent report (example)

This file is the **committed format reference**. Live scores after a run land in gitignored `AGENT.md`; never treat this example as current performance.

Generated: (example) 2026-07-28T00:00:00.000Z Mode: `cf` -- Cloudflare wrangler --local (Assets + Worker /media/* from R2) Simulation: Lighthouse mobile defaults (moto g power, Slow 4G simulate, CPU 4x). Thresholds (Q1): performance/a11y/best-practices/seo ≥ 90. CWV bands from web.dev.

## Scores

| Route | Perf | A11y | BP | SEO | LCP | CLS | TBT | Verdict |
| --- | --: | --: | --: | --: | --- | --- | --- | --- |
| / | 99 | 100 | 96 | 100 | 2.1 s (good) | 0 (good) | 30 ms (good) | PASS |
| /speaker/ | 100 | 100 | 96 | 100 | 1.5 s (good) | 0 (good) | 0 ms (good) | PASS |

## Actionable findings

### /

- **LCP element:** `video#hero-video` with `poster="/media/hero-poster.jpg"`
- **LCP breakdown:**
  - Time to first byte: 13 ms
  - Resource load delay: 14 ms
  - Resource load duration: 27 ms
  - Element render delay: 75 ms
- **CLS culprits:** none reported
- **Top opportunities (est. savings):**
  - **Reduce unused JavaScript** (Est savings of 84 KiB): `unused-javascript`
    - `/_astro/hls.light.…js` (~84 KiB)
  - **Improve image delivery** (Est savings of 209 KiB): `image-delivery-insight`
    - `/_astro/…avif` (oversized for display size)
  - **Render-blocking requests** (see samples): `render-blocking-insight`
    - `/_astro/Base.…css`
- **Diagnostics to check:** same ids as opportunities when score is below 0.9

### /speaker/

- **LCP element:** first speaker card image (eager / `fetchpriority=high`)
- **CLS culprits:** none reported
- **Top opportunities:** none scored below 0.9

## How agents should act

1. Prefer fixing **FAIL** verdicts and any CWV rating that is not `good`.
2. Use **LCP element** + breakdown to decide preload / poster / image pipeline work.
3. Use **CLS culprits** for missing dimensions or late-injected content.
4. Use opportunity sample paths (under `/_astro/` or `/media/`) to find the component or asset.
5. Re-run: `make lighthouse ARGS='--skip-build --skip-seed --urls=/'` then re-read **`AGENT.md`** (not this example).

## How to re-run

```sh
make lighthouse
make lighthouse ARGS='--skip-build --skip-seed --urls=/'
make lighthouse ARGS='--mode=astro'
make lighthouse ARGS='--with-picture'
```
