/**
 * Runs the home hero countdown (HeroCountdown.astro, DESIGN.md HOME-1).
 *
 * The time left is always recomputed from the real target instant and the
 * current clock, never counted down by a timer, so a sleeping tab, a
 * throttled background timer or a changed system clock cannot make it
 * drift: the first tick after the page is visible again is correct.
 * Ticks are aligned to the wall clock second and stop while the tab is
 * hidden or the display is off screen.
 *
 * On load the display starts up: the figures run through random numbers
 * while the display sharpens out of its blur (the hero's entrance), and the
 * units settle on the real time from left to right. It runs once, takes
 * about a second, shows only random figures (never a wrong time that could
 * be read as one for longer than a frame) and is skipped for reduced
 * motion.
 */
import {
  COUNTDOWN_UNITS,
  remainingUntil,
  spokenRemaining,
  unitText,
  type CountdownUnit,
} from "../../lib/countdown";

/** Start-up timing: how long the figures run before the last unit settles. */
const BOOT_SETTLE_MS = 1100;
const BOOT_FRAME_MS = 60;

function initCountdown(root: HTMLElement): void {
  const target = Number(root.dataset.target);
  if (!Number.isFinite(target)) return;

  const row = root.querySelector<HTMLElement>("[data-countdown-row]");
  const spoken = root.querySelector<HTMLElement>("[data-countdown-spoken]");
  const live = root.querySelector<HTMLElement>("[data-countdown-live]");
  const template = root.dataset.spoken ?? "";
  const units = new Map<CountdownUnit, { box: HTMLElement; text: string }>();
  for (const unit of COUNTDOWN_UNITS) {
    const box = root.querySelector<HTMLElement>(
      `[data-unit="${unit}"] [data-digits]`,
    );
    if (!box) return;
    units.set(unit, { box, text: "" });
  }
  if (!row) return;

  let timer = 0;
  let onScreen = true;
  let spokenMinute = -1;
  let finished = false;
  let lastDigits = -1;
  let booting = false;

  /** Shows `text` in a unit: each figure takes the outline of its digit. */
  function show(box: HTMLElement, text: string): void {
    let figures = [...box.querySelectorAll<SVGElement>("[data-digit]")];
    // The day count loses (or, after a clock change, gains) a digit.
    while (figures.length > text.length) figures.shift()!.remove();
    while (figures.length < text.length && figures[0]) {
      const copy = figures[0].cloneNode(true) as SVGElement;
      box.prepend(copy);
      figures = [copy, ...figures];
    }
    figures.forEach((figure, i) => {
      const digit = text[i]!;
      if (figure.dataset.value === digit) return;
      figure.dataset.value = digit;
      figure
        .querySelector("rect")
        ?.setAttribute("mask", `url(#hcd-figure-${digit})`);
    });
  }

  function paint(): void {
    const left = remainingUntil(target, Date.now());

    if (left.done) {
      finished = true;
      row!.hidden = true;
      if (live) live.hidden = false;
      if (spoken) spoken.textContent = "";
      root.setAttribute("data-state", "live");
      return;
    }

    let digits = 0;
    for (const unit of COUNTDOWN_UNITS) {
      const state = units.get(unit)!;
      const text = unitText(unit, left);
      digits += text.length;
      if (text === state.text) continue;
      show(state.box, text);
      state.text = text;
    }
    // The figure size follows the number of figures in the display.
    if (digits !== lastDigits) {
      lastDigits = digits;
      row!.style.setProperty("--digits", String(digits));
    }

    // Screen readers get one sentence, refreshed once a minute, not a
    // stream of changing figures (no live region: read on demand).
    const minute = Math.floor((target - Date.now()) / 60_000);
    if (spoken && minute !== spokenMinute) {
      spokenMinute = minute;
      spoken.textContent = spokenRemaining(template, left);
    }
    root.setAttribute("data-state", "running");
  }

  function schedule(): void {
    window.clearTimeout(timer);
    if (finished || document.hidden || !onScreen) return;
    // Wake just after the next full second of the wall clock.
    timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 12);
  }

  function tick(): void {
    // The power-on sequence owns the display until it hands over.
    if (booting) return;
    paint();
    schedule();
  }

  /**
   * The start-up sequence. The display is sized for the real number first,
   * so nothing shifts; every frame then shows random figures, until a
   * unit's turn to settle, when it shows the real value. At the end the
   * normal tick takes over.
   */
  function boot(): void {
    const first = remainingUntil(target, Date.now());
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (first.done || reduced) {
      tick();
      return;
    }

    booting = true;
    root.setAttribute("data-state", "booting");
    const lengths = COUNTDOWN_UNITS.map((unit) => unitText(unit, first).length);
    lastDigits = lengths.reduce((sum, n) => sum + n, 0);
    row!.style.setProperty("--digits", String(lastDigits));

    const start = performance.now();
    const end = (): void => {
      booting = false;
      // Whatever a unit shows now is not its state: repaint all of them.
      for (const state of units.values()) state.text = "";
      tick();
    };
    const frame = (): void => {
      const t = performance.now() - start;
      if (t >= BOOT_SETTLE_MS || document.hidden) {
        end();
        return;
      }
      const left = remainingUntil(target, Date.now());
      COUNTDOWN_UNITS.forEach((unit, i) => {
        const { box } = units.get(unit)!;
        const settleAt = (BOOT_SETTLE_MS * (i + 1)) / COUNTDOWN_UNITS.length;
        if (t >= settleAt) {
          show(box, unitText(unit, left).padStart(lengths[i]!, "0"));
        } else {
          let random = "";
          for (let n = 0; n < lengths[i]!; n++) {
            random += String(Math.floor(Math.random() * 10));
          }
          show(box, random);
        }
      });
      window.setTimeout(frame, BOOT_FRAME_MS);
    };
    frame();
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
    else window.clearTimeout(timer);
  });
  // A restored page (back/forward cache) is stale by however long it slept.
  window.addEventListener("pageshow", tick);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      if (onScreen) tick();
      else window.clearTimeout(timer);
    }).observe(root);
  }

  boot();
}

document
  .querySelectorAll<HTMLElement>("[data-countdown]:not([data-countdown-ready])")
  .forEach((root) => {
    root.setAttribute("data-countdown-ready", "");
    initCountdown(root);
  });
