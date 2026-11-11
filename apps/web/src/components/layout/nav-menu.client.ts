/** Mobile nav disclosure (WAI APG): toggle, Escape, outside dismiss, scroll lock. */
import { tokenMs } from "../../lib/motion/time";

const OPEN_CLASS = "is-nav-open";
const LABEL_OPEN = "Open menu";
const LABEL_CLOSE = "Close menu";

let lockedScrollY = 0;
let touchMoveBlock: ((event: TouchEvent) => void) | null = null;

function lockScroll(header: HTMLElement) {
  lockedScrollY = window.scrollY;
  const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.classList.add(OPEN_CLASS);
  // Header is position:fixed, so overflow lock is enough (no body top offset).
  document.body.style.overflow = "hidden";
  if (scrollbarGap > 0) {
    document.body.style.paddingRight = `${scrollbarGap}px`;
  }

  // The scroller is the link list, not the sheet: the list is the element
  // with the max-height (Nav.astro), so the sheet itself never overflows.
  // With a submenu expanded the list outgrows a small phone, and a touch
  // that starts in it has to be allowed to scroll it.
  const list = header.querySelector<HTMLElement>("#site-nav > ul");
  touchMoveBlock = (event: TouchEvent) => {
    const target = event.target;
    if (
      list &&
      target instanceof Node &&
      list.contains(target) &&
      list.scrollHeight > list.clientHeight
    ) {
      return;
    }
    event.preventDefault();
  };
  document.addEventListener("touchmove", touchMoveBlock, { passive: false });
}

function unlockScroll() {
  document.documentElement.classList.remove(OPEN_CLASS);
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  if (touchMoveBlock) {
    document.removeEventListener("touchmove", touchMoveBlock);
    touchMoveBlock = null;
  }
  window.scrollTo(0, lockedScrollY);
}

/*
 * The sheet unfolds out of the menu button and folds back into it
 * (DESIGN.md MOTION-6). Both directions are CSS transitions keyed on
 * data-sheet, so toggling mid-way reverses from wherever the sheet is.
 * Closing keeps the sheet rendered until the fold has played, but makes it
 * inert at once, so nothing in it can be focused or read while it goes.
 */
let foldTimer = 0;

function foldMs(panel: HTMLElement): number {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  // The links leave first (0.35 of the fold), then the glass folds; keep
  // the box until both have played (Nav.astro).
  return tokenMs("--duration-glass-fold", 220, panel) * 1.35 + 40;
}

function setOpen(header: HTMLElement, open: boolean) {
  const toggle = header.querySelector<HTMLButtonElement>(".nav-toggle");
  const panel = header.querySelector<HTMLElement>("#site-nav");
  if (!toggle || !panel) return;

  const wasOpen = header.hasAttribute("data-open");
  header.toggleAttribute("data-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.setAttribute("aria-label", open ? LABEL_CLOSE : LABEL_OPEN);
  window.clearTimeout(foldTimer);
  panel.inert = !open;
  if (open) {
    panel.hidden = false;
    // Paint the folded state once so the unfold transition runs.
    void panel.offsetHeight;
    panel.dataset.sheet = "open";
  } else {
    panel.dataset.sheet = "folded";
    // hidden keeps the a11y tree in sync with aria-expanded (APG
    // disclosure) once the fold has played.
    foldTimer = window.setTimeout(() => {
      if (!header.hasAttribute("data-open")) panel.hidden = true;
    }, foldMs(panel));
  }

  if (open && !wasOpen) lockScroll(header);
  else if (!open && wasOpen) unlockScroll();
}

function isOpen(header: HTMLElement): boolean {
  return header.hasAttribute("data-open");
}

function clearMobileState(header: HTMLElement) {
  const toggle = header.querySelector<HTMLButtonElement>(".nav-toggle");
  const panel = header.querySelector<HTMLElement>("#site-nav");
  if (!toggle || !panel) return;

  if (isOpen(header)) unlockScroll();
  window.clearTimeout(foldTimer);
  header.removeAttribute("data-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", LABEL_OPEN);
  panel.hidden = false;
  panel.inert = false;
  delete panel.dataset.sheet;
}

export function initNavMenu(header: HTMLElement) {
  const toggle = header.querySelector<HTMLButtonElement>(".nav-toggle");
  const panel = header.querySelector<HTMLElement>("#site-nav");
  if (!toggle || !panel) return;

  // Progressive enhancement marker: CSS only collapses the panel when this
  // is set, so no-JS mobile still gets a readable stacked link list.
  header.setAttribute("data-js", "true");

  const desktopQuery = window.matchMedia("(min-width: 768px)");

  function applyViewport() {
    if (desktopQuery.matches) {
      clearMobileState(header);
    } else if (!isOpen(header)) {
      panel!.hidden = true;
      toggle!.setAttribute("aria-expanded", "false");
      toggle!.setAttribute("aria-label", LABEL_OPEN);
    }
  }

  applyViewport();

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(header, !isOpen(header));
  });

  panel.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(header, false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen(header)) return;
    setOpen(header, false);
    toggle.focus();
  });

  // Pointer dismiss: click/tap outside the header closes the disclosure.
  document.addEventListener("pointerdown", (event) => {
    if (!isOpen(header)) return;
    const target = event.target;
    if (!(target instanceof Node) || header.contains(target)) return;
    setOpen(header, false);
  });

  // Keyboard: if focus leaves the header while open, close (disclosure, not
  // a modal - no focus trap; Tab can leave per APG nav disclosure notes).
  header.addEventListener("focusout", (event) => {
    if (!isOpen(header)) return;
    const next = event.relatedTarget;
    if (next instanceof Node && header.contains(next)) return;
    if (!(next instanceof Node)) return;
    setOpen(header, false);
  });

  desktopQuery.addEventListener("change", applyViewport);
}
