/**
 * Dynamic type (DESIGN.md MOTION-6), after the reference: text writes
 * itself word by word inside a glass surface that has just unfolded. Each
 * word fades up from nothing in --duration-type-fade, one word every
 * --duration-type-word, capped so a whole line never takes longer than
 * MAX_MS. No cursor, no loop.
 *
 * Only for short headings and supporting text, when a section first comes
 * into view or a ticket is switched; never for prices, buttons,
 * navigation, options or compare data.
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
  { delay = 0, held = false }: { delay?: number; held?: boolean } = {},
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
  // held: laid out and invisible, waiting to be written (typeOnView).
  shown.className = held ? "type-words is-held" : "type-words";
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

/**
 * Text marked `data-type` writes itself in the first time it scrolls into
 * view, once per page load: scrolling back never retypes it. Until then it
 * is laid out and invisible (held), so there is no flash of the finished
 * text and no reflow when the words appear. `data-type-after` delays the
 * start by that many --duration-glass-unfold (the surface around it
 * unfolds first). Before this runs, global.css keeps marked text hidden
 * for a short moment only (html.js-type, set in Base.astro), and shows it
 * anyway if the script never arrives.
 */
export function typeOnView(root: ParentNode = document): void {
  const els = [...root.querySelectorAll<HTMLElement>("[data-type]")].filter(
    (el) => !el.hasAttribute("data-type-ready"),
  );
  if (!els.length) return;
  const texts = new Map(els.map((el) => [el, el.textContent ?? ""]));
  const ready = (el: HTMLElement) => el.setAttribute("data-type-ready", "");

  if (reduce() || !("IntersectionObserver" in window)) {
    els.forEach(ready);
    return;
  }
  const unfold = tokenMs("--duration-glass-unfold", 380);
  // The first report per element says where it is at load: anything
  // already on screen, even only partly (a hero intro at the bottom of a
  // short window), types right away, so it never sits there blank. Text
  // that scrolls in later waits until half of it (or half the screen) is
  // in view, so it is written where it will be read.
  const seen = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const first = !seen.has(el);
        seen.add(el);
        if (!entry.isIntersecting) continue;
        const visible = entry.intersectionRect.height;
        const enough =
          entry.intersectionRatio >= 0.5 ||
          visible >= (entry.rootBounds?.height ?? innerHeight) * 0.5;
        if (!first && !enough) continue;
        io.unobserve(el);
        const after = Number(el.dataset.typeAfter ?? 0) || 0;
        typeWords(el, texts.get(el) ?? "", { delay: after * unfold });
      }
    },
    { threshold: [0, 0.5, 1] },
  );
  els.forEach((el) => {
    typeWords(el, texts.get(el) ?? "", { held: true });
    ready(el);
    io.observe(el);
  });
}
