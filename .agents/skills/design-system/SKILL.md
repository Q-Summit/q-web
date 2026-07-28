---
name: design-system
description: "Apply the q-web visual identity: design tokens, color and typography rules, section layout, the ui/ primitives, and the DESIGN.md format spec. Use when editing any Astro <style> block, tokens.css, global.css, components/ui/, apps/web/DESIGN.md, when adding a color/radius/duration/shadow, when a check:design failure needs fixing, or when the user mentions styling, tokens, design system, spacing, buttons, cards, sections, motion, animation, hover states, transitions, reduced motion, page transitions, or DESIGN.md."
---

# Design system

Truth: [`apps/web/DESIGN.md`](../../../apps/web/DESIGN.md) (visual identity, `LAYOUT-*` `COLOR-*` `TYPE-*` `DEPTH-*` `SHAPE-*` `COMP-*` `MOTION-*`) and [`apps/web/AGENTS.md`](../../../apps/web/AGENTS.md) (`PRIM-*`, the Astro primitives). Runtime values: `apps/web/src/styles/tokens.css`; base layer `global.css`. Remaining allowed literals: `apps/web/design-baseline.json` (ratchet, shrink only). Format spec: [google-labs-code/design.md](https://github.com/google-labs-code/design.md). Motion background: [`references/ui-animation.md`](references/ui-animation.md), a vendored upstream skill whose header table says which parts apply here.

DESIGN.md wins over any component-local styling. Read it before the component, not after.

## Rules

1. Token first, `global.css` class second, component-scoped style only for genuinely one-off layout. No raw hex, radius, duration, easing, font-size, font-weight, or box-shadow that a token already holds. All six are machine-enforced by the literals ratchet (COLOR-3, SHAPE-1, MOTION-1, TYPE-2, TYPE-4, DEPTH-1).
2. New token: add to `tokens.css` AND `DESIGN.md` front matter in the same edit. `check:design` diffs the two and fails on drift. Colors map `--color-X` to `colors.X`; radii `--radius-X` to `rounded.X`. Anything with no front matter home goes in `UNMAPPED_TOKENS` in `scripts/check/design.mjs` with a reason.
3. Deviating is allowed, silently deviating is not. Comment the deviation with the rule ID it deviates from and the live-site behavior that justifies it. Cite IDs verbatim (`DESIGN.md COLOR-1`); an unresolvable ID fails the check.
4. Section shells: `.section` + one `.container` (LAYOUT-1). Never hand-roll page width or `padding-block` on a shell (LAYOUT-1, LAYOUT-3). Never hand-set a navy background; use `.section.is-dark` (COLOR-2).
5. Orange is `.text-highlight` on an inline span, and nothing else, ever (COLOR-1).
6. Motion: durations and easings from tokens (MOTION-1); every animation needs a `prefers-reduced-motion` escape (MOTION-2); prefer `transform` and `opacity`, with paint-only properties allowed for hover feedback (MOTION-3); no animation library (MOTION-4); page transitions and scroll reveals are the shared CSS in `global.css`, not a per-component copy (MOTION-5). Depth comes from the five-step `--shadow-*` scale (DEPTH-1), weights from `--font-weight-*` (TYPE-4).
7. Plain shell to a `ui/` primitive; a shell the component styles through its own scoped `<style>` stays raw markup (PRIM-2). The test: does the shell's class have a rule in this component's `<style>`? No means use the primitive.
8. Used by 2+ pages means it does not live in a page component (COMP-3) and a new shared UI pattern becomes a `ui/` primitive (PRIM-3).
9. Never edit `apps/web/design-baseline.json` by hand or run `--update-baseline` to admit a new violation. It ratchets down only.

## Editing DESIGN.md

Front matter is normative tokens; prose is why. These eight are the canonical sections, and any that are present must appear in this order (they may be omitted, never reordered): Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts. Anything else is an extension section, which the spec preserves without complaint; `Motion` is ours, placed before Do's and Don'ts so no rule is cited before the section defining it. Duplicate `##` headings are a hard spec error. A rule is *defined* by a bold lead-in (`**LAYOUT-1 One page width.**`); that exact shape is what the checker parses, so keep it.

Component token props are limited to `backgroundColor`, `textColor`, `typography`, `rounded`, `padding`, `size`, `height`, `width`. Variants are separate entries (`button-secondary`, not a nested block). There is no shadow or motion token group in the spec: those live in `tokens.css` plus prose.

## Same-PR checklist

- [ ] `pnpm run check:design` green (spec, drift, citations, literals)
- [ ] New/changed token in BOTH `tokens.css` and `DESIGN.md` front matter
- [ ] New rule has a bold lead-in at the start of a line, a stable ID, a row in DESIGN.md's `## Rule index` table (the check enforces this), and at least one citation in code
- [ ] Removed rule: no citation left behind (the check catches this)
- [ ] Deviation carries a comment naming the rule ID
- [ ] Shared pattern promoted to `global.css` or `ui/`, not copied
- [ ] Cleared literals: re-run `pnpm run check:design --update-baseline` to tighten the ratchet
