/**
 * Submenus of the site navigation (DESIGN.md COMP-6): WAI APG disclosure
 * navigation. Each item with children is one button (its label and a
 * chevron; the item is no page of its own) whose aria-expanded /
 * aria-controls show or hide the children.
 *
 * State is one attribute, data-sub="open" on the item. Nav.astro turns it
 * into the motion with CSS transitions only (MOTION-6), so there is no
 * timer here to get out of step: a second click mid-way just flips the
 * attribute back and everything reverses from where it is. A closed panel
 * is inert at once, so nothing in it can be focused while it folds.
 *
 * From 768px up the panel is a dropdown: a click, tap or Enter/Space on
 * the button opens it until it is dismissed (button again, Escape, a
 * pointer press outside, focus moving on); a mouse may also open it by
 * hovering the item, and then it closes when the pointer leaves. Below
 * 768px it is a group that expands in place inside the menu sheet and only
 * the button toggles it; Escape there closes the sheet (nav-menu.client.ts).
 */
import { tokenMs } from "../../lib/motion/time";

/** Same grounds nav-tone.client.ts frosts the bar for. */
const DARK_GROUNDS = '.section.is-dark, [data-nav-tone="dark"]';

interface Submenu {
  group: HTMLElement;
  toggle: HTMLButtonElement;
  panel: HTMLElement;
  /** Opened by click or key: stays open when the pointer leaves. */
  pinned: boolean;
  /** Pending hover open or close. */
  hoverTimer: number;
}

export function initNavSubmenus(header: HTMLElement) {
  const menus: Submenu[] = [
    ...header.querySelectorAll<HTMLElement>("[data-nav-group]"),
  ].flatMap((group) => {
    const toggle = group.querySelector<HTMLButtonElement>(".nav-sub-toggle");
    const panel = group.querySelector<HTMLElement>(".nav-sub");
    return toggle && panel
      ? [{ group, toggle, panel, pinned: false, hoverTimer: 0 }]
      : [];
  });
  if (menus.length === 0) return;

  const desktop = window.matchMedia("(min-width: 768px)");
  const canHover = window.matchMedia("(hover: hover)");
  // Hover intent: a pointer crossing the item on its way elsewhere should
  // not flash the dropdown, and one cutting the corner towards it should
  // not lose it.
  const hoverMs = tokenMs("--duration-hover", 150, header);

  const isOpen = (menu: Submenu) => menu.group.dataset.sub === "open";

  /** Hang the dropdown where it fits and aim its unfold at the chevron. */
  function place({ group, toggle, panel }: Submenu) {
    const item = group.getBoundingClientRect();
    const width = panel.offsetWidth;
    const fitsStart = item.left + width <= document.documentElement.clientWidth;
    const end = !fitsStart && item.right - width >= 0;
    panel.dataset.align = end ? "end" : "start";
    const left = end ? item.right - width : item.left;
    const chevron = (
      toggle.querySelector("svg") ?? toggle
    ).getBoundingClientRect();
    panel.style.setProperty(
      "--nav-sub-origin-x",
      `${Math.round(chevron.left + chevron.width / 2 - left)}px`,
    );
  }

  /** Frost the glass while a dark ground sits behind the dropdown. */
  function readGround({ panel }: Submenu) {
    const box = panel.getBoundingClientRect();
    const dark = [...document.querySelectorAll(DARK_GROUNDS)].some((ground) => {
      const rect = ground.getBoundingClientRect();
      return (
        rect.bottom > box.top &&
        rect.top < box.bottom &&
        rect.right > box.left &&
        rect.left < box.right
      );
    });
    panel.dataset.ground = dark ? "dark" : "light";
  }

  // The ground can change under an open dropdown; watch scrolling only
  // while one is open, one read per frame.
  let groundFrame = 0;
  let watching = false;
  const onScroll = () => {
    cancelAnimationFrame(groundFrame);
    groundFrame = requestAnimationFrame(() => {
      menus.filter(isOpen).forEach(readGround);
    });
  };
  function watchGround() {
    const wanted = desktop.matches && menus.some(isOpen);
    if (wanted === watching) return;
    watching = wanted;
    if (wanted) window.addEventListener("scroll", onScroll, { passive: true });
    else {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(groundFrame);
    }
  }

  function setOpen(menu: Submenu, open: boolean, pinned = false) {
    window.clearTimeout(menu.hoverTimer);
    menu.pinned = open && pinned;
    if (isOpen(menu) !== open) {
      if (open) {
        // One submenu at a time.
        menus.forEach((other) => {
          if (other !== menu) setOpen(other, false);
        });
        if (desktop.matches) {
          place(menu);
          readGround(menu);
        }
      }
      menu.group.dataset.sub = open ? "open" : "closed";
      menu.toggle.setAttribute("aria-expanded", open ? "true" : "false");
      menu.panel.inert = !open;
    }
    watchGround();
  }

  for (const menu of menus) {
    const { group, toggle, panel } = menu;
    group.dataset.sub = "closed";
    panel.inert = true;

    // A hover-opened dropdown is already showing what the button promises,
    // so the first click keeps (pins) it instead of closing it under the
    // pointer; only a click on a pinned one closes.
    toggle.addEventListener("click", () => {
      setOpen(menu, !(isOpen(menu) && menu.pinned), true);
    });

    group.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      if (!desktop.matches || !canHover.matches) return;
      window.clearTimeout(menu.hoverTimer);
      if (isOpen(menu)) return;
      menu.hoverTimer = window.setTimeout(
        () => setOpen(menu, true),
        hoverMs / 2,
      );
    });

    group.addEventListener("pointerleave", (event) => {
      if (event.pointerType !== "mouse") return;
      window.clearTimeout(menu.hoverTimer);
      if (!desktop.matches || !isOpen(menu) || menu.pinned) return;
      // Keyboard focus inside the list keeps it: closing would drop the
      // focus. Tab moving on or Escape closes it then.
      if (panel.contains(document.activeElement)) return;
      menu.hoverTimer = window.setTimeout(() => setOpen(menu, false), hoverMs);
    });

    // Disclosure, not a modal: Tab may leave, and leaving closes the
    // dropdown. The in-sheet group stays as the visitor left it.
    group.addEventListener("focusout", (event) => {
      if (!desktop.matches || !isOpen(menu)) return;
      const next = event.relatedTarget;
      if (!(next instanceof Node) || group.contains(next)) return;
      setOpen(menu, false);
    });

    // Optional APG arrow keys: Down from the button enters the list, Up and
    // Down move through it and wrap, Home and End jump to its ends.
    group.addEventListener("keydown", (event) => {
      const { key } = event;
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return;
      const links = [...panel.querySelectorAll<HTMLAnchorElement>("a")];
      const active = document.activeElement;
      const at = links.findIndex((link) => link === active);
      let next: number;
      if (at === -1) {
        if (active !== toggle || key !== "ArrowDown") return;
        setOpen(menu, true, true);
        next = 0;
      } else if (key === "Home") next = 0;
      else if (key === "End") next = links.length - 1;
      else {
        next =
          (at + (key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
      }
      event.preventDefault();
      links[next]?.focus();
    });
  }

  // Escape closes the dropdown and hands focus back to its button when the
  // focus was inside. Below 768px Escape belongs to the sheet.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !desktop.matches) return;
    const menu = menus.find(isOpen);
    if (!menu) return;
    const hadFocus = menu.group.contains(document.activeElement);
    setOpen(menu, false);
    if (hadFocus) menu.toggle.focus();
  });

  // A pointer press anywhere outside the item dismisses its dropdown.
  document.addEventListener("pointerdown", (event) => {
    if (!desktop.matches) return;
    const target = event.target;
    for (const menu of menus) {
      if (!isOpen(menu)) continue;
      if (target instanceof Node && menu.group.contains(target)) continue;
      setOpen(menu, false);
    }
  });

  // Crossing the breakpoint swaps dropdown for in-sheet group: start both
  // from closed rather than carry one layout's state into the other.
  desktop.addEventListener("change", () => {
    for (const menu of menus) {
      setOpen(menu, false);
      delete menu.panel.dataset.align;
      delete menu.panel.dataset.ground;
      menu.panel.style.removeProperty("--nav-sub-origin-x");
    }
  });
}
