/** Mobile nav drawer progressive enhancement (toggle, Escape, outside click). */

const OPEN_CLASS = "is-nav-open";

function setOpen(header: HTMLElement, open: boolean) {
  const toggle = header.querySelector<HTMLButtonElement>(".nav-toggle");
  const panel = header.querySelector<HTMLElement>("#site-nav");
  if (!toggle || !panel) return;

  header.toggleAttribute("data-open", open);
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
  document.documentElement.classList.toggle(OPEN_CLASS, open);
}

function isOpen(header: HTMLElement): boolean {
  return header.hasAttribute("data-open");
}

export function initNavMenu(header: HTMLElement) {
  const toggle = header.querySelector<HTMLButtonElement>(".nav-toggle");
  if (!toggle) return;

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(header, !isOpen(header));
  });

  header.querySelectorAll<HTMLAnchorElement>("#site-nav a").forEach((link) => {
    link.addEventListener("click", () => setOpen(header, false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen(header)) {
      setOpen(header, false);
      toggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!isOpen(header)) return;
    const target = event.target;
    if (!(target instanceof Node) || header.contains(target)) return;
    setOpen(header, false);
  });

  // Desktop resize: never leave the drawer open / scroll locked.
  const desktopQuery = window.matchMedia("(min-width: 768px)");
  const onBreakpoint = () => {
    if (desktopQuery.matches) setOpen(header, false);
  };
  desktopQuery.addEventListener("change", onBreakpoint);
}
