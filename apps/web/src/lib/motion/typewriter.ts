/**
 * Dynamic type (DESIGN.md MOTION-6), after the reference: text writes
 * itself word by word inside a glass surface that has just unfolded. Each
 * word fades up from nothing in --duration-type-fade, one word every
 * --duration-type-word, capped so a whole line never takes longer than
 * MAX_MS. No cursor, no loop.
 *
 * Only for short supporting text that appears in an interaction; never for
 * prices, buttons, navigation, options or compare data.
 *
 * Layout never moves: every word is in the DOM at full size from the first
 * frame, only invisible, so line breaks and height are final before the
 * first word shows. Screen readers get the whole sentence once from a
 * visually hidden copy; the animated words are aria-hidden. Calling it
 * again replaces whatever is still typing. Reduced motion, or no
 * JavaScript at all, shows the plain text.
 */
import { tokenMs } from "./time";

const MAX_MS = 720;

const reduce = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function typeWords(
  el: HTMLElement,
  text: string,
  { delay = 0 }: { delay?: number } = {},
): void {
  const clean = text.trim();
  if (reduce() || !clean) {
    el.textContent = clean;
    return;
  }
  const words = clean.split(/\s+/);
  const perWord = Math.min(
    tokenMs("--duration-type-word", 150, el),
    MAX_MS / Math.max(1, words.length),
  );

  const spoken = document.createElement("span");
  spoken.className = "u-visually-hidden";
  spoken.textContent = clean;

  const shown = document.createElement("span");
  shown.className = "type-words";
  shown.setAttribute("aria-hidden", "true");
  words.forEach((word, i) => {
    if (i > 0) shown.append(" ");
    const w = document.createElement("span");
    w.className = "type-word";
    w.textContent = word;
    w.style.animationDelay = `${Math.round(delay + i * perWord)}ms`;
    shown.append(w);
  });

  el.replaceChildren(spoken, shown);
}
