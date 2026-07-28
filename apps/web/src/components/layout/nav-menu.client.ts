/** Mobile nav disclosure (WAI APG): toggle, Escape, outside dismiss, scroll lock. */

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

  const panel = header.querySelector<HTMLElement>("#site-nav");
  touchMoveBlock = (event: TouchEvent) => {
    const target = event.target;
    if (
      panel &&
      target instanceof Node &&
      panel.contains(target) &&
      panel.scrollHeight > panel.clientHeight
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

function setOpen(header: HTMLElement, open: boolean) {
  const toggle = header.querySelector<HTMLButtonElement>(".nav-toggle");
  const panel = header.querySelector<HTMLElement>("#site-nav");
  if (!toggle || !panel) return;

  const wasOpen = header.hasAttribute("data-open");
  header.toggleAttribute("data-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  toggle.setAttribute("aria-label", open ? LABEL_CLOSE : LABEL_OPEN);
  // hidden keeps the a11y tree in sync with aria-expanded (APG disclosure).
  panel.hidden = !open;

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
  header.removeAttribute("data-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", LABEL_OPEN);
  panel.hidden = false;
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
