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
  ticket-ice: "#bbe4ff"
  ticket-cyan: "#8fd8ff"
  ticket-sky: "#3875df"
  ticket-q27: "#2d56d6"
  ticket-deep: "#1b2284"
  ticket-midnight: "#080739"
  ticket-ground: "#f3f7fc"
  ticket-press: "#a8dcff"
  home-ground: "#0b115e"
  hack-night: "#0a0318"
  hack-ink: "#22004d"
  hack-deep: "#36026e"
  hack-violet: "#5c1cae"
  hack-mid: "#6923c1"
  hack-glow: "#843ce6"
  hack-haze: "#b58af0"
  hack-mist: "#f0e8fc"
  hack-pink: "#ff8fd6"
  hack-mint: "#5eead4"
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
  ticket-card: 22px
  ticket-panel: 14px
  ticket-button: 10px
  ticket-tile: 22px
  ticket-pill: 999px
  ticket-sheet: 28px
  hack-cta: 16px
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
  container-wide: 100rem
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

No raw literal from the Webflow port is left: [`design-baseline.json`](design-baseline.json), the ratchet for them, is empty (the last entry went with the 2026 hackathon page). It only ever shrinks: clear a literal, then re-run `pnpm run check:design --update-baseline`. Never regenerate it to admit a new one.

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
| COMP-6 | The site header is the 2027 homepage's bar on every page | `home/HomeHeader.astro` |
| MOTION-1 | Durations and easings come from tokens | `--duration-*`, `--ease-*` |
| MOTION-2 | Every animation has a reduced-motion escape | `prefers-reduced-motion` |
| MOTION-3 | Animate transform and opacity only | `transform`, `opacity` |
| MOTION-4 | No client-side animation runtime | `package.json` |
| MOTION-5 | Page transitions and reveals have one implementation each | `@view-transition`, `ui/Timeline` |
| MOTION-6 | Liquid glass parts share one press and unfold motion | `--duration-glass-*`, `lib/motion/` |
| KICKOFF-1 | Join Q is its own visual system | `components/kickoff/` |
| HACK-1 | Q-Hack is its own terminal system | `components/qhack/` |
| TICKETS-1 | The 2027 ticket page is its own sales system | `components/tickets/` |
| HOME-1 | The 2027 home page is its own visual system | `components/home/` |
| INQUIRY-1 | The partner inquiry page is its own form system | `components/inquiry/` |
| NAVY-1 | The team and job pages wear the 2027 navy glass | `ui/navy-glass.css` |
| HISTORY-1 | The team history is a drawn scroll story with a 3D camera | `components/history/` |
| WHYQ-1 | The Why Q audience pages are drawn in the 2027 homepage's system | `components/whyq/` |
| PARTNER-1 | The partner page stays on the navy of the home page down to the footer | `components/partner/` |

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

One family on every conference page, self-hosted, no runtime request to a font CDN (the cookieless, no-banner property depends on that). Montserrat Variable ships through `@fontsource-variable/montserrat` and is wired via Astro's Fonts API in `Base.astro`, which also generates a metric-matched fallback face so the swap does not reflow the page. Weights 300 to 900 are used; only the home hero and the partner-page quote mark go to 900.

The scale is fluid by breakpoint rather than by `clamp()`, because custom properties cannot hold media queries: `tokens.css` re-declares h1 to h4 at 991px; the section padding and gap, h1 to h6, and the two largest body steps at 767px; and the home hero size at 479px. The front matter above publishes the desktop value of each.

**TYPE-1 Headings inherit the global element styles.** `h1` to `h6` already carry navy, the `--heading-*` size, and the right line height from `global.css`. A component does not restate heading color or size unless the live site demonstrably deviates, and then a comment says why.

**TYPE-2 Body sizes come from `--text-size-*`.** Do not write bare `rem` font sizes that duplicate an existing step.

**TYPE-3 Montserrat is the only family.** No second face, no icon font, no `@import` from a third-party host. The one sanctioned second face is JetBrains Mono on `/hackathon` (HACK-1, [ADR-0009](../../docs/decisions/0009-three-qhack-page.md)): self-hosted the same way through `@fontsource-variable/jetbrains-mono`, exposed as `--font-mono`, and rendered by that page's own `<Font>`, so no other page downloads it.

The site ships two eyebrow voices, and that is declared rather than unresolved: a small bold navy label (`.u-eyebrow`) and a light widely tracked kicker over the speaker page hero (`.is-kicker`). Two contact-page labels are sentence case (`.is-sentence`). One shared rule defines the treatment and each variant declares its difference, so the drift is visible in one file instead of spread across several components. Whether two voices should be one is a design decision for a designer, not a refactor. (The hackathon schedule's `.is-quiet` kicker left with the HACK-1 campaign page.)

**TYPE-4 Weights come from tokens.** The scale is complete, so there is no reason to write a number: `--font-weight-light` (300), `--font-weight-regular` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-extrabold` (800), plus `--heading-weight` (700) and `--heading-weight-home` (900), which keep their heading-role names and are borrowed by the few non-heading elements that need that weight. Machine-enforced: a bare numeric weight fails `check:design`.

## Layout

Every page is the same shape: a stack of full-bleed section bands, each with its content in one centered container. Page width is a property of the design system, not of any component.

**LAYOUT-1 One page width.** Every section is a full-bleed element (`class="section"`, plus `is-alternate` / `is-dark` / `is-small` as needed) whose content sits in one `<div class="container">` (`--container-large`, 80rem). No component defines its own page width.

The sanctioned exception is the breakout band: an element that deliberately runs edge to edge on any viewport up to `--container-marquee` (120rem, a full 1080p browser window) and is capped and centered, not full-bleed, on wider screens. Two ship it, on the same token and the same `width: min(100%, var(--container-marquee)); margin-inline: auto` shape: the home partner-logo marquee (`src/components/home/PartnerLogos.astro`) and the speaker page's Previous Highlights rail (`src/pages/speaker.astro`). Their inner content still lines up with `--container-large`, so the page's text column does not move. Any future breakout needs the same treatment, on this token or on a dedicated `--container-*` one of its own: capped and centered, never an unbounded full-bleed element.

The 2027 pages (the homepage, HOME-1, and the ticket page, TICKETS-1) share one wider grid of their own, `--container-wide` (100rem): their content (`.h-shell`, `.t-shell`) runs on the same gutter as the full-width site header (COMP-6) on every laptop screen up to about 1680px and is centered only on wider monitors, so nothing reads as unexpectedly indented beside the header; their backgrounds, films and the palace drawing still run to the window's edges.

**LAYOUT-2 `--container-medium` and `--container-small` are measure limits, not section widths.** They cap a text block inside a container (an intro paragraph, a legal body). They never set the width of a section.

**LAYOUT-3 Section vertical padding comes only from `.section` and `.is-small`.** Components never hand-roll `padding-block` for a section shell. Padding on inner elements is fine; this rule is about the shell.

Spacing _inside_ a section comes from a six-step scale: `--space-2xs` (0.5rem), `--space-xs` (0.75rem), `--space-sm` (1rem), `--space-md` (1.5rem), `--space-lg` (2rem), `--space-xl` (3rem). It covers gaps and the padding or margin of inner elements. The steps were not designed, they were counted: each one is a value the Webflow port already wrote by hand in a dozen or more declarations, so adopting the scale changed no pixel. A value that is not a step (1.25rem, 1.75rem, 2.5rem, 5rem, and the handful of sub-rem nudges) stays raw; snapping it onto a step would be a redesign, and a scale that renames every value is not a scale. Section shell rhythm stays out of this scale and remains `--section-padding`, `--section-padding-small`, and `--section-gap` (LAYOUT-3), which are the tokens that shift at the 767px breakpoint.

**SPACE-1 Spacing values that have a token use it.** The `--space-*` steps were counted from what the port already shipped, not designed, so a raw `1.5rem` gap is a missed token rather than a judgement call. Values with no step (`1.25rem`, `1.75rem`, `4rem`, the sub-rem nudges) stay raw on purpose; only the six steps are enforced.

**LAYOUT-4 Section openers use `.section-header`,** a centered `h2` with an optional intro. Left-aligned or two-column openers are the exception and need a comment giving the reason.

## Elevation & Depth

Separation is carried by background bands (`.is-alternate`, `.is-dark`) and hairline borders. Shadows are the fallback, not the default: `src/components/home/SpeakerGrid.astro` documents having removed one in favour of a hairline, and that is the direction of travel.

Where depth is genuinely needed there are five steps, not the twelve one-off values the Webflow port shipped:

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-subtle` | `0 1px 4px rgb(0 0 0 / 0.06)` | A whisper on a light card, where a border would be too hard |
| `--shadow-card` | `0 2px 4px rgb(0 0 0 / 0.2)` | Resting state of a card that floats rather than sits |
| `--shadow-card-hover` | `0 4px 12px rgb(0 0 0 / 0.2)` | The lift that pairs with a `translateY` on hover |
| `--shadow-lifted` | `0 8px 18px rgb(0 0 0 / 0.14)` | A card sitting above the page rather than on it |
| `--shadow-floating` | `0 12px 26px rgb(0 0 0 / 0.12)` | The deepest step, for the few cards that genuinely float |

The five steps were chosen to sit on the twelve shipping values, not to look tidy. Every card landed within a couple of pixels of blur and about 0.02 of alpha, except the hackathon logo cards (`ui/LogoGrid`'s `hack` skin), whose unusually light resting float (`0 10px 25px / 0.08`) is now `--shadow-lifted`: slightly tighter and slightly darker. A scale that merely renames every existing value is not a scale, but one that redesigns the page is worse.

The DESIGN.md spec has no shadow token group, so these live in `tokens.css` and are governed by this prose. `scripts/check/design.mjs` allow-lists them by name.

**DEPTH-1 Shadows come from the `--shadow-*` scale.** Reach for a hairline border and a background band first. Never add a sixth step without deleting one.

The only sanctioned raw `box-shadow` is the zero-blur ring: the focus ring in `global.css`, and the background-colored halo behind the timeline dots (`src/components/ui/Timeline.astro`). Those are rings, not elevation, so no `--shadow-*` step can express them.

## Shapes

Radii are small and functional. Buttons are nearly square (5px and 7px), cards are gently rounded (10px, 20px for the large variant), and the pill and circle radii exist for avatars, badges, and toggles.

**SHAPE-1 Radii come from `--radius-*` tokens.** No bare `px` radius in a component.

## Components

Shared patterns live in `global.css` as flat classes, and the `ui/` Astro components are style-less typed wrappers over those classes (see `PRIM-*` in [`AGENTS.md`](AGENTS.md)). Not every pattern has earned a class: `.button` is real and shipped, while the card is small enough that each component declares it, so for cards the tokens are the whole contract.

**COMP-1 Buttons are `.button` plus its documented variants** (`.is-alternate`, `.is-secondary`, `.is-small`, `.is-glass`) from `global.css`. No hand-styled anchor or button. `.is-glass` is the liquid glass call to action for dark grounds such as the home hero video (COMP-6): clear glass with no color fill, the ground showing through a light blur held slightly darker so the white label reads on any frame, a lit edge, a specular rim and a soft cyan halo, a small uppercase label and a trailing arrow (`.button-arrow`); hover and focus brighten the glass and lift the halo, focus adds a white ring, and a press compresses it a little on the first frame, runs a light pulse from the touch point and springs it back on release (MOTION-6).

**COMP-2 Cards use `--radius-card` and a `--color-neutral-lighter` border.** There is no shared `.card` class to inherit from, so this rule is the contract.

**COMP-3 A pattern used by 2+ pages does not live in a page component.** A shared _style_ goes into `global.css` and into this file in the same change; a shared _component_ becomes a `ui/` primitive (`PRIM-3` in [`AGENTS.md`](AGENTS.md)).

Shared utilities carry a `u-` prefix, so a class name says at a glance whether it is site furniture or a component's own. There are five:

| Class | What it is | Local override |
| --- | --- | --- |
| `.u-visually-hidden` | Present for assistive technology, not painted. The standard clip-rect block, next to `.skip-link` because both are the same accessibility family | None |
| `.u-eyebrow` (+ `.is-kicker`, `.is-sentence`) | The small uppercase label above a heading: `--text-size-small`, `--font-weight-semibold`, `0.15em` tracking, `--color-primary` | Color, where the ground demands it (a dark section), and the gap to the heading |
| `.u-section-cta` | Centered button row closing a section: `--section-gap` above, `text-align: center` | `margin-top`, where the live spacing differs |
| `.u-accordion-summary` | The clickable row of a `<details>` accordion (COMP-4): label left, chevron right, native marker removed | The hairline, the label's type, the gap, the mobile padding, and the `[open]` chevron rotation |

`.u-eyebrow` and `.u-section-cta` set `margin: 0` and a default gap respectively, so a site adds only the one declaration that is genuinely its own. Anything more than that is a sign the pattern is not actually shared.

The footer's column labels are deliberately not `.u-eyebrow`: they label a navigation list rather than introducing a heading, and stay smaller and tighter.

**COMP-5 Data tables rule with `--color-black` at 1px,** not the card hairline. A dense comparison grid needs its rules to read as structure; `--color-neutral-lighter` disappears at that density. COMP-2 governs cards only, so do not "fix" a table into it.

**COMP-4 Accordions are native `<details>`/`<summary>`.** The shared open and close animation lives in `global.css`, once, for every accordion on the site, and so does the summary row itself (`.u-accordion-summary`) and the chevron (`src/components/icons/IconChevron.astro`). No JS widget replaces the native element. What stays with each accordion is what genuinely differs: its hairline, its label type, and the `[open]` rotation, which targets that accordion's own chevron box.

**COMP-6 The site header is the 2027 homepage's bar on every page.** `home/HomeHeader.astro` is the one header, rendered by `Base.astro` on every page that brings no header of its own (the homepage passes it together with its intro); there is no other variant and no page-local copy, with one exception: `/hackathon` shows the same items in the same order and with the same targets in its own terminal dress (`qhack/QhackHeader.astro`, HACK-1). It is a bar of dark liquid glass across the whole window (a navy body dense enough to read the same over white pages and the navy homepage, a backdrop blur, a lit lower edge), its contents on the page gutter at both edges (never in a narrower centered box): the white Q at the left and, at the right, the Site Settings navigation as plain links in a soft white (the page the visitor is on in ice; an item with sub-items, Why Q?, is no link of its own but a button with a small chevron that opens a panel of the bar's glass with its four audience pages, on hover, a click, Enter or Space, kept open while focus is in it, closed by Escape, a click outside or leaving it) and the Tickets button in icy liquid glass (HOME-1). On the ticket page itself the Tickets button is left out and the links close up to the edge. The links show from a small tablet (768px) up, sized with the window so all of them fit; phones get the menu as three stripes as tall as the Tickets button instead, and should the links ever not fit (a longer navigation), `home-menu.client.ts` measures it and the bar shows the stripes too, so nothing overlaps or is cut. On every page but the homepage a spacer of the bar's height follows it, so the page starts under the bar; its height lives on `:root` as `--site-header-height` (4.5rem, 4rem on phones), which anchors (`scroll-padding-top`) and anything that sticks under the bar read. The menu is a native fullscreen popover on the homepage's navy (Escape closes it, `home-menu.client.ts` adds the focus trap and the scroll lock, and closes it when the window grows past the phone layout): the Site Settings navigation as large rows without running numbers, an item with sub-items (Why Q? and its four audience pages) as a native disclosure, and beside them the edition, dates and city, the ticket link with the offer on sale (icy glass, left out on the ticket page) and the social profiles. Every arrow in it is an SVG in the text's color, never a text arrow (an iPhone draws those as colored emoji). The header may use the `ticket-*` and `home-*` tokens it is built from.

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
| Partner page intro, once per load (PARTNER-1) | `--ease-emphasized` | the title rises over `--duration-reveal` 500ms, label, intro and the first two tiers' headings follow, each over `--duration-reveal`; the logos of the first two tiers rise in `--duration-partner-stagger` 60ms apart; the beats overlap; nothing repeats |
| Glass press (MOTION-6) | `--ease-snappy` in, `--ease-glass-spring` back | `--duration-glass-press` 90ms, `--duration-glass-release` 420ms |
| Glass surface unfolding out of its trigger (MOTION-6) | clip `--ease-emphasized`, size `--ease-glass-spring` | `--duration-glass-unfold` 380ms, stagger `--duration-glass-stagger` 28ms |
| The same surface folding back | `--ease-emphasized` | `--duration-glass-fold` 220ms |

Exit is faster than enter, hover stays under 150ms, and nothing crosses 500ms. `linear` is for loops and for scroll-driven timelines whose progress is the scroll position rather than a clock: the partner-logo marquee, and the timeline's rail and reveal keyframes in `ui/Timeline.astro`. It is never the curve for a click-triggered transition, where it reads as robotic.

**MOTION-1 Durations and easings come from tokens.** No inline `cubic-bezier()` or bare `ms` value.

**MOTION-2 Every animation has a `prefers-reduced-motion: reduce` escape,** and reduced motion means no transition at all, not a shorter one. Prefer simplifying to opacity over deleting the feedback entirely.

Every animating component has one. The four accordions are covered centrally by `global.css` (`summary, summary *`). Hover feedback declares a trailing `@media (prefers-reduced-motion: reduce)` block that drops the transition and neutralizes any hover transform. Scroll-driven animations instead sit inside a `@media (prefers-reduced-motion: no-preference)` wrapper, so they simply never start.

**MOTION-3 Animate `transform` and `opacity` first.** Both are GPU composited and never touch layout.

Paint-only properties (`box-shadow`, `background-color`, `color`, `filter`) are permitted for hover and focus feedback at `--duration-hover`: they repaint without reflowing, and they are what the card lift and the toggle feedback actually use. Layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`) stay forbidden, the one exception being the native `<details>` height animation in `global.css`, which browsers optimize and which has no transform equivalent.

An element at `opacity: 0` still receives clicks, so pair it with `pointer-events: none`.

**MOTION-4 No client-side animation runtime.** Motion, Framer Motion, GSAP, and `tailwindcss-animate` are all out: the site ships static Astro with no Tailwind and no React, and a new runtime dependency needs an ADR. CSS transitions, CSS keyframes, and scroll-driven animations cover everything here. There are two exceptions. The first is the 2027 homepage ([ADR-0008](../../docs/decisions/0008-three-gsap-home-pass.md)): Three.js renders its hanging pass and GSAP orders its intro, pass and hero entrance, both bundled first-party and loaded by dynamic `import()` from `components/home/` only, after first paint, never on another page; everything else on that page (reveals, marquee, rails, menu) stays CSS. The second is the Q-Hack page ([ADR-0009](../../docs/decisions/0009-three-qhack-page.md), HACK-1): Three.js renders its laptop sequence and its film roll, bundled first-party and loaded by dynamic `import()` from `components/qhack/` only, after the hero has assembled; that page uses no GSAP. The third is the team history on `/past-teams` ([ADR-0010](../../docs/decisions/0010-three-history-page.md), HISTORY-1): Three.js renders its camera, bundled first-party and loaded by dynamic `import()` from `components/history/` only, after the page has loaded; that page uses no GSAP. Any other page that wants either library needs its own ADR.

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

**MOTION-6 Liquid glass parts share one press and unfold motion.** The timings come from the team's reference videos (Apple's Liquid Glass demos), measured frame by frame, and live in the `--duration-glass-*` and `--ease-glass-spring` tokens. Every glass part uses the same two patterns, so new ones are composed rather than reinvented:

- **Press.** Mark the element `data-glass-press` and give it a `.glass-light` child (it needs `position: relative` and a radius). `lib/motion/glass-press.ts`, booted once in `Base.astro`, sets `.is-pressed` for touch, mouse and Enter/Space alike and replays a light pulse from the touch point (`--press-x` / `--press-y`). The element gives a little on the first frame (`--duration-glass-press`) and springs back past its size on release (`--duration-glass-release`, `--ease-glass-spring`). Nothing waits for it: links navigate and buttons fire on the native event. Users: the home Buy Now (`.button.is-glass`), the header's menu button, the compare picker fields.
- **Unfold and fold.** A surface grows out of the control that opened it: it starts clipped to and squeezed into the trigger's box, the clip opens on `--ease-emphasized` while the size springs (`--ease-glass-spring`, a small overshoot that settles), a light runs across it, and its contents follow `--duration-glass-stagger` apart, invisible while squeezed so text is never seen distorted. Folding plays back into the trigger faster (`--duration-glass-fold`) and fades only at the end; the element is hidden only after the fold. Toggles are CSS transitions on a state attribute, so a quick second tap reverses mid-way; panels that move between places use the Web Animations API and cancel what is still running. Users: the header's phone menu (`data-sheet`), the compare pickers' list (`data-state`), What's included (`tickets.client.ts`).

Scale and clip stay on the glass surface itself, never on content that has to be compared or read in place: text sits on its own layer and appears only once its glass is open. A glass layer that has to blur what is behind it must not sit inside another element with `backdrop-filter` (a backdrop root); give the outer glass its own background layer instead. Each pattern has its reduced-motion escape (MOTION-2): no transition and no pulse.

Progressive enhancement is the rule, not an aspiration: the fallback for every one of these is the un-animated state, never hidden content. Never gate visibility on an animation that may not run.

## Kickoff

`/kickoff/` is a recruiting landing, not a conference page. Its glass cards, ice-to-navy gradients, oversized display type, floating blobs, and album rail are copied from the Join Q zip. They are scoped to `components/kickoff/` and must not appear on `/`, `/whyq`, or any other route.

**KICKOFF-1 Join Q is its own visual system.** Components under `src/components/kickoff/` may skip `.section` / `.container` / `.button` / `.u-eyebrow` (LAYOUT-1, LAYOUT-3, COLOR-2, COMP-1, TYPE-1) and may use the `kickoff-*` tokens plus a page-local scroll reveal (MOTION-5). Conference pages may not import those classes or tokens. Cite this ID on every kickoff `<style>` block that would otherwise look like a silent deviation.

## Hackathon

`/hackathon/` is the Q-Hack 2027 page, and it is deliberately not the conference look: a terminal that somebody else is typing into. The ground is a violet taken almost to black. Everything that is typed is set in JetBrains Mono, and the terminal's own lines (prompts, the path above a heading, the lines in a window) appear character by character; the paragraph under a section heading is plain text that is simply there; only the section headings are Montserrat, white, extra bold and upper case. In order: the Q-hack lockup as a body of characters that turns to the pointer, glows under it and can be pulled apart by pressing and holding, above a band of previous partners whose logos lead to the partners' own sites; a laptop that condenses out of particles, shows its lid with the Q and five Q-Summit stickers, opens, turns and is taken over by a rain of Qs; the programme as a log on one straight lit line with a diamond per entry; the aftermovie as a live picture of characters with a button for the real film; a roll of film with photos; the questions as a terminal conversation beside the facts, in one window that shows one thing at a time under its field (the topics once the field is tapped, then the questions of a topic, then the answer in their place); the pitch to partner companies. A status line as in tmux stays at the bottom edge and only navigates: the page's windows by number and name, the one in view marked (on a phone the line scrolls sideways and follows). The page keeps its windows free of hints and repeated buttons: the hero carries the lockup and one line, the laptop its three lines, a programme entry its time and title, and the way to apply is the laptop's screen.

The header is the site header in the page's dress: the Site Settings items in their order and with their targets, written as paths, the Q at the left and Tickets at the right (COMP-6 names this exception). The page ends in the white site footer like every page. Because it comes out of the dark, the fade into it is long: one eased run from the ground through violet to white, the first half easing in and the second easing out at the same rate where they meet, so no stripe stands out. It is a plain gradient with the same curve painted over it with a fine dither, because an 8 bit gradient out of near black shows bands on OLED screens; the dark header steps aside where the white reaches it. Phones get one column: every programme entry sits right of the line, the laptop is fitted above its copy and never over it, and the film roll is a circle instead of the wide oval of a desktop window. While applications are closed every apply button stays and opens a short terminal window that says so; once they are open the buttons are plain links.

The violet ramp is sampled from the Hack CI background artwork, which ships no written palette. `hack-night` is that violet taken almost to black, for the ground; `hack-haze` and `hack-mist` are the ring glow tinted toward white, for links, light edges and body text; `hack-pink` and `hack-mint` are the terminal's two accents, pink for the prompt and for what the other side types, mint for done. All are documented as derived values in `tokens.css`, and every shade in between is a `color-mix()` of them in `qhack/qhack-theme.css`. The partner band redraws each logo: the file is reduced to its shape, filled with characters in white, outlined, trimmed to its own ink and brought to one optical size, so the band reads as one material. It is the one place on the site where a partner logo is not shown as its official file. Each logo is a link to the partner's site in a new tab; the links are for the pointer, and keyboards and screen readers get the same links as a list of names that shows itself with the focus. The light under a terminal window is a soft pool, not a bar: a shade of the ground sits at the window's edge and the violet comes up a little below it and runs out far. It may fall past the end of its section, so every section lies above the one that follows (descending `z-index`), or the follower's ground would cut the light in a straight line. The stickers on the laptop lid are the Q-Summit's own artwork, cut out and stored as WebP; they are glossy and mirror the studio the way the aluminum around them does.

**HACK-1 Q-Hack is its own terminal system.** Components under `src/components/qhack/` and the `/hackathon` page may skip `.section` / `.container` padding rhythm / `.button` and the conference header's look (LAYOUT-1, LAYOUT-3, COLOR-2, COMP-1, COMP-6, TYPE-1), may use the `hack-*` tokens, a second face (`--font-mono`: JetBrains Mono, self-hosted and loaded by this page alone), display type above the heading scale, a page-local reveal (MOTION-5), and glows that are light, not elevation (DEPTH-1). Every rule of the page lives in `qhack/qhack-theme.css` under the `.qhack` wrapper class, because much of its markup is written by script, where scoped styles would not reach. The motion exceptions are sanctioned here and nowhere else ([ADR-0009](../../docs/decisions/0009-three-qhack-page.md)). There are four canvases: two are first-party WebGL without a library (the hero's characters, a point cloud with spring physics, and the aftermovie's picture, one full-screen shader over the muted film), and two use Three.js, loaded by dynamic `import()` after the hero has assembled or at the first scroll, never on first paint (the laptop sequence and the film roll; MOTION-4). The entrance belongs to the lockup: its characters fade in and fly together at a steady pace, the hero's text blocks rise in beside it in plain CSS, and nothing heavy runs meanwhile (the partner band is drawn in slices of a few milliseconds; the aftermovie picture, the laptop and the film roll are set up only once the lockup stands, the laptop in pieces with a frame between them). Each canvas draws only while it is on screen, the three large ones cap their drawing buffer by a pixel budget, and each is replaced by HTML when it cannot run. The laptop stage is pinned and driven by one scroll-progress value, and it opens by itself after a moment so nobody has to guess; the film roll turns slowly by itself and can be dragged, clicked and stepped with buttons, with no wheel capture; the small loops (caret, status dot, play button, partner band, the light line over the programme) run longer than 500ms and continuously. The page uses no backdrop blur, and neither the page nor its wrappers clip their overflow (a clipping ancestor makes a sticky stage trail the scroll in Safari). Everything else stays inside MOTION-2 and MOTION-3. Reduced motion: text is there at once instead of typed, the laptop is a short text block with the apply link, the photos are a plain grid, the programme line is fully lit, the aftermovie is its poster, and no loop runs. Without JavaScript the page has the same plain form with every answer written out; a flag set before first paint keeps the scripted page from flashing it and is taken back if the script never arrives. Conference pages may not import the `hack-*` tokens, `--font-mono` or `qhack-theme.css`. Cite this ID on every Q-Hack file that would otherwise look like a silent deviation.

## Tickets

`/ticket-categories/` is the 2027 ticket shop front, and it trades the conference minimalism for a calm, precise sales surface in the Q27 CI, built from liquid glass after the reference images the team picked. Its colors follow the 2027 homepage (HOME-1): the homepage's deep navy ground with soft pools of its blues, white type with ice accents, the homepage's liquid glass buttons (icy blue for buying, white for Compare tickets) and two surfaces in radiant white, the ticket card and the compare sheet: plain white bodies with no tint and no light pools, so navy type and the ice buy buttons stand out at full contrast, their glass and depth only at the edges (a lit top line, a white rim against the navy, cool grey-white shading inside the edges, deepest along the foot, and a deep cool shadow; `--t-white-shadow` and `.t-light` in `tickets/ticket-theme.css`); the fade into the white footer is the homepage's. Liquid glass here means glass with a specular rim that catches light top left and bottom right, a caustic glow along the lower inner edge, a little brightness and saturation lifted from what lies behind, and depth from light rather than from a flat fill (`.t-glass`, and the homepage's tints, home-theme.css `.h-ice` / `.h-frost`). The navy ground's light belongs to the things on the page, never to the screen: behind each part (the phase cards and the heading, the ticket list and its card, the compare sheet) lies one wide pool that scrolls with it, Q blue at its brightest right behind the part, falling off through the deep blue along a long eased tail with a faint, wider halo; the pools run past their section and meet, so the parts are lit and the page is a little darker between them, never a hole and never an edge (`tickets/ticket-theme.css`; no Q marks: the Q appears in the discount phases, not behind the page). Buttons are calm rounded rectangles (`--radius-ticket-button`) with a small uppercase label (buy buttons with a trailing arrow): every buy button in the homepage's icy liquid glass with a navy label and a fine sky outline (on the light card and on the compare sheet alike), the hero's Compare tickets link in its white liquid glass with a navy label; pressing one lightens the glass a step, on touch, mouse and keyboard alike, and navigation is never delayed for the animation.

The discount phases open the hero, right under the site header, as the homepage's four cards (`ui/SaleCards.astro`, one component for both pages, so they always show the same phases and the same one on sale): the phase on sale in baby blue glass, its discount large in navy, a filled tag and an arrow, the whole card a link to the ticket picker below; coming phases as clear glass (hardly any body, only the rim, a lit top edge and a light frost, so the night shows through) with quiet grey ink and an outlined tag, plain text, so they read at once as later stages and nothing that cannot be bought yet looks like an offer; past ones fade further. The cards carry no mark (no Q, dot or ring): each reads in three bands, the phase's name (and the arrow) at the top, the discount in the middle, the tag at the foot. The card on sale is the glass of the ticket buttons (`.h-btn .h-ice`) set on a card: the same tint a little translucent under the same frost, the same specular rim, and the button's relief scaled to the card (a lit top edge, the body deepening towards the foot, a band of light inside the lower edge). Only it casts a shadow, set on its list item, so it lifts off it on hover. No line joins them. Four in a row on wide screens, two by two on tablets, on phones one under another as compact rows. With the cards shown the hero has no separate Q tile. Between two phases (`phases.onSale` off) the current card keeps its baby blue glass and link but is tagged "Next up", the phases before it read "Sold out", and the hero opens with the homepage's sale opener (`ui/SaleIntro.astro` as the h1: "Christmas Sale / is coming." beside "25% off every ticket dropping soon.", a line for those who missed the phase before and "See ticket options" to the picker) in place of its heading, intro and Compare link. Phases, discounts and the current one come from the page content (`phases`, one source for the cards and the screen reader price label); nothing switches by date, and without phases the hero shows its Q tile and eyebrow instead. The hero Q tile, where shown, keeps its exact drawing: material comes only from light, a soft highlight and a shallow shadow, never from redrawing, tilting or distorting the mark.

The tickets are chosen in one place (What's included, `TicketIncluded.astro`), like the homepage's "Why Q?" picker: at the left the five tickets as a vertical tab list, each row its name, who it is for, the regular price struck through and the price on sale now (column labels above, so names, prices and arrows line up down the list), the row picked marked in ice on a lens of glass that glides to it, with an arrow; at the right exactly one ticket card, the one picked: its name and description, the price large with the phase on sale and the day it ends, the regular price and the saving (while no ticket is discounted, between two phases, the list has one price column and the card shows the one price, with no struck price, phase or saving), its requirement (a line kept on every card, so all cards are the same size), the buy button and every benefit with its status mark (a navy check or a quiet dash, the status words read out but not printed; the groups flow down two balanced columns). The list stays in view beside the card on wide screens; tablets and phones put the card under the list, and a tap brings its top into view. Switching tickets slides the card picked in from the list's side, then its rows follow in a quick cascade with their marks popping in (MOTION-6); the cards share one cell as tall as the tallest, so a switch never moves the page. Arrow keys, Home and End move through the list. There is no separate row of ticket cards and no carousel; the card and What's included carry no benefit counter or progress bar. Without JavaScript the list and all five cards stand one under another, and every buy link works.

Moving parts are glass too: the list's lens, and the compare pickers: a white glass field like the homepage's name field, with navy type, that opens a listbox of its own (not the browser select, whose list flipped upward or could not be dismissed on some phones), always downward, easing the page down first when the list would not fit, closed again by a second tap, a tap outside or Escape without changing the pick; the list is one flat frosted white, dense enough that nothing behind it shows through, unfolds out of the field and folds back into it (MOTION-6), and marks the picked ticket with a raised glass chip and a check, never with a color. Above the compare rows the two picked names stay pinned just under the site header, each at the left of its own column, on a bar of half-clear white glass, like the site header's bar in white, through which the rows passing under it show as a soft blur; the compare sheet keeps its fill on a pseudo layer and has no backdrop filter of its own, so it is no backdrop root and that blur reaches the rows. The compare view is a product spec sheet in the CI: a sheet of radiant white over the page light (as the ticket card), navy ink with Q27 blue group titles, hairline rows, navy status discs, and its own icy buy buttons. The site header is the homepage's (COMP-6), without its Tickets button on this page. The hero's Compare tickets jump link is white liquid glass (home-theme.css `.h-frost`) with a navy label. Live backdrop blur is reserved for glass that content passes under (the site header, the pinned compare names, an open picker list) and for small buttons; resting panels (the ticket card, the compare sheet) carry none (the four small discount cards keep a light one, so their slight translucency reads as frosted glass), because behind them lies only soft, slowly moving light, where a blur changes nothing visible but is recomputed on every frame. For the same reason an entrance animation never fills forwards and a card's light sits under one rounded clip only: both otherwise cost an offscreen pass per element on every frame. The pinned compare names are half-clear white glass with a strong blur, because rows pass under them and their text must never read as a second line next to the names. The page ends in a short glass fade into the footer (`.t-page-fade`), which replaces the footer's hairline on this page. The page's content runs on the homepage's grid (`--container-wide`, LAYOUT-1).

**TICKETS-1 The 2027 ticket page is its own sales system.** Components under `src/components/tickets/` and the `/ticket-categories` page shell may skip `.section` / `.container` padding rhythm / `.button` (LAYOUT-1, LAYOUT-3, COMP-1, TYPE-1), may use the `ticket-*` tokens, display type above the heading scale, and glass depth built from tinted, layered shadows and inset light edges rather than the `--shadow-*` steps (DEPTH-1). The page's light is static; the light inside the glass fields loops longer than 500ms (`--duration-ticket-drift*`), pauses off screen, and stops entirely for reduced motion, which shows a still frame of the same light. Everything else stays inside MOTION-2 and MOTION-3. Conference pages may not import the `ticket-*` tokens or `tickets/ticket-theme.css`; the one exception is the site header and `.button.is-glass` (COMP-6). Cite this ID on every tickets `<style>` block that would otherwise look like a silent deviation.

## Home

The home page for the 10th edition follows the team's "Q-Summit 2027 · Website concept" mockup: a dark, high-contrast page in navy and the Q blues with ice accents, large heavy type, fine hairlines and sparing liquid glass, with a hanging 3D event pass as its centre. Its ground takes the colors of the team's Office Visits recap post (`home/home-theme.css`): that post's visible dark blue (`ticket-deep`) is the brightest zone, the page falls through `home-ground` into `ticket-midnight`, and nothing is black or colorless, so the navy still reads on a phone. The ground itself is a very deep navy, well below the post (midnight darkened, never black); lighter zones come only where a section needs them (behind the pass, behind the speakers, behind the sale phases), so the page has contrast instead of one even blue. Sections are never divided by lines, lenses or cuts: the navy runs on unbroken from the hero to the footer, and a section's own pool of light (a held core with a long smoothstep tail and a wider, faint halo) runs past the section's top and bottom and is eased to nothing over that overlap, so at every seam the light of both neighbors meets and sums: no rim, no cut and no dark hole between lit sections, while the ground between them stays a little darker; the hero's light and film, and the aftermovie's foot, fade out along an S-curve. The page melts into the white site footer through a long fade (`.h-page-fade`, its length following the window's height) whose lightness rises along one smoothstep curve in OKLab: the deep blue grows out of clear (never the dark ground laid over the last section's light, which would leave a trough), then a mid blue and a pale sky lead into the white, with no kink, no band and no line between them; the ticket page ends the same way. Sections are not `content-visibility` contained: containment would clip each section's light at its own box. Nothing around a sticky element clips overflow (no `overflow-x: clip` on `.h-home` or `.ticket-page`): inside such a clip Safari on iPhone placed the held palace and film a frame behind the scroll, so they shook through the whole hold; whatever could run past the window's sides clips itself (the film's frame), and the ticket page's pools stay inside the page's width. On phones the night is a step lighter and every pool of light shines a little brighter (`--q-night`, `--q-light-lift`), with the same curves, since a small, often dim screen makes the page read darker; the ticket page follows.

The homepage passes the site header itself (`home/HomeHeader.astro`, through Base's `header` slot, with its intro; COMP-6): a bar of dark liquid glass across the whole window (a translucent navy body with a backdrop blur, because the page and the lanyard pass under it, and a lit lower edge), the white Q on the left gutter, and on the right one the navigation as plain links (Why Q? opening its four audience pages) and the Tickets button in icy liquid glass; phones get the menu as three stripes instead of the links. Menu opens a fullscreen sheet, a native popover that works without JavaScript and closes on Escape: the Site Settings navigation as large rows, an item with children ("Why Q?" and its four audience pages) as a native disclosure with the children indented under a hairline, and beside them the edition, dates, the ticket link with the current discount and the social profiles; focus moves into the sheet, stays there and returns to Menu (`home/home-menu.client.ts`). Every general ticket link on the page opens `/ticket-categories/` (`lib/home-links.ts`); none only scrolls to a section.

A short loading intro (`home/HomeIntro.astro`) plays on a first visit, after the team's loading film: a navy field with one wide, soft pool of blue light (a long eased tail, no rim) inside a fine rounded frame whose corners hold small facts (the edition as the pass prints it, "Q27 · 10th edition", at the top left; the dates as the pass prints them, "01-02.04.2027", at the bottom left; the venue at the bottom right; and at the top right "Loading" with the site's own three dots from the first 2027 intro, lighting one after another in places of their own, so the word never moves), and in the middle the Q mark, flat and white as in the film (the site's own mark, its counter open to the ground; never a 3D render, glass or mirror), its rounded outline traced in light while the years run from 2017 to the edition's year and a fine progress line fills, all three on the same curve and the same clock, so they arrive together (the number turns ice as it arrives); "10 Years of Q-Summit" joins halfway. Then the loader's content lifts away and the hero's navy and light rise from the bottom behind a long soft edge (the light drawn over exactly the hero's box, so the hand-over changes nothing), and a copy of the hero's headline (the same type and line breaks, measured from it) fades in small in the middle of the screen; it holds there for a moment, then zooms into the real headline's place, growing to its size; once it lands the real headline is shown under it, the panel's ground fades into the page and the copy goes with it, so the headline is never shown twice and nothing jumps; the rest of the hero comes in, and only then does the pass drop: nothing plays behind a visible overlay. About four seconds in all. It never locks anyone out: an inline script plays it only when motion is welcome, the visitor has not seen it in the last twelve hours and did not arrive on a section link; any key, a click or "Skip intro" jumps to its end; a script that arrives late plays it faster; the CSS clears it by itself after a few seconds, `?intro=1` replays it.

Buttons, fields and a few panes are liquid glass in three tints from one recipe (home-theme.css: `.h-btn`, `.h-field` and `.h-pane` read the variables `.h-ice` and `.h-frost` set), in the shape of the ticket page's buy button (TICKETS-1): a body that lets a little of what lies behind show through, a one-pixel specular rim, a lit top edge, a soft caustic inside the lower edge and a drop shadow; hover and focus lighten the glass a step, a press gives a little and springs back (MOTION-6), and nothing glows. Icy blue glass (`.h-ice`, Q Icy Blue with a navy label) carries every ticket and offer action: the header's Tickets, the hero's buy link, the sale's "Get your … ticket", the menu's ticket link, the pass's ticket link and the discount card on sale. White glass (`.h-frost`, a navy label, grey for what is not on sale yet) carries the other actions and calm surfaces: "Why Q?", "View all partners", "See all speakers", the name field, the coming discount cards and the social pane. Clear glass (a faint white body over a darkened blur, a white label) stays for the round controls over the speaker rail. On the white audience card the glass is tinted navy so it still reads. Arrows next to links and buttons are SVGs in the text's color, never text arrows (an iPhone draws those as colored emoji). No line on the page runs from edge to edge: dividers (between figures, facts, rows and in the menu) are hinted, fading out before they reach an edge.

The hero (`home/HomeHero.astro`) follows the mockup's order: the edition large, the headline with its last words in ice, the site tagline, the ticket link and "Why Q?", then three facts (when, where, the discount on sale now with the day it ends when the content gives one), all as HTML; there is no countdown in the hero. The pass on the right is large and hangs low enough that its lanyard shows under the header (its frame a little taller than its column, standing on the column's foot). Under the card a quiet line says a click (a tap on touch screens) turns it, and is itself the button that does. Behind it all runs last edition's film as a ghost in the page's blues (muted, luminosity over the navy, dimmed, fading out towards the copy and the foot), started only after the page has loaded and never with reduced motion or data saving, where its dimmed poster stays. Under the pass, "Put your name on it" draws what a visitor types onto the card's front in the card's own type and colors (first line white, the rest ice, as the headline; kept in that browser only); the field is white liquid glass with a navy entry and a sky underscore for a caret, "Your name" going as soon as it has focus and a sky ring inside the rim showing focus. Once a name is on the card (a short pause in typing, Enter or leaving the field) or the pass has been turned, "Buy your ticket now" rises in under the field in icy glass, a band of light runs across it once and the pass gives a small swing; it stays, it is only a link to the ticket page (nothing opens by itself, Enter only leaves the field), and it promises nothing about the name. Typing, dragging and turning never set each other off: the field does not turn the pass (while its back faces the visitor, the hint under it says the name is on the front), a drag never turns it and a turn never touches the field. Field and link keep their place unseen until the 3D pass is there, so nothing in the hero moves when they appear; they show only on wide screens and only while the 3D pass runs, since the still cannot change. On a phone the edition and the headline stand at the top left with the larger pass hanging on the right beside them, its lanyard showing; then the tagline, the two buttons and the three facts, as on wide screens.

The pass hangs in a pool of light, brightest right behind the card, so it comes forward. It (`home/HangingPass.astro`, ADR-0008) is a real 3D object: a card with thickness, rounded and bevelled edges, a cut slot and a laminate (clearcoat) face and an edge with a faint ice tint, printed one to one after the team's pass mockup (every position measured from it) in CI colors only, with a printed ice rim along the edge (on the 3D card the print keeps its own colors under only a thin clear gloss, and a fine film grain is drawn live over the light, never over the type, so it stays crisp at every size): the front navy with a beam of Q27 blue light (the light taken from the mockup itself, its type and lines removed and filled from the light around them, so the gradients are the mockup's) and two fine crossing lines of light with a soft glow (a low arch and a rising line, exactly as the mockup draws them, fading at their ends), a header row ("Access pass" | "Q27 · 10th edition"), the kicker and the headline with its first line white and the rest ice, date and city, the Summit wordmark and the dates, each group split by fine ice rules; the back an ice white with the mockup's own soft clouds, the same rows, "What's inside" as a list with hairlines, the same two crossing lines and the wordmark, all in Q27 blue (the mockup's mid blue is off CI; Q27 blue is the closest CI blue), the closing rule navy; large heavy type stays readable on a small card; a metal crimp and lobster clip (`public/home/pass/clip.glb`); and a woven band with "Q-SUMMIT" in the weave, built live as a strip with real thickness that bends and twists with the card. It hangs from a point above the window, behind the header; the band is a chain of points under gravity with a little bending stiffness and the card a heavier point on it, so it drops in and settles in a few calm swings, about three seconds; the chain is made exactly inextensible after every step and the card's clip sits exactly on the band's end, so a pull, however hard, never parts them. The band is fixed in the clip's crimp and runs over the point it hangs from: a pull down lets more band come down from above (the woven print stays where it is on the band's lower end, keeps its size, and new band shows at the top), a lift takes band back up over that point at once (so it never goes slack, folds and pushes the card about), and let go it springs back, so the pass bounces up once and settles; held, the pass is kept where the band can reach it, so the band is always taut under the hand and never fights it; the card and the band can both be grabbed, the card only a reach from where it hangs and lifted only a little, and a throw keeps a calm share of the hand's swing; a turn (a click or a tap on it, or "Turn the pass") is a damped spring to the other face. A fine pointer leans it a little; a mouse drags it; on touch only a sideways pull moves it, so vertical scrolling is never captured. Reflections come from a room environment and lights on clearcoat, metal and fabric, never from a painted streak. Its canvas reaches below the still's frame and lies above the copy, so the card is never cut or hidden while it lands. The still (`pass-fallback*.webp`, rendered in Blender from the same model with the same camera) shows first and stays without WebGL, with reduced motion and with data saving; the live object takes over in the same pose. The scene draws only while something moves, then sleeps, and it sleeps off screen and in hidden tabs.

The sections, in order: key figures as one row split by hairlines, every figure with the same ice plus at its foot (each figure counts up once, in under a second, from a quarter visible; the final value is in the HTML; a figure is never wider than its column); "Why Q?" as one block of two equal halves: at the top left the large "Why Q?" with its line (kept clear of the big letters' descenders at every width), at the foot of the left half the intro and the four audiences as large rows (a tab list), level with the foot of one white card on the right for the audience picked (photo, line, offer, a link to its page; hover picks on a fine pointer; the anchor stays `#why-attend`, the target of the `/whyq` redirect); the aftermovie as a stage exactly as long as the mockup's (260 % of the window height, 160 % of it with the film held in place): the film in a rounded window that opens to the whole screen quickly (over the first 30 % of the hold), two huge lines of words, each word once ("Founders · Talents · Investors" in white, "Two days · One palace" drawn as a fine ice outline around each letter's silhouette, without the inner contours a stroked variable font shows), running across it in opposite directions, each from just outside one edge until its last letter has left at the other, slowly, from early in the stage's entry to 68 % of the hold, so they can be read and every word passes in full (the path is the line's own width plus the window's, so fonts, resizes and turning a phone need no script); the last third of the hold (about half a screen) is the film alone at full size, with no words over it, while its big line comes in, and only then does the page move on; its name sits small at the top left and a small "More on YouTube" link at the top right, and a click anywhere on the film opens the channel; the film is the site's own stream, video only, loaded near the window, muted, playing only in view and in visible tabs, with no play or pause button (the team asked for the film without one; reduced motion, data saving and a slow connection keep its poster); the partners, under a heading that names the edition the logos belong to, one row per group with a running strip of logos on carriers of dark liquid glass, each with a pure white plate inside (the white most logo files are drawn on, so a logo with its own white ground shows no edge), because most partner logos are drawn dark for light ground (the logos are never recolored, cropped or rounded; all get the same optical area) and every logo, in every copy the strip repeats, links to the partner's site; the strip fades in from the row's name and out towards the window's edge (one static mask on the row, so nothing ends in a hard cut) and stops on hover, while a logo has keyboard focus and off screen (no separate pause control: the team asked for the strip without one; reduced motion shows still rows); Mannheim Palace as a line drawing right before the speakers (the mockup's "What's inside"), standing flush on the lower edge of what is in view (a phone's browser bar included) and held in place for one screen (the held stage is a layer of its own, so Safari on iPhone keeps it still while the page scrolls under it instead of redrawing it a frame late), in two layers that never depend on each other: the outline, every line and window frame drawn in full from the first moment the palace is in view and never animated, and the light, the windows lighting one after the other from the centre outwards as the visitor scrolls on through the hold (from a sixth into it, so the palace is in full view first), with a count at the top right that climbs with the lights to the number of people; on a fine pointer, the windows around the pointer light up strongly (whiter than the scroll's light, with a wider halo) and fade back once it moves on (a layer of its own over the scroll's lights, so nothing of the scroll's progress is touched; `home/palace.client.ts`); the programme on the left follows the scroll in clear steps (one stretch of the hold per item, exactly one item on screen, the old one leaving before the new one comes), and under it a row of bars says where the visitor is (items passed filled, the one on screen bright, never half full); a click on a bar jumps to its item without the items in between flashing by, and a wheel, a touch or a key hands control straight back; the whole building is always in view (its full canvas scales to the space under the words, never wider than the window, never panned), and its light only rises from the building into the night, with nothing below the ground line, so the speakers follow on the bare ground without a cut; the speakers as one endless ring (five copies, kept in the middle one even during fast swipes, so it never runs into an end) that runs slowly by itself at the partner strip's pace, holds under the pointer, while focused, off screen and for a few seconds after any hand on it, and never runs with reduced motion; it is dragged, swiped, scrolled and stepped with two round clear glass arrows (on phones too, a little smaller) that sit in the gaps where the clear cards meet the ones turning away, and settles on a card when let go; no bar appears under a card on hover, the cards beyond the page width turning away and dimming at the window's edges, each card a portrait with a navy shade at its foot carrying the name and role, so nothing lies over a face (booked speakers of the next edition first with a filled tag; earlier speakers carry no tag on the picture); the heading's two lines keep the first line's descenders clear of the second's ascenders; the discount phases after the team's Early Bird post: the heading "… is live." exactly as tall as the offer beside it and level with it; the offer told as one sentence built from the content ("30% off every ticket until 22 November.", the discount in ice) with "The earlier you book, the less you pay." under it, then, under a fine rule, the countdown in context ("Early Bird ends in" over the time, "then only 25% off" from the next phase under it, so it is plain the price rises), and the ticket link in icy glass, then the four phases as four separate cards (`ui/SaleCards.astro`, the same cards open the ticket page; no line joins them): the phase on sale in baby blue glass, its discount large and a filled tag (all four in the ticket buttons' glass, a little translucent, without marks, name at the top, discount in the middle, tag at the foot), the whole card a link to the tickets; the coming phases as clear grey glass (only the rim), plain text, so they read as later stages; past ones faded (four in a row on wide screens, two by two on tablets, compact rows on phones; data from the ticket page's `phases`, and when the phase on sale has an end in the content, the sentence names the day and the countdown runs to it, ticking only while in view; without an end, both are left out; between two phases, `phases.onSale` off, the heading reads "Christmas Sale / is coming." with "25% off every ticket dropping soon." and "Missed the Early Bird? Your next chance is just around the corner." beside it, no countdown, and the link reads "See ticket options"; the opener is `ui/SaleIntro.astro`, shared with the ticket page); and the LinkedIn and Instagram section, small glass brand marks, the copy in the Q blues and the newest four posts (their images never tinted) on one pane of white liquid glass, compact enough to fit one screen. The white site footer follows, as on every page. Figures, rows and cards carry no running numbers.

Reveals start early (as an element's top reaches 6 % below the window) and take half a second: content rises a little as it fades in; anything already passed when the page loads or jumps is shown at once, and nothing replays. In every heading a hyphenated word ("Q-Summit") stays on one line (`Unbroken.astro`).

**HOME-1 The 2027 home page is its own visual system.** Components under `src/components/home/` and the `/` page shell may skip `.section` / `.container` padding rhythm / `.button` (LAYOUT-1, LAYOUT-3, COMP-1, TYPE-1), use the wider 2027 grid (`--container-wide`), bring the site header with their intro (COMP-6), may use the `ticket-*` and `home-*` tokens, display type above the heading scale, a page-local reveal that animates opacity and transform (MOTION-3, MOTION-5), and glass depth built from tinted, layered shadows and inset light edges rather than the `--shadow-*` steps (DEPTH-1). Three.js and GSAP are allowed here (MOTION-4, ADR-0008; the only other page with Three.js is `/hackathon`, HACK-1): Three.js for the hanging pass only, GSAP for the order of intro, hero entrance and pass and for the number counters; both load from first-party bundles, the 3D module by dynamic import after first paint. Backdrop blur is reserved for the header, which content passes under, the short fade into the footer, the glass buttons and the name field; resting panes (the discount cards, the social pane) carry none, and no `backdrop-filter` lies over a moving logo strip. The logo strips loop continuously and stop as described above; the 3D pass draws only while it moves. The film and palace stages are scroll-driven CSS animations on their sections' view timelines, inside `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`; the only scripts that read the scroll there are the palace programme's step and the light around a pointer, both folded into one update a frame. Without either the stages are the plain rounded film frame and the drawing fully lit, and the running words are not drawn. Everything else stays inside MOTION-2 and MOTION-3: reduced motion skips the intro and shows the hero at once, the pass as its still, the figures at their value, the strips as hand-scrolled rows, the film's poster and the palace fully drawn and lit with its count at the total and every programme item listed. Nothing on the page is reachable by hover only (the windows that light around a pointer are decoration). Cite this ID on every home `<style>` block that would otherwise look like a silent deviation.

## Partner inquiry

`/partnersheet/` is the form where interested companies reach the partner team. It follows the homepage: the very deep navy ground of the 2027 pages with one wide, soft pool of the deep blue behind the card (nothing is drawn on it), which at its foot melts into the white site footer through a long fade (a tall fade: the deep blue grows out of clear, then a mid blue and a pale sky, turning white only at the very end, no band and no line), under the shared site header (COMP-6, never a header of its own). One column in reading order: the intro on the ground, then the form card as wide as the page (the card's tiles four across from 1100px, two on tablets, one on phones). The intro sits on the ground: the eyebrow "Partnership" in baby blue (no logo), the headline in white with its second sentence in the baby blue, as on the homepage ("shape tomorrow"), each sentence on its own single row (white first, baby blue below; they wrap only below 768px).

The form sits on one white card, the homepage's (the "Why Q?" card): white, navy type, the same soft shadow, no glass inside it. Headings and labels are navy, captions (the hints, the tile descriptions, "optional", the example text in the fields, the line under the send button) take a lighter blue, the Q27 sky taken a step toward navy so small text keeps at least 4.5:1 on white. Tiles, chips, fields and the consent box are flat: a hairline of navy at low strength, a very pale blue body for tiles and fields (`ticket-ground`) and white for chips, and a darker hairline on hover. Everything chosen or acted on is navy, like the homepage's "Learn more" button (the navy glass body of `.wp-link`: the deep blue falling to navy, restated in `inquiry-theme.css` because conference pages may not import the home classes): the chosen tile and chip fill with it and take white type and a white check, the ticked consent box is navy with a white tick, so a choice never reads by color alone. The send button and the "View your inquiry" button are that same navy button with a white label; the send button is the shared `.button.is-glass` (COMP-1) restyled on this button only. Focus is the site's blue ring.

The page is static: no entrance animation, no scroll reveal, no looping light, and the headline and copy never move. The one animated text is the example text inside the fields (`Jane Doe`, `jane@company.com`, ...): once, when the fields scroll into view, it types itself out key by key, field after field, at the pace of an ordinary typist (about 60 words a minute, uneven, with a small beat after a space or comma), and then stays exactly as typed. It is the real placeholder that grows, so the end state is the normal placeholder in the same face, size and color, nothing moves in the layout, and without JavaScript or with reduced motion the full texts show from the start. Touching the form (focus, click, key) completes all of them at once. Apart from that, motion is limited to state feedback on transform, opacity and paint-only properties, with no transition at all for reduced motion (MOTION-2). Hover, focus, choice and press use `--duration-hover`; on the send button and the "View your inquiry" button, hover only grows the box a little, with no light or brightening under the pointer anywhere on the page; the topic chips only grow a little and darken their hairline, with no glow. Choosing the privacy consent box plays one short sequence inside it, under 500ms in all: the navy fill swells up like a drop, a few tiny bubbles wobble through it, and the tick pops in as they fade (`--duration-open`, the glass stagger and spring tokens). After a complete send, the form leaves and a thank-you screen takes the card's place, as tall as the form was but at most 34rem: a round navy badge with a white tick, "Thank you for submitting your inquiry." in navy and "The partner division will get in touch with you." in the caption blue. It arrives with one short fade and rise and the badge pops in a beat later (none of it for reduced motion), and focus moves to its heading. Under the message the navy button "View your inquiry" opens a read-only preview of what was sent (a list of label and value on a pale panel, the message as typed, shown as plain text) and closes it again. Errors are text with a mark, set under their field and linked by `aria-describedby`, in the deep error red on the light error tint, never color alone. Type is Montserrat only; the draft's monospace eyebrow is Montserrat in capitals with tracking and tabular figures (TYPE-3).

**INQUIRY-1 The partner inquiry page is its own form system.** Components under `src/components/inquiry/` and the `/partnersheet` page shell may skip `.section` / `.container` padding rhythm / `.button` variants except the shared glass button (LAYOUT-1, LAYOUT-3, COLOR-2, TYPE-1), may use the `ticket-*` color, radius and duration tokens, display type above the heading scale, and a navy glass body and a soft card shadow built from tinted shadows and inset light edges rather than the `--shadow-*` steps (DEPTH-1). They do not import `tickets/ticket-theme.css` or `home/home-theme.css`; the navy recipe is restated in `inquiry/inquiry-theme.css`. No ambient motion and no entrance animation, with one sanctioned exception: the example texts of the fields type themselves once (a text change on the real placeholder, never an animated layout property, off for reduced motion). Everything else stays inside MOTION-2 and MOTION-3. Conference pages may not import `inquiry-theme.css`. Cite this ID on every inquiry `<style>` block that would otherwise look like a silent deviation.

## Team and jobs

`/our-team/`, `/past-teams/`, `/job-listings/` and every job's own page follow the team's approved liquid glass mockups and stand on the homepage's navy (`--q-night`, HOME-1) with soft pools of its blues that scroll with the page. They share one small stylesheet on top of the homepage's glass (`ui/navy-glass.css`): the page wrapper (`.n-page`, which also turns the body navy and hides the footer's hairline), its ground (`.n-ground`), the page shell (`.n-shell`), the radiant white glass of the ticket page's light surfaces (`.n-white`: a plain white body, its depth only at the edges, a white rim against the navy) and the sliding drop of a segmented control (`.n-drop`, the Tickets button's icy glass exactly). Every button is the header's Tickets button (`.h-btn` with `.h-ice`, COMP-6) in its size; "All job listings" is the same button in solid white glass, and the Apply button inside the white job sheet drops its shadow. Nothing on these pages glows or springs: hover nudges a card a pixel or two and lightens the glass, a contact bar or a drop eases in without overshoot. Each page melts into the white footer through the homepage's own fade (`.h-page-fade`), so the transition is exactly as long as on the homepage and the ticket page.

The team page keeps the live hero (the 50% scrim, the centered white H1) but frames the group photo like the team's history page mockup (full width, the band from the top of the building's lower floor to the pavement, so the whole group stands in the frame) and dissolves its lower part into the page in one long, soft eased fade and blur (the hero has no ground of its own, so there is no edge against the navy and its pools of light below). Below it, a white glass toggle switches between Current Team and History. People who share a title stand together under one label; the title groups are packed into full rows (4 on laptops, 3 on tablets, 2 on phones, `lib/team-layout.ts`), a group is never split unless it alone is wider than a row, and a single person moves up next to the board member; all three layouts are rendered and CSS shows the one that fits. Each portrait carries a contact bar (mail left, LinkedIn right, flat ice glyphs) that rises on hover or keyboard focus, and on touch screens after a tap. The job board is a white glass search (a small sky X clears it while there is text) and workload filter over white glass job cards; a progressive blur at the window's foot belongs to the list: it is off at the top of the page and on a job's page, fades in by scroll position as the list reaches the foot of the window and out again before the footer.

**NAVY-1 The team and job pages wear the 2027 navy glass.** Components under `src/components/team/` and `src/components/jobs/`, `ui/navy-glass.css` and the `/our-team`, `/past-teams` and `/job-listings` page shells may skip `.section` / `.container` padding rhythm / `.button` (LAYOUT-1, LAYOUT-3, COMP-1, TYPE-1), may use the `ticket-*` and `home-*` tokens and the homepage's glass classes (`.h-btn`, `.h-ice`, `.h-page-fade`; HOME-1), display type above the heading scale, and glass depth built from tinted, layered shadows and inset light edges rather than the `--shadow-*` steps (DEPTH-1). Backdrop blur is reserved for the hero's melt and the job list's bottom blur. Everything else stays inside MOTION-2 and MOTION-3; there is no scroll reveal (MOTION-5). Cite this ID on every such `<style>` block that would otherwise look like a silent deviation.

**HISTORY-1 The team history is a drawn scroll story with a 3D camera.** `src/components/history/` and the story on `/past-teams` may do what NAVY-1 allows the team pages, and in addition: a pinned stage driven by one scroll-progress value, white line art drawn on a 2D canvas (a 10, a person deep in thought, a light bulb), and a Three.js camera that is drawn, turns real and becomes the photo album, loaded by dynamic `import()` after the page has loaded (MOTION-4, [ADR-0010](../../docs/decisions/0010-three-history-page.md)). Every rule lives in `history/history-theme.css` under the `.history` wrapper class, because the album's year buttons, the click targets over the camera's controls and the drawing are written by script. It uses the `ticket-*` tokens like the other navy pages and one token of its own (`--duration-history-wheel`, the scroll cue's mouse). Light is glow, not elevation (DEPTH-1). The HTML is the base layer: without JavaScript, with reduced motion or without WebGL the texts stand one after another and the photos are a plain grid; the script adds `.is-live` and only then does the stage pin. Drawings and the camera never sit behind text: on phones the drawing area follows the visible text with the scroll, never with a text's opacity. The canvases draw only while the story is on screen and rest when the scroll rests. Both team routes render the story beside the team grid and the Current Team / History switch, one switch above both in the same place, swaps the two in place (`team/TeamPanels.astro`, as before the story), so the story starts only when it is shown, never while hidden. Cite this ID on every history file that would otherwise look like a silent deviation.

## Why Q

The four audience pages under `/whyq/` (students, startups, corporates, investors) are where the homepage's audience picker leads. They follow the team's page templates in structure and wording and look like the homepage: its navy night with pools of light behind the sections, white type with ice accents, its liquid glass and its reveals. In order: a centered hero (breadcrumb, headline with its last words in ice, intro, the event line on a dark glass pill, the ticket link in icy glass and the jump to the activities under it); the key figures as four dark glass cards; the activities as a row of white glass cards (`.h-pane .h-frost`) that scrolls sideways, each with its photo, its status chip in words (included, or apply with the ticket) and its text, filtered by glass pills under the intro (All, Included, Apply with ticket; only the kinds the page has, and no filter where all are one kind) that work without JavaScript, paged by the homepage speaker rail's round glass arrows on the row's sides; one highlight section (on Startups the winner's stage photo with three moments under it; on Corporates a wall of company logos in fixed columns (2, 3 or 4 by width, so twelve logos always fill their rows) and on Investors the Qube photo beside the investors, each logo on a white plate inside the glass, as in the homepage's partner strip, never recolored, the name only where there is no logo); the audience's ticket with its side cards on dark glass, each status chip under its text at every width (on Corporates followed by the template's partner panel: its copy and button on one line, its perks as one row of glass pills, leading to the partner page); a short FAQ as stacked dark glass rows. A picture slot without a photo, or whose photo fails to load, shows the ticket page's wash from deep blue through sky to white, never a Q mark (no Q in the background, as on the ticket page) and never a labelled placeholder.

The ticket card is the ticket page's card (`tickets/TicketIncluded.astro`), read from the same `page-tickets` content through `ticket-model`, so prices, the sale phase and every benefit's status can never differ between the two pages; only the spelling of names is the rest of the site's (Startup, Pitch Battle, Young Pro, `siteSpelling` in `lib/whyq-pages.ts`), and the buy button reads "Buy now". No price is written into a Why Q page: a FAQ answer that quotes one takes it from the offer, and no answer names a sale date, which would go stale between two builds. The sections sit closer than the homepage's full-screen sections (`whyq-theme.css`). Every ticket button leads to `/ticket-categories/`, onto the ticket, never straight to the shop, and what belongs to another page is linked, not repeated (the partner packages and their contacts live on the partner page).

**WHYQ-1 The Why Q audience pages are drawn in the 2027 homepage's system.** Components under `src/components/whyq/` and the `/whyq/[audience]` page shell import `home/home-theme.css` and may do what HOME-1 allows the homepage (skip `.section` / `.container` / `.button`, the `ticket-*` tokens, display type above the heading scale, the page-local reveal, glass depth from layered shadows), under the same limits; the ticket section also imports `tickets/ticket-theme.css` for the ticket card (TICKETS-1). They add no color, radius, shadow step or motion pattern of their own; what they share lives in `whyq/whyq-theme.css`. Their script (`whyq/whyq.client.ts`) runs the hero's entrance, the reveals and the counters without an animation library (MOTION-4); everything is in the HTML without it, and reduced motion shows it at once. Cite this ID on every whyq `<style>` block that would otherwise look like a silent deviation.

## Partners

`/partner/` opens on the navy of the home page, after the team page mockup: the Q27 CI `ticket-midnight` with soft pools of `ticket-deep` and a little `ticket-sky` light, still and without any beam. The section starts under the site header, so the page is dark from its first pixel. The page title stands centered on one line (two on a phone), large but in semibold and set tight, with a small tracked ice label over it. Under it runs a bar of the tier names: a pill of the site header's own dark glass (midnight, blurred, with a hairline of ice that is brightest along its lower edge), only as wide as its names, centered, and once it sticks a small gap under the header. Its links are the header's soft white names in semibold; the tier in view turns ice, as the current page in the header, on a faint chip. The bar is sticky inside the logos only: it rides along under the header from the first tier to the last and leaves before the testimonials. On a phone it scrolls sideways under soft edges and keeps the tier in view inside it. Without JavaScript its links still jump to the tiers.

Every tier follows the one before it, in the live order (Platinum, Gold, Silver, Starter, Knowledge, Event, Mobility, University and Network, Media), under a quiet heading: the tier name in small, widely spaced ice capitals between two fine lines that fade out toward the edges ("PLATINUM PARTNERS"), the first tier in white. Its logos stand in even rows with generous air between them, every cell the same height so each row reads as one line, a last row that is not full centered under the others. Platinum shows its logos largest and in the fewest columns, Gold a step smaller, the rest smaller again, but every logo large enough to read at a glance; no mark is wider than four fifths of its cell, so wide logos never run into each other. Every logo is sized by the square root of its aspect ratio, so a wide wordmark and a square emblem cover about the same area; a square emblem a little less, as it reads heavier.

Every partner logo stands directly on the dark, in white and ice blue, with no box behind it: the page tones each logo once as it comes near the screen (`logo-tone.client.ts`). A solid, even ground along the image's edge is keyed out, and so is any container that holds the whole logo: a box or a sticker outline, found as a shape whose outer band is all one tone and holds marks of the other tone, so a black outline around white letters or a frame around a box falls away and only the marks inside remain. A container that is only one part of the logo, such as a round badge beside the wordmark, is turned the other way round: the badge stays white and the symbol inside it is cut out, so the navy of the page shows through it. Neutral parts of what is left (black, grey, white) turn white, colored parts ice blue, so a logo keeps its inner contrast in two tones. Without JavaScript one SVG color matrix in the page does the same for logos on a clear or white ground. A partner with its own white logo for dark grounds (uploaded by the partner team as "Logo for dark backgrounds") is shown as it is instead. Logos are never stretched or redrawn, and the pop-up always shows the original colors. At rest nothing moves. Pointing at a logo, or tabbing to it, shows the real logo: a card of white glass with a lit top and a soft ice foot fades in behind the logo, filling its cell, the white logo gives way to the original in its own colors, trimmed to its mark, and the partner's name appears under the card on a small dark tag. With focus the card carries a white ring. Phones have no pointer, so there the pop-up shows the real logo. Picking a partner opens its pop-up out of the logo: dark glass with a lit rim, the tier, the regular logo on a large plate of white glass, an optional short description from the partner record and a glass button to the partner's website. It is a native modal dialog: it opens with focus on the pop-up itself, so no button lights up a focus ring on its own, focus stays inside, Escape, the close button or a click outside close it, and focus returns to the logo. A click with a modifier key still opens the website directly. Without JavaScript every logo is a plain link to the partner's website.

The dark ends in light the way the home hero does: a veil of the home page's pale cool ground grows over it along a smoothstep curve and reaches the solid ground before the edge, so the testimonials below read as the lights coming back on and no edge ever cuts the page.

Below the dark the page speaks in the home page's voice (`components/partner/partner-theme.css`, restating HOME-1 rather than importing it): the pale cool ground with two still pools of ice light, the home section rhythm, section titles extra bold and set tight, intros in navy at three quarters strength (never neutral grey), glass panes in the home finish, and calls to action as the shared liquid glass button filled with navy glass, with a small uppercase label and an arrow. The ground fades into the footer's white, and the footer drops its hairline. The testimonials ("What our partners say") are large partner photos, each on a pane of that glass with the name and company under the photo. A photo is a real button, marked by a round quote mark of the home page's clear glass (as the speaker arrows), that opens that partner's quote as a white speech bubble with navy type; it rises above the card with its tail pointing down at the person, and opening it scrolls the page so the bubble sits in view under the site header. Only one is open at a time, Escape or a click elsewhere closes it, and without JavaScript every quote stands under its photo. A missing photo shows the person's initials on a field of ice light. Become a Partner closes the page in two columns (one on phones): on the left a small sky label, the title and intro left-aligned and a short list of what a partner gets, each line behind a small disc of sky; on the right the person companies talk to on a pane of light glass (portrait, name, role, a quiet outlined button that opens a new email to them and beside it a copy icon of the same height whose small navy hint says what it does and, for a moment after a copy, that it is done; without a button label the address itself is the link and breaks only before the @), and under the card the main navy glass button to the partner form. Below them the three audiences stand in a row of light glass links, each leading to its audience page (`/partner/startup/`, `/partner/corporate/`, `/partner/investor/`) built from conference primitives.

**PARTNER-1 The partner page stays on the navy of the home page down to the footer.** The components under `components/partner/` that build the dark opening (`PartnerTiers.astro`, `PartnerDialog.astro`) may paint the `.section.is-dark` shell in `ticket-midnight` with pools of light instead of navy (COLOR-2), pull it up under the site header (LAYOUT-3), set the page title in a display size above the heading scale in semibold and the tier headings as small tracked capitals (TYPE-1), play its intro once per page load with its own keyframes (MOTION-5), restate the site header's dark glass for the tier bar (COMP-6), and draw the ground, the bar, the hover card and the dialog with gradients and glows of the `ticket-*` color tokens instead of the `--shadow-*` steps, because they are light and glass, not elevation (DEPTH-1). All of it is CSS: no shader, no image and no animation runtime (MOTION-4). Partner logos are toned to white and ice blue, their own grounds, boxes and outlines keyed out and badges cut out, by one SVG color matrix and, where JavaScript runs, by `logo-tone.client.ts` on a canvas, once per logo; a partner's own white logo is shown as it is, and the hover card and the pop-up show the original. Logos are never stretched or redrawn. Its motion uses transform and opacity only (MOTION-3) and is timed by `--duration-reveal` and `--duration-partner-stagger` (MOTION-1): each beat of the intro stays inside `--duration-reveal`, nothing repeats on its own, and reduced motion has none of it (MOTION-2). The sections below the logos (`partner-theme.css`, `TestimonialQuotes.astro`, `JoinCta.astro`, imported by the partner page and its components only) restates the home page's voice instead of importing `home/` styles: its section rhythm, title and intro type, glass and ground, carrying the logos' midnight and pools of deep blue light, never lighter, down to the home page's long fade into the footer's white, so it may build its sections on its own `.p-section` shell with a `.p-head` opener instead of `.section` and `.section-header` (LAYOUT-1, LAYOUT-4), skip `.section` padding and `SectionHeader` (LAYOUT-3, TYPE-1), set Become a Partner left-aligned in two columns, and build depth from layered light (DEPTH-1); its calls to action are the shared `.button.is-glass` (COMP-1), clear over the blue as on the home page; the dialog's website button keeps that button's shape and type but is plain white with a navy label and no glow, like the logo plate above it, and its description is white; Send inquiry wears the home page's icy glass (`.p-ice`, the ticket buttons' tint restated) with a navy label. The contact's address is a plain ice-blue link that opens a new email, with a small labeled copy button beside it. The dialog's close button and the copy button are small controls, not calls to action, so they are styled in their components rather than as `.button` (COMP-1). Focus on the partner page follows the glass buttons instead of the blue focus ring (Colors): a white outline on the dark ground, as on the home page. The audience pages under `/partner/` keep the conference primitives, with two sizes restated (TYPE-1): their `h1` at the `h2` size, because it reads as a sub-page opener under its breadcrumb, and the card titles at the `h6` size. Like HOME-1, the partner components may use the `ticket-*` color and radius tokens (the page is the same Q27 CI gradient, so it takes them as they are rather than holding copies under its own names); only they may use `--duration-partner-stagger`, and they never use `kickoff-*` or `hack-*` tokens or `home/` styles. Cite this ID on every partner `<style>` block that would otherwise look like a silent deviation.

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
