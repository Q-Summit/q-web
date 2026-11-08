/**
 * Glass press (DESIGN.md MOTION-6): direct, first-frame feedback for any
 * element marked `data-glass-press`.
 *
 *   - `is-pressed` while a pointer or Enter/Space holds it, so the press
 *     compression is the same on touch, mouse and keyboard (a plain
 *     :active is unreliable on touch and absent for keys);
 *   - `is-lit` replays a short light pulse that starts where the finger
 *     or pointer landed (`--press-x` / `--press-y`, in percent), drawn by a
 *     child `.glass-light` layer in global.css.
 *
 * Nothing here delays the element's own action: a link navigates and a
 * button fires on the native event, while the light keeps playing.
 */
const pressed = "is-pressed";
const lit = "is-lit";

function target(e: Event): HTMLElement | null {
  // Document-level events (pointerleave, focusout) can target the
  // document or window, which have no closest().
  return e.target instanceof Element
    ? e.target.closest<HTMLElement>("[data-glass-press]")
    : null;
}

function pulse(el: HTMLElement, x = 50, y = 50): void {
  el.style.setProperty("--press-x", `${x}%`);
  el.style.setProperty("--press-y", `${y}%`);
  el.classList.remove(lit);
  // Restart the pulse animation across a reflow.
  void el.offsetWidth;
  el.classList.add(lit);
}

let ready = false;

export function initGlassPress(root: Document | HTMLElement = document): void {
  if (ready) return;
  ready = true;

  root.addEventListener("pointerdown", (e) => {
    const ev = e as PointerEvent;
    const el = target(ev);
    if (!el || !ev.isPrimary || ev.button > 0) return;
    const r = el.getBoundingClientRect();
    el.classList.add(pressed);
    pulse(
      el,
      ((ev.clientX - r.left) / Math.max(1, r.width)) * 100,
      ((ev.clientY - r.top) / Math.max(1, r.height)) * 100,
    );
  });

  const release = (e: Event) => target(e)?.classList.remove(pressed);
  for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
    root.addEventListener(type, release, { capture: true });
  }

  root.addEventListener("keydown", (e) => {
    const ev = e as KeyboardEvent;
    if ((ev.key !== "Enter" && ev.key !== " ") || ev.repeat) return;
    const el = target(ev);
    if (!el) return;
    el.classList.add(pressed);
    pulse(el);
  });
  root.addEventListener("keyup", release);
  root.addEventListener("focusout", release);

  root.addEventListener("animationend", (e) => {
    const el = target(e);
    if (el && (e as AnimationEvent).animationName === "glass-light") {
      el.classList.remove(lit);
    }
  });

  // A link that opened a new tab leaves this page shown again later.
  window.addEventListener("pageshow", () =>
    document
      .querySelectorAll(`[data-glass-press].${pressed}`)
      .forEach((el) => el.classList.remove(pressed)),
  );
}
