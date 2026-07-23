# apps/cms DESIGN.md

Visual rules for the **custom admin surfaces** only. These live inside Payload's admin, so Payload owns the design tokens and this app owns a thin layer on top. There is exactly one stylesheet, [`src/app/(payload)/custom.css`](<src/app/(payload)/custom.css>), imported once from `src/app/(payload)/layout.tsx` on the line after `@payloadcms/next/css`. Payload 3.86 has no `admin.css` config key, so that import is the only supported way in. No inline `style={{}}` objects except values genuinely computed from props or state.

This file does **not** govern the public website. That is [`apps/web/DESIGN.md`](../web/DESIGN.md), and the **design-system** skill is scoped to it, not here.

## Sizing

`1rem` in this admin is **13px**, and **12px below 1024px**. Payload's own headings are compiled absolute px from its Sass `base()` function, so they hold 32/26/20/16/13/12px at both roots. Anything written in `rem` drifts away from the chrome beside it at that breakpoint.

`calc(var(--base) * n)` is not an escape hatch for type either: `--base` is itself rem derived and computes to 18.46px at the 12px root. Use it for spacing, never for `font-size`.

| Role        | Size        | How                          |
| ----------- | ----------- | ---------------------------- |
| Page title  | 32px / 36px | bare `<h1>`, declare nothing |
| Section     | 26px / 32px | bare `<h2>`, declare nothing |
| Card title  | 16px / 20px | `.qs-card__title`            |
| Sub heading | 13px / 16px | `.qs-card__sub`              |
| Body        | 13px / 20px | declare nothing              |
| Meta        | 12px / 20px | `.qs-meta`, the floor        |

Nothing renders below 12px. Weights are 400, 500 and 600, never 700. Spacing comes from `--qs-space-*`, which sits on Payload's 20px grid.

## Color

Only `--theme-*` tokens, reached through the `--qs-fg-*` and `--qs-surface` roles. Never use `opacity` to dim text: it composites the whole subtree, multiplies when nested, and is not theme aware.

**Never use a `-500` token.** Payload's dark block skips the -500 rung on every ramp, jumping 450 to 550, so `--theme-elevation-500`, `--theme-error-500`, `--theme-success-500` and `--theme-warning-500` are the only tokens that do not invert in dark mode. Use -600 or -650.

`--theme-elevation-25` does not exist. Anything filled with it renders transparent.

Radii are `--style-radius-s|m|l` only. Payload ships exactly three and there is no fourth.

## Cascade layers

Payload declares `@layer payload-default, payload;` and fills only the first. New `.qs-*` rules stay **unlayered**, because unlayered CSS beats every layer before specificity is consulted. That is what lets the focus rules defeat Payload's `a:focus { outline: none }`, which otherwise removes the keyboard indicator from every custom link. Rules that target Payload's own selectors go in `@layer payload` instead. Never `!important`.

## Reuse before inventing

Reach for what Payload already ships:

- Classes: `.btn` with `--style-subtle|secondary|primary`, `--size-small|large` and `--no-margin`; `.table` (scroll container, zebra rows, header color, cell padding, in-cell focus rings); `.nav__link` and `.nav__label`; `.field-type`; `.sr-only`.
- Components from `@payloadcms/ui`: `Banner`, `Pill`, `Gutter`, `SetStepNav`, `FieldLabel`.

Two traps worth writing down, because both cost time in the audit that produced this file: `table--appearance-default` has no rule in 3.86 and is inert, and `nav-group__label` does not exist at all.

## Overriding Payload's own surfaces

Three things in `@layer payload` deliberately overrule Payload's defaults, all for legibility:

- **Nav group headings** (`.nav__label`, `.nav-group__toggle`). Payload ships `--theme-elevation-400`, which is 2.81:1 on the light background: below the 3.32:1 floor this file reserves for inert affordances, on the text that names each section. The `:hover` / `:focus-visible` restatement beside it is **mandatory**, not defensive: a cascade layer wins over an earlier layer before specificity is consulted, so the color rule would otherwise cancel Payload's own hover response.
- **Upload previews** (`.qs-logo-field`, `.qs-portrait-field`). Payload renders an upload field at 40px square with `object-fit: cover`, which crops a wide partner mark down to about two letters. Put `admin.className: "qs-logo-field"` on a logo upload field and `"qs-portrait-field"` on a person photo. Logos additionally get `object-fit: contain` and a checkerboard backdrop, because most are transparent and were invisible against one theme or the other. `align-self: center` in those rules is load-bearing: `.thumbnail:not(.thumbnail--size-none)` sets `align-self: stretch`, which beats `height` alone.
- **`.cell-filename .file__thumbnail`** enlarges the media library's list thumbnails. Scoped to that column deliberately: it is the only list column that renders a real image. Payload swaps in its File cell for the `filename` field **of an upload collection**; an upload _field_ on any other collection falls back to a relationship cell that renders the literal `<No Logo>`. Do not add an upload field to another collection's `defaultColumns` expecting a thumbnail -- it produces that placeholder instead.
- **`.qs-usage`** is the "Used on" panel on a media document. Its wrapper also carries Payload's own `.field-type` so it lines up with the field above it.

## Adding a new admin surface

Compose from `.qs-page`, `.qs-card`, `.qs-card__title`, `.qs-card__sub`, `.qs-col--*`, `.qs-meta`, `.qs-muted`, `.qs-link--strong` and `.qs-empty`. A prose view keeps the 880px reading measure; a view whose point is a data table adds `.qs-page--wide`. In a table, set the same `.qs-col--*` classes on the `th` and the `td`, because a column is as wide as its widest cell. If that needs new CSS, the gap is in the system: add the primitive to `custom.css`, document it here, and keep it reusable rather than adding a one-off.

A stylesheet is not a registered admin component, so it needs neither `generate:importmap` nor `generate:types`. Only adding, moving or renaming a component does.

## Do not

- No inline `style={{}}` for anything static.
- No fractional `rem`, no unitless `line-height`, no `letter-spacing` at micro sizes.
- No `opacity` on text.
- No `word-break: break-all`. Use `overflow-wrap: break-word`, or `anywhere` outside a table. `anywhere` also feeds intrinsic min-content sizing, so in a table column it collapses the column and wraps every value.
- No `!important`.
- No shadows. This admin is flat and border defined, and Payload exposes no shadow custom property to align to.

Enforced by `pnpm run check:cms-styles` ([`scripts/check/cms-styles.mjs`](../../scripts/check/cms-styles.mjs)).
