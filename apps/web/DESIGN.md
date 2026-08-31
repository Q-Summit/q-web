---
version: alpha
name: Q-Summit
description: Visual identity for q-summit.com. Montserrat, navy brand, white and neutral grounds, orange strictly as a rare inline accent.
colors:
  navy: "#072077"
  orange: "#f9633b"
  white: "#ffffff"
  black: "#000000"
  neutral-darkest: "#111111"
  neutral-darker: "#222222"
  neutral-dark: "#444444"
  neutral: "#666666"
  neutral-light: "#aaaaaa"
  neutral-lighter: "#cccccc"
  neutral-lightest: "#eeeeee"
  success: "#027a48"
  success-light: "#ecfdf3"
  error: "#b42318"
  error-light: "#fef3f2"
  focus: "#0050bd"
  highlight: "#ffe066"
  background: "{colors.white}"
  background-alternate: "{colors.neutral-lightest}"
  background-dark: "{colors.navy}"
  text: "{colors.black}"
  text-inverse: "{colors.white}"
  heading: "{colors.navy}"
  primary: "{colors.navy}"
  accent: "{colors.orange}"
  kickoff-ice: "#bbe4ff"
  kickoff-ice-bright: "#9fdcff"
  kickoff-mid: "#3875df"
  kickoff-ground: "#f7fbff"
  kickoff-deep: "#1b2284"
  kickoff-midnight: "#080759"
  kickoff-option: "#1236b6"
  kickoff-option-hover: "#1744d2"
  kickoff-option-deep: "#0b2fa8"
  kickoff-option-ink: "#08227f"
  kickoff-badge: "#061a69"
  kickoff-cyan: "#74ccff"
typography:
  h1:
    fontFamily: Montserrat
    fontSize: 3.5rem
    fontWeight: 700
    lineHeight: 1.2
  h1-home:
    fontFamily: Montserrat
    fontSize: 4rem
    fontWeight: 900
    lineHeight: 1.2
  h2:
    fontFamily: Montserrat
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.2
  h3:
    fontFamily: Montserrat
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.2
  h4:
    fontFamily: Montserrat
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.3
  h5:
    fontFamily: Montserrat
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.4
  h6:
    fontFamily: Montserrat
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: Montserrat
    fontSize: 1rem
    lineHeight: 1.5
  body-tiny:
    fontFamily: Montserrat
    fontSize: 0.75rem
    lineHeight: 1.5
  body-small:
    fontFamily: Montserrat
    fontSize: 0.875rem
    lineHeight: 1.5
  body-medium:
    fontFamily: Montserrat
    fontSize: 1.125rem
    lineHeight: 1.5
  body-large:
    fontFamily: Montserrat
    fontSize: 1.25rem
    lineHeight: 1.5
rounded:
  button: 5px
  button-small: 7px
  card: 10px
  card-large: 20px
  pill: 50px
  kickoff-card: 34px
  kickoff-card-compact: 30px
  kickoff-copy: 26px
  kickoff-copy-compact: 22px
  kickoff-frame: 46px
  kickoff-cta: 42px
  kickoff-result: 24px
  kickoff-pill: 999px
  kickoff-logo: 1.45rem
  kickoff-mark: 15px
  kickoff-quiz-compact: 28px
  kickoff-step-num: 1rem
spacing:
  section: 6rem
  section-small: 4rem
  section-gap: 3rem
  section-header-gap: 1rem
  space-2xs: 0.5rem
  space-xs: 0.75rem
  space-sm: 1rem
  space-md: 1.5rem
  space-lg: 2rem
  space-xl: 3rem
  container-large: 80rem
  container-medium: 64rem
  container-small: 48rem
  container-marquee: 120rem
components:
  section:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    padding: "{spacing.section}"
  section-small:
    padding: "{spacing.section-small}"
  section-alternate:
    backgroundColor: "{colors.background-alternate}"
  section-dark:
    backgroundColor: "{colors.background-dark}"
    textColor: "{colors.text-inverse}"
  container:
    width: "{spacing.container-large}"
    padding: 5%
  section-header:
    width: "{spacing.container-small}"
    typography: "{typography.body}"
  section-header-intro:
    textColor: "{colors.neutral-dark}"
  section-header-intro-dark:
    textColor: "{colors.neutral-lighter}"
  button:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.button}"
    padding: 0.75rem 1.5rem 0.65rem
    typography: "{typography.body}"
  button-hover:
    backgroundColor: "{colors.background}"
    textColor: "{colors.primary}"
  button-alternate:
    rounded: "{rounded.button-small}"
  button-secondary:
    textColor: "{colors.text}"
    rounded: "{rounded.button-small}"
  button-small:
    rounded: "{rounded.button-small}"
    padding: 0.5rem 1.25rem
  card:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.card}"
  text-highlight:
    textColor: "{colors.accent}"
  skip-link:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.button-small}"
    padding: 0.75rem 1.25rem
---

# Q-Summit design system

Authoritative visual identity for `apps/web` (the Astro site at q-summit.com). These rules win over any component-local styling.

The token values above are normative but not the runtime source: they mirror [`src/styles/tokens.css`](src/styles/tokens.css), which is what the site actually ships. `pnpm run check:design` fails if the two drift apart, so change `tokens.css` and this frontmatter in the same edit.

The mirror is not total. Eight groups the spec's type system cannot express stay in `tokens.css` only, allow-listed by name in `scripts/check/design.mjs`: `--radius-circle` (`50%`, not a `px`/`em`/`rem` Dimension), `--color-overlay` (an alpha `rgb()`), the motion tokens and the shadow tokens (the spec has neither group), `--font-primary` (Astro Fonts API indirection), `--text-size-regular` (the same 1rem step as `typography.body`), the four line-height tokens, and the five standalone font weights (the spec carries weight only inside a composite typography token). `components.container.padding: 5%` is the same deviation in the other direction, kept because the shipped container really does use a percentage. Shadows and motion are therefore governed by prose here, not by front matter.

Four raw literals from the Webflow port are still allowed, ratcheted in [`design-baseline.json`](design-baseline.json): three off-scale font sizes (`home/Hero.astro` 2.75rem, `home/WhyCards.astro` 1.7rem, `hackathon/HackHero.astro` 0.5rem, all TYPE-2) and the partner marquee's computed period (`home/PartnerLogos.astro`, MOTION-1). That file only ever shrinks: clear a literal, then re-run `pnpm run check:design --update-baseline`. Never regenerate it to admit a new one.

Rules carry stable IDs (`LAYOUT-1`, `COLOR-2`, ...). Code comments cite them by ID, so a rule can be added or removed without renumbering anything. The same check verifies that every ID cited in the codebase resolves to a rule that still exists. Astro implementation rules for the `ui/` primitives are cited as `PRIM-*` and live in [`AGENTS.md`](AGENTS.md), not here: this file describes the visual identity, that one describes how to build against it.

## Rule index

Every rule, with the token or class it is about. Cite these IDs verbatim in code comments; `pnpm run check:design` fails on an ID that does not resolve, and on a rule defined here but never cited.

| ID | Rule | Governs |
| --- | --- | --- |
| COLOR-1 | Orange only as `.text-highlight` on an inline span | `--color-accent` |
| COLOR-2 | Dark sections use `.section.is-dark` | `--color-background-dark` |
| COLOR-3 | No color literals in components | `--color-*` |
| TYPE-1 | Headings inherit the global element styles | `--heading-*` |
| TYPE-2 | Body sizes come from the scale | `--text-size-*` |
| TYPE-3 | Montserrat is the only family | `--font-primary` |
| TYPE-4 | Weights come from tokens | `--font-weight-*`, `--heading-weight*` |
| LAYOUT-1 | One page width | `.section` + `.container` |
| LAYOUT-2 | Medium and small containers are measure limits | `--container-medium/small` |
| LAYOUT-3 | Section padding comes only from `.section` | `--section-padding*` |
| LAYOUT-4 | Openers use `.section-header` | `.section-header` |
| SPACE-1 | Spacing values that have a token use it | `--space-*` |
| DEPTH-1 | Shadows come from the scale | `--shadow-*` |
| SHAPE-1 | Radii come from tokens | `--radius-*` |
| COMP-1 | Buttons are `.button` plus documented variants | `.button` |
| COMP-2 | Cards use the card radius and the neutral hairline | `--radius-card` |
| COMP-3 | A pattern used by 2+ pages leaves the page component | `global.css` |
| COMP-4 | Accordions are native `<details>` | `global.css` |
| COMP-5 | Data tables rule black at 1px, not the card hairline | `--color-black` |
| MOTION-1 | Durations and easings come from tokens | `--duration-*`, `--ease-*` |
| MOTION-2 | Every animation has a reduced-motion escape | `prefers-reduced-motion` |
| MOTION-3 | Animate transform and opacity only | `transform`, `opacity` |
| MOTION-4 | No client-side animation runtime | `package.json` |
| MOTION-5 | Page transitions and reveals have one implementation each | `@view-transition`, `ui/Timeline` |
| KICKOFF-1 | Join Q is its own visual system | `components/kickoff/` |

Astro implementation rules (`PRIM-1` to `PRIM-3`) live in [`AGENTS.md`](AGENTS.md).

## Overview

Restrained conference minimalism, not startup maximalism. The page is a white ground with generous vertical air, deep navy typography carrying almost all of the brand weight, and a single warm orange reserved for the rare word that has to be noticed. Rhythm comes from full-width bands of alternating background, never from decoration: shadows only from the `--shadow-*` scale and used sparingly, and no borders beyond a hairline on cards. The few gradients are functional scrims and mask fades over media, never ornament.

The identity is inherited from the live Webflow site and was ported deliberately, not reinvented. When something here looks arbitrary, it usually matches what q-summit.com already ships; deviations need a comment saying which live-site behavior justifies them.

## Colors

The palette is one brand color, one accent used sparingly, and a neutral ramp. Everything else (success, error, focus, highlight) is functional and appears only where the function does.

- **Navy (`#072077`)** carries the brand. Headings, primary buttons, dark section grounds, stat numbers, icons, borders, and hover states are navy or neutral.
- **Orange (`#f9633b`)** is an accent, not a color in the palette's normal sense. On the live site it appears on discounted ticket prices and single highlighted words, nowhere else.
- **Neutral ramp (`#111111` to `#eeeeee`)** does the rest: `neutral-lightest` is the alternate section ground, `neutral-lighter` is the card hairline, `neutral-dark` is secondary text on light, `neutral-lighter` is secondary text on dark.
- **Focus blue (`#0050bd`)** is accessibility infrastructure. The focus ring pairs it with a wider white outer ring, so whichever ground it lands on some part of the composite indicator clears 3:1: the blue against white on light sections, the white ring against navy on dark ones (WCAG 1.4.11).

**COLOR-1 Orange is allowed in exactly one form:** `.text-highlight` on an inline span. There are no orange buttons, headings, icons, borders, or hover states anywhere on the live site, and `global.css` deliberately ships no orange button variant.

**COLOR-2 Dark sections use `.section.is-dark`.** Never hand-set a navy background. `.is-dark` also flips headings and the section-header intro to the inverse ramp, which a hand-rolled background does not.

**COLOR-3 No color literals in components.** Every color comes from a `var(--color-*)` token. If a needed color has no token, add it to `tokens.css` and to this file's frontmatter in the same change rather than inlining a hex.

## Typography

One family, self-hosted, no runtime request to a font CDN (the cookieless, no-banner property depends on that). Montserrat Variable ships through `@fontsource-variable/montserrat` and is wired via Astro's Fonts API in `Base.astro`, which also generates a metric-matched fallback face so the swap does not reflow the page. Weights 300 to 900 are used; only the home hero and the partner-page quote mark go to 900.

The scale is fluid by breakpoint rather than by `clamp()`, because custom properties cannot hold media queries: `tokens.css` re-declares h1 to h4 at 991px; the section padding and gap, h1 to h6, and the two largest body steps at 767px; and the home hero size at 479px. The front matter above publishes the desktop value of each.

**TYPE-1 Headings inherit the global element styles.** `h1` to `h6` already carry navy, the `--heading-*` size, and the right line height from `global.css`. A component does not restate heading color or size unless the live site demonstrably deviates, and then a comment says why.

**TYPE-2 Body sizes come from `--text-size-*`.** Do not write bare `rem` font sizes that duplicate an existing step.

**TYPE-3 Montserrat is the only family.** No second face, no icon font, no `@import` from a third-party host.

The site ships three eyebrow voices, and that is declared rather than unresolved: a small bold navy label (`.u-eyebrow`), a light widely tracked kicker over the speaker page hero (`.is-kicker`), and a neutral, heavier, tightly tracked kicker on the hackathon schedule (`.is-quiet`). Two contact-page labels are sentence case (`.is-sentence`). One shared rule defines the treatment and each variant declares its difference, so the drift is visible in one file instead of spread across five components. Whether three voices should be fewer is a design decision for a designer, not a refactor.

**TYPE-4 Weights come from tokens.** The scale is complete, so there is no reason to write a number: `--font-weight-light` (300), `--font-weight-regular` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-extrabold` (800), plus `--heading-weight` (700) and `--heading-weight-home` (900), which keep their heading-role names and are borrowed by the few non-heading elements that need that weight. Machine-enforced: a bare numeric weight fails `check:design`.

## Layout

Every page is the same shape: a stack of full-bleed section bands, each with its content in one centered container. Page width is a property of the design system, not of any component.

**LAYOUT-1 One page width.** Every section is a full-bleed element (`class="section"`, plus `is-alternate` / `is-dark` / `is-small` as needed) whose content sits in one `<div class="container">` (`--container-large`, 80rem). No component defines its own page width.

The sanctioned exception is the breakout band: an element that deliberately runs edge to edge on any viewport up to `--container-marquee` (120rem, a full 1080p browser window) and is capped and centered, not full-bleed, on wider screens. Two ship it, on the same token and the same `width: min(100%, var(--container-marquee)); margin-inline: auto` shape: the home partner-logo marquee (`src/components/home/PartnerLogos.astro`) and the speaker page's Previous Highlights rail (`src/pages/speaker.astro`). Their inner content still lines up with `--container-large`, so the page's text column does not move. Any future breakout needs the same treatment, on this token or on a dedicated `--container-*` one of its own: capped and centered, never an unbounded full-bleed element.

**LAYOUT-2 `--container-medium` and `--container-small` are measure limits, not section widths.** They cap a text block inside a container (an intro paragraph, a legal body). They never set the width of a section.

**LAYOUT-3 Section vertical padding comes only from `.section` and `.is-small`.** Components never hand-roll `padding-block` for a section shell. Padding on inner elements is fine; this rule is about the shell.

Spacing _inside_ a section comes from a six-step scale: `--space-2xs` (0.5rem), `--space-xs` (0.75rem), `--space-sm` (1rem), `--space-md` (1.5rem), `--space-lg` (2rem), `--space-xl` (3rem). It covers gaps and the padding or margin of inner elements. The steps were not designed, they were counted: each one is a value the Webflow port already wrote by hand in a dozen or more declarations, so adopting the scale changed no pixel. A value that is not a step (1.25rem, 1.75rem, 2.5rem, 5rem, and the handful of sub-rem nudges) stays raw; snapping it onto a step would be a redesign, and a scale that renames every value is not a scale. Section shell rhythm stays out of this scale and remains `--section-padding`, `--section-padding-small`, and `--section-gap` (LAYOUT-3), which are the tokens that shift at the 767px breakpoint.

**SPACE-1 Spacing values that have a token use it.** The `--space-*` steps were counted from what the port already shipped, not designed, so a raw `1.5rem` gap is a missed token rather than a judgement call. Values with no step (`1.25rem`, `1.75rem`, `4rem`, the sub-rem nudges) stay raw on purpose; only the six steps are enforced.

**LAYOUT-4 Section openers use `.section-header`,** a centered `h2` with an optional intro. Left-aligned or two-column openers are the exception and need a comment giving the reason.

## Elevation & Depth

Separation is carried by background bands (`.is-alternate`, `.is-dark`) and hairline borders. Shadows are the fallback, not the default: two components document having removed one in favour of a hairline (`src/components/hackathon/BenefitCards.astro`, `src/components/home/SpeakerGrid.astro`), and that is the direction of travel.

Where depth is genuinely needed there are five steps, not the twelve one-off values the Webflow port shipped:

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-subtle` | `0 1px 4px rgb(0 0 0 / 0.06)` | A whisper on a light card, where a border would be too hard |
| `--shadow-card` | `0 2px 4px rgb(0 0 0 / 0.2)` | Resting state of a card that floats rather than sits |
| `--shadow-card-hover` | `0 4px 12px rgb(0 0 0 / 0.2)` | The lift that pairs with a `translateY` on hover |
| `--shadow-lifted` | `0 8px 18px rgb(0 0 0 / 0.14)` | A card sitting above the page rather than on it |
| `--shadow-floating` | `0 12px 26px rgb(0 0 0 / 0.12)` | The deepest step, for the few cards that genuinely float |

The five steps were chosen to sit on the twelve shipping values, not to look tidy. Every card landed within a couple of pixels of blur and about 0.02 of alpha, except the hackathon partner cards, whose unusually light resting float (`0 10px 25px / 0.08`) is now `--shadow-lifted`: slightly tighter and slightly darker. A scale that merely renames every existing value is not a scale, but one that redesigns the page is worse.

The DESIGN.md spec has no shadow token group, so these live in `tokens.css` and are governed by this prose. `scripts/check/design.mjs` allow-lists them by name.

**DEPTH-1 Shadows come from the `--shadow-*` scale.** Reach for a hairline border and a background band first. Never add a sixth step without deleting one.

The only sanctioned raw `box-shadow` is the zero-blur ring: the focus ring in `global.css`, and the background-colored halo behind the timeline dots (`src/components/ui/Timeline.astro`). Those are rings, not elevation, so no `--shadow-*` step can express them.

## Shapes

Radii are small and functional. Buttons are nearly square (5px and 7px), cards are gently rounded (10px, 20px for the large variant), and the pill and circle radii exist for avatars, badges, and toggles.

**SHAPE-1 Radii come from `--radius-*` tokens.** No bare `px` radius in a component.

## Components

Shared patterns live in `global.css` as flat classes, and the `ui/` Astro components are style-less typed wrappers over those classes (see `PRIM-*` in [`AGENTS.md`](AGENTS.md)). Not every pattern has earned a class: `.button` is real and shipped, while the card is small enough that each component declares it, so for cards the tokens are the whole contract.

**COMP-1 Buttons are `.button` plus its documented variants** (`.is-alternate`, `.is-secondary`, `.is-small`) from `global.css`. No hand-styled anchor or button.

**COMP-2 Cards use `--radius-card` and a `--color-neutral-lighter` border.** There is no shared `.card` class to inherit from, so this rule is the contract.

**COMP-3 A pattern used by 2+ pages does not live in a page component.** A shared _style_ goes into `global.css` and into this file in the same change; a shared _component_ becomes a `ui/` primitive (`PRIM-3` in [`AGENTS.md`](AGENTS.md)).

Shared utilities carry a `u-` prefix, so a class name says at a glance whether it is site furniture or a component's own. There are five:

| Class | What it is | Local override |
| --- | --- | --- |
| `.u-visually-hidden` | Present for assistive technology, not painted. The standard clip-rect block, next to `.skip-link` because both are the same accessibility family | None |
| `.u-eyebrow` (+ `.is-kicker`, `.is-sentence`, `.is-quiet`) | The small uppercase label above a heading: `--text-size-small`, `--font-weight-semibold`, `0.15em` tracking, `--color-primary` | Color, where the ground demands it (a dark section), and the gap to the heading |
| `.u-section-cta` | Centered button row closing a section: `--section-gap` above, `text-align: center` | `margin-top`, where the live spacing differs |
| `.u-accordion-summary` | The clickable row of a `<details>` accordion (COMP-4): label left, chevron right, native marker removed | The hairline, the label's type, the gap, the mobile padding, and the `[open]` chevron rotation |

`.u-eyebrow` and `.u-section-cta` set `margin: 0` and a default gap respectively, so a site adds only the one declaration that is genuinely its own. Anything more than that is a sign the pattern is not actually shared.

The footer's column labels are deliberately not `.u-eyebrow`: they label a navigation list rather than introducing a heading, and stay smaller and tighter.

**COMP-5 Data tables rule with `--color-black` at 1px,** not the card hairline. A dense comparison grid needs its rules to read as structure; `--color-neutral-lighter` disappears at that density. COMP-2 governs cards only, so do not "fix" a table into it.

**COMP-4 Accordions are native `<details>`/`<summary>`.** The shared open and close animation lives in `global.css`, once, for every accordion on the site, and so does the summary row itself (`.u-accordion-summary`) and the chevron (`src/components/icons/IconChevron.astro`). No JS widget replaces the native element. What stays with each accordion is what genuinely differs: its hairline, its label type, and the `[open]` rotation, which targets that accordion's own chevron box.

PRIM-3's note that the home and program FAQs are "intentionally separate" is about their section layouts, which really are two designs (a two-column copy-plus-list band, and a single left-aligned column). It is not a license to re-copy the summary row inside them.

## Motion

Motion is small, fast, purposeful, and interruptible. The timing model follows the vendored [`ui-animation`](../../.agents/skills/design-system/references/ui-animation.md) reference, and two of that reference's three "pro curves" are already this repo's tokens: `--ease-snappy` is its Snappy, `--ease-emphasized` is its Emphasized.

| Trigger | Curve | Duration |
| --- | --- | --- |
| User opens something (accordion, toggle, skip link) | `--ease-snappy` | `--duration-open` 260ms |
| The same thing closing | `--ease-snappy` | `--duration-close` 200ms |
| Icon rotating with its control | `--ease-snappy` | `--duration-icon` 180ms |
| Hover and focus feedback | `--ease-snappy` | `--duration-hover` 150ms |
| Element moving on screen, scroll-driven reveal | `--ease-emphasized` | `--duration-reveal` 500ms |
| Cross-document page transition | `--ease-snappy` | `--duration-page` 220ms |
| Sliding in from an edge (sheet, drawer) | `--ease-buttery` | context |
| Continuous loop (the partner marquee) | `linear` | the loop's own period |

Exit is faster than enter, hover stays under 150ms, and nothing crosses 500ms. `linear` is for loops and for scroll-driven timelines whose progress is the scroll position rather than a clock: the partner-logo marquee, and the timeline's rail and reveal keyframes in `ui/Timeline.astro`. It is never the curve for a click-triggered transition, where it reads as robotic.

**MOTION-1 Durations and easings come from tokens.** No inline `cubic-bezier()` or bare `ms` value.

**MOTION-2 Every animation has a `prefers-reduced-motion: reduce` escape,** and reduced motion means no transition at all, not a shorter one. Prefer simplifying to opacity over deleting the feedback entirely.

Every animating component has one. The four accordions are covered centrally by `global.css` (`summary, summary *`). Hover feedback declares a trailing `@media (prefers-reduced-motion: reduce)` block that drops the transition and neutralizes any hover transform. Scroll-driven animations instead sit inside a `@media (prefers-reduced-motion: no-preference)` wrapper, so they simply never start.

**MOTION-3 Animate `transform` and `opacity` first.** Both are GPU composited and never touch layout.

Paint-only properties (`box-shadow`, `background-color`, `color`, `filter`) are permitted for hover and focus feedback at `--duration-hover`: they repaint without reflowing, and they are what the card lift and the toggle feedback actually use. Layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`) stay forbidden, the one exception being the native `<details>` height animation in `global.css`, which browsers optimize and which has no transform equivalent.

An element at `opacity: 0` still receives clicks, so pair it with `pointer-events: none`.

**MOTION-4 No client-side animation runtime.** Motion, Framer Motion, GSAP, and `tailwindcss-animate` are all out: the site ships static Astro with no Tailwind and no React, and a new runtime dependency needs an ADR. CSS transitions, CSS keyframes, and scroll-driven animations cover everything here.

### What a static Astro site can actually do

Everything below is CSS. None of it ships an animation runtime, so none of it costs the cookieless, no-banner property anything. Three components (`home/PartnerLogos.astro`, `program/AgendaTimeline.astro`, `home/SpeakerGrid.astro`) do add a small `matchMedia` fallback script for browsers without scroll-driven animations; that is not a runtime (MOTION-4), but a new one still needs a reason. Reach for them in this order before concluding that an effect needs a script.

| Want | Use | Support story |
| --- | --- | --- |
| Page-to-page transition | `@view-transition { navigation: auto }` in `global.css` | Native cross-document transitions. Not Astro's `<ClientRouter />`, which is a client-side router. Unsupported browsers just navigate. |
| Reveal on scroll | `ui/Timeline.astro`'s `[data-reveal]` rules, or `animation-timeline: view()` | Runs off the main thread, no scroll listener. `@supports`-gated; without it the element is simply visible. |
| Progress tied to scroll | `animation-timeline: view()` with a wide `animation-range` | Same. The agenda timeline's rail uses it (`entry 25% exit 75%`). `scroll()` is available but nothing here needs it. |
| Open and close an expandable | `<details>` plus `interpolate-size: allow-keywords` and `::details-content` | Already in `global.css` for every accordion (COMP-4). |
| Animate an element as it appears | `@starting-style` with `transition-behavior: allow-discrete` | Entry animation with no JS and no mount hook. |
| Continuous loop | `@keyframes` with `linear` | The partner marquee. |

**MOTION-5 Page transitions and scroll reveals get one implementation each,** never a per-component reimplementation. The page transition is `@view-transition` in `global.css`; the scroll reveal lives in `ui/Timeline.astro`, the only component that has one. Both are wrapped in `prefers-reduced-motion: no-preference` and, where the feature is young, in `@supports`.

A second component wanting a reveal extracts the shared utility at that point rather than copying Timeline's keyframes. `global.css` briefly carried a `.u-reveal` utility with no consumers while Timeline implemented its own; an extracted utility nothing extracts to is worse than no utility, so it was removed.

Progressive enhancement is the rule, not an aspiration: the fallback for every one of these is the un-animated state, never hidden content. Never gate visibility on an animation that may not run.

## Kickoff

`/kickoff/` is a recruiting landing, not a conference page. Its glass cards, ice-to-navy gradients, oversized display type, floating blobs, and album rail are copied from the Join Q zip. They are scoped to `components/kickoff/` and must not appear on `/`, `/whyq`, or any other route.

**KICKOFF-1 Join Q is its own visual system.** Components under `src/components/kickoff/` may skip `.section` / `.container` / `.button` / `.u-eyebrow` (LAYOUT-1, LAYOUT-3, COLOR-2, COMP-1, TYPE-1) and may use the `kickoff-*` tokens plus a page-local scroll reveal (MOTION-5). Conference pages may not import those classes or tokens. Cite this ID on every kickoff `<style>` block that would otherwise look like a silent deviation.

## Do's and Don'ts

Do:

- Reach for a token first, a `global.css` class second, and a component-scoped style only for genuinely one-off layout.
- Let dark sections invert themselves through `.is-dark`.
- Comment any deviation with the rule ID it deviates from and the live-site behavior that justifies it.
- Update this file in the same change as `tokens.css` and `global.css`.

Don't:

- Add an orange button, an orange heading, or an orange border (COLOR-1).
- Hand-roll a container, a page width, or section padding (LAYOUT-1, LAYOUT-3).
- Restate heading color or size in a component without a reason (TYPE-1).
- Paste a hex, a radius, a duration, or an easing curve that a token already holds (COLOR-3, SHAPE-1, MOTION-1).
- Animate a layout property, or reach for an animation library (MOTION-3, MOTION-4).
- Add a runtime request to a third-party host for a font, script, or embed. The site is cookieless and banner-free and stays that way.
