# apps/web AGENTS.md

Astro static site for q-summit.com ([ADR-0001](../../docs/decisions/0001-astro-static-site.md)). Extends the root [AGENTS.md](../../AGENTS.md); closest wins on conflict. Local + CF how-to: [`docs/dev/local-development.md`](../../docs/dev/local-development.md), [`docs/dev/go-live.md`](../../docs/dev/go-live.md). Tooling catalog: [`docs/dev/scripts.md`](../../docs/dev/scripts.md).

## Commands

Run from the repo root:

```sh
make dev                    # default: Astro CMS mode against local Payload (repo root)
make dev-web                # escape hatch: JSON mode (fake fixture), no CMS
pnpm --filter web run dev:cms  # Astro against local Payload (also via make dev)
pnpm --filter web check     # astro check (typecheck)
pnpm --filter web build     # static build to apps/web/dist/
pnpm --filter web run cf-typegen  # regenerate worker-configuration.d.ts
pnpm run check:design       # DESIGN.md spec + token drift + rule citations + literals ratchet
make preview                # r2:sync + preview:cf (local CF; not a deploy)
pnpm run check:web          # check + build + test, wired into root pnpm run check
pnpm --filter web run vrt:docker  # visual regression vs committed baselines (pinned image)
```

## Visual regression

Every component's look is captured by a co-located `*.vrt.ts` (variants) that the
`/vrt/` gallery renders and Playwright screenshots against committed baselines
in `tests/visual/__screenshots__/`. It is an **advisory** PR review
(`.github/workflows/visual.yml`), NOT part of `pnpm run check` and never a
blocking status: a diff posts a sticky comment (with a hosted report link) and,
in AUTO mode, auto-commits refreshed baselines to the PR branch. Add coverage or
accept an intended change per [`docs/dev/visual-testing.md`](../../docs/dev/visual-testing.md)
([ADR-0007](../../docs/decisions/0007-visual-regression-testing.md)). Baselines
are never hand-committed from your own OS; they are regenerated in the pinned
image (AUTO, the `Update visual baselines` workflow, or `vrt:docker:update`).

## Design system

[`DESIGN.md`](DESIGN.md) is the authoritative visual identity and wins over any
component-local styling. It follows the [DESIGN.md format
spec](https://github.com/google-labs-code/design.md): YAML token front matter
mirroring `src/styles/tokens.css`, then prose rules with stable IDs
(`LAYOUT-1`, `COLOR-2`, `TYPE-1`, `DEPTH-1`, `SHAPE-1`, `COMP-3`, `MOTION-1`).

Before touching any `<style>` block, token, or `global.css` class, load the
**design-system** skill (`.agents/skills/`). Cite the rule ID in a comment when
you deviate, and never invent an ID: `pnpm run check:design` fails on a
citation that does not resolve, on front matter that drifts from `tokens.css`,
and on a new raw literal.

`/kickoff/` copies the Join Q zip glass design (DESIGN.md KICKOFF-1).
Do not restyle those components onto conference primitives.
Speaker crops and the location-card badge come from `page-kickoff`;
never key CSS or copy to a speaker name.

### UI primitives (`components/ui/`)

Two kinds live here. **Shells** (`Section`, `Container`, `SectionHeader`,
`Button`) are thin typed Astro wrappers over the `global.css` classes DESIGN.md
defines: they carry no styles of their own and exist so the markup is written
once. **Patterns** (`Timeline`, `LogoGrid`) are whole components shared by two
or more pages; they own their scoped CSS, which is allowed because they render
every element that CSS selects, so PRIM-2's boundary is never crossed. A
pattern keeps page-specific behavior behind an opt-in prop. These rules are
Astro implementation, not visual identity, which is why they live here rather
than in DESIGN.md, but they are cited the same way.

| Pattern | Props |
| --- | --- |
| `Timeline` | `items`, `images`, `reveal`, `priorityFirstImage`; also owns the `.timeline-intro` class for the caller's intro paragraph |
| `LogoGrid` | `logos`, `variant="tier"\|"hack"`, `featured`, `eager`, `flip` |

`Timeline`'s `reveal` emits `[data-reveal]`, which gates every scroll-driven
rule; the `IntersectionObserver` fallback for browsers without
`animation-timeline: view()` stays in `AgendaTimeline`, so a page that does not
opt in ships no script. `LogoGrid`'s two skins differ only in card values, held
as local custom properties on the list and re-pointed by `.is-hack`.

**PRIM-1 Standard section shells use the primitives.** `<Section>` (props
`variant="alternate"|"dark"`, `small`, `as="section"|"article"|"header"|"div"`
for a shell that is semantically not a `<section>`) wrapping a `<Container>`; the centered
opener is `<SectionHeader>`; buttons are `<Button>` (props `href`,
`variant="secondary"|"alternate"`, `small`). Each emits exactly the classes LAYOUT-1,
LAYOUT-3, LAYOUT-4, COLOR-2, and COMP-1 define, in the same order.

**PRIM-2 The boundary is scoping.** A primitive is style-less, so an element it
renders belongs to the primitive's scope, not the page's. Use a primitive only
for a plain shell. A section, container, or button that a component styles
through its own scoped `<style>` (a bespoke class like `.why` or `.hero`, or a
selector like `.cta .button`) stays raw markup in that component, because
scoped CSS only reaches elements the component itself renders. The test is
mechanical: if the shell's class has no rule in the component's own `<style>`,
it is a plain shell and must use the primitive.

**PRIM-3 A new shared UI pattern becomes a `ui/` primitive,** typed and
documented here, not a copy in a page folder. This is how COMP-3 is satisfied
for components. The two FAQ accordions (home, program) are intentionally
separate: they are different section layouts, not one pattern, and their only
shared piece (the `<details>` open and close animation) already lives in
`global.css`.

Every known styling gap is either fixed or written into
[`DESIGN.md`](DESIGN.md) as a rule; there is no separate debt list. So an
inconsistency you find is either covered by a rule, carries a code comment
citing the rule it deviates from, or is a genuine bug worth fixing. Seven of the
literal rules are machine-enforced, and the four remaining allowed literals are
listed in `design-baseline.json`.

## Content and Worker

- `WEB_CONTENT_DIR` pins the JSON-mode content directory. `build:fixture` sets it to `test/fixtures/ci-content` so `pnpm run check` always gates on the committed fixture; without the pin, a machine with the real snapshot restored at gitignored `apps/web/content/` would gate on that instead, and CI and local would silently be checking different builds.
- Content loaders in `src/lib/content.ts` (barrel → `src/lib/content/`): `CONTENT_SOURCE` is required and validated: `cms` (+ `CMS_URL` and `PUBLIC_CMS_URL`) for `make dev` and production, `json` for the committed fake fixture (`make dev-web`, CI) or an emergency-restored `content/` dir. Anything else, including unset, throws rather than silently building fixture data. Keep loader signatures/types stable.
- Design tokens live in `src/styles/tokens.css`, paired with `DESIGN.md`'s front matter (`check:design` enforces it).
- Keep live URL paths (`/whyq`, `/speaker`, `/partner`, `/job-listings`, ...) so inbound links survive cutover.
- SEO / LLM / social: load the **discoverability** skill. Surfaces: `Base.astro`, `lib/llms.ts`, `pages/llms*.txt.ts`, `public/robots.txt`. New public routes update `buildRouteTable` in the same PR. AI identity (`llms`) is curated in the CMS Site Settings global; `build-page-content.mjs` preserves it across snapshot regenerations.
- Cloudflare: `wrangler.jsonc` + `worker/index.ts` serve `/media/*` from R2 and proxy `/qm/*` to PostHog EU; everything else is static assets. Do not upload `dist/media/` (see `public/.assetsignore`).
- Analytics: cookieless PostHog client in `src/lib/analytics/` (ADR-0003; boots only on prod hostnames with `PUBLIC_POSTHOG_KEY`). Load the **posthog-analytics** skill before touching events, config, or the `/qm` proxy; reference: [`docs/dev/analytics.md`](../../docs/dev/analytics.md).

## Image pipeline

**Prod truth is R2** (Worker `/media/*`). Git never holds media binaries. Agents propose content packages (filenames + JSON); editors review/publish in CMS; images upload through Payload → R2.

| Tree | Role |
| --- | --- |
| `/media/<filename>` | Primary. Same keys in local `public/media/` (gitignored) or prod R2. Fixed paths live as string constants in `src/assets/media/*.ts`. |
| `public/media/` | Gitignored local seed / CF preview source. Feed CMS seed and `r2:sync`; never commit. |
| `src/assets/media/*` (binaries) | Optional gitignored local copies for `<Picture>` via `src/lib/images.ts`. Empty in CI/prod is fine (callers fall back to `/media/...` `<img>`). Keep `*.ts` path barrels in git. Local: `pnpm picture:sync` hardlinks from `public/media/`. |

Matching rules for dynamic filenames: exact basename, then strip trailing `-p-<size>`, then fuzzy normalize (same as `content.ts` `resolveMediaFilename`). Misses warn at build and fall back to a plain `/media/...` `<img>`. Hero/hack video is R2-only (not in Payload Media mimeTypes).

## ALWAYS

- TypeScript in frontmatter and `src/lib/`; styles via tokens in `src/styles/tokens.css`.
- Change `src/styles/tokens.css` and `DESIGN.md`'s front matter in the same edit; `check:design` fails if they drift.
- `design-baseline.json` is a ratchet of the raw literals left from the Webflow port. Entries may only be removed, and only via `pnpm run check:design --update-baseline` after the literal is actually gone. Never hand-edit it, and never regenerate it to admit a new violation.
- Self-host fonts via Astro's Fonts API in `astro.config.mjs` (`fontProviders.local()` reading the woff2 from `@fontsource-variable/montserrat`); `Base.astro` only renders the `<Font>` component.
- Keep share images (OG defaults) as 1600x900 JPEGs under ~300 KB so WhatsApp previews stay reliable.
- After `wrangler.jsonc` binding changes, run `cf-typegen` and commit `worker-configuration.d.ts`.

## NEVER

- Add runtime requests to third-party hosts (fonts, scripts, embeds, analytics other than the decided PostHog EU setup); the cookieless/no-banner property depends on it.
- Commit media binaries under `public/media/` or `src/assets/media/` (both gitignored). Seed CMS / R2 instead; content packages carry filenames only.
- Add an SSR adapter or server endpoints; output stays `static` per ADR-0001. Prerendered `*.txt.ts` endpoints (llms) are fine; they are not SSR.
- Hand-author `/llms.txt` or `/llms-full.txt` under `public/`.
- Hardcode machine-absolute content paths; defaults resolve relative to this package.
