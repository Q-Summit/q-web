/**
 * Left and right arrow keys for the two carousels on /speaker (hot topics
 * and the speaker stage, DESIGN.md SPEAKER-1).
 *
 * One document listener serves both: the key steps the carousel that holds
 * the focus, otherwise the one that fills most of the window, so the arrows
 * work as soon as a section is in view, without clicking into it first.
 * Keys with a modifier and keys typed into a form field are left alone.
 */

type Step = (direction: -1 | 1) => void;

const carousels: { root: HTMLElement; step: Step }[] = [];

function visibleHeight(el: HTMLElement): number {
  const r = el.getBoundingClientRect();
  return Math.max(
    0,
    Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0),
  );
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  if (event.defaultPrevented || event.altKey || event.ctrlKey) return;
  if (event.metaKey || event.shiftKey) return;
  const target = event.target;
  if (
    target instanceof HTMLElement &&
    target.closest("input, textarea, select, [contenteditable]")
  )
    return;

  const active = document.activeElement;
  let carousel = carousels.find((c) => active && c.root.contains(active));
  if (!carousel) {
    let best = 0;
    for (const c of carousels) {
      const height = visibleHeight(c.root);
      if (height > best) {
        best = height;
        carousel = c;
      }
    }
  }
  if (!carousel) return;
  event.preventDefault();
  carousel.step(event.key === "ArrowLeft" ? -1 : 1);
}

export function registerArrowKeys(root: HTMLElement, step: Step): void {
  if (carousels.length === 0) document.addEventListener("keydown", onKeydown);
  carousels.push({ root, step });
}
