---
name: discoverability
description: "Steer SEO, Open Graph/WhatsApp cards, robots.txt, sitemap, and LLM surfaces (/llms.txt, /llms-full.txt). Use when editing Base.astro meta, Site Settings llms, seoFields, robots.txt, llms.ts, llms endpoints, editors/seo.md, editors/llms.md, or when the user mentions SEO, OG, WhatsApp, llms.txt, AI crawlers, or social sharing."
---

# Discoverability

Ownership map: [`docs/architecture/08-concepts.md`](../../../docs/architecture/08-concepts.md) (Discoverability). Editors: [`llms.md`](../../../docs/editors/llms.md), [`seo.md`](../../../docs/editors/seo.md). Spec: [llmstxt.org](https://llmstxt.org/).

## Rules

1. `/llms.txt` = curated index (under ~20 KB). `/llms-full.txt` = main page sections; link from `## Optional`.
2. Identity only in Site Settings → `llms`. Page blurbs only via `metaDescription`. No per-page LLM fields.
3. Never hand-author `public/llms.txt` or `public/llms-full.txt`.
4. OG: absolute HTTPS image, 1600x900 JPEG under ~300 KB, image alts, `summary_large_image`.
5. Do not reintroduce an assembled-facts fallback in `llms.ts`. Do not add `.md` page mirrors or `/.well-known/llms.txt` without an explicit decision.
6. Sitemap is emitted by `@astrojs/sitemap` (`astro.config.mjs`) as `sitemap-index.xml` covering every static route; never hand-author one. `robots.txt` is hand-maintained at `apps/web/public/robots.txt`: allow-all with named AI crawlers and the `Sitemap:` line. Do not let a CDN or tooling default silently flip that allow stance.

## Same-PR checklist

- [ ] New/removed public route → update `buildRouteTable` in `llms.ts`
- [ ] `llms` / `seoFields` schema change → `content.ts` + seed + `generate:types` + migration
- [ ] Preserve the curated `llms` block in site-settings across `build-page-content.mjs` regenerations (identity is CMS-owned; Site Settings global)
- [ ] Ownership/field change → `08-concepts.md` and the matching editor doc
- [ ] Rebuild; spot-check `dist/llms.txt` (and `llms-full.txt` if bodies changed)
- [ ] Until CMS-mode CI exists: manually spot-check `CONTENT_SOURCE=cms` build when touching `content.ts` llms mapping
