// Behavior for the 2027 ticket page (DESIGN.md TICKETS-1). Everything here
// is an enhancement of complete static HTML: without this script every
// ticket card of the picker is shown, the compare view shows its default
// pair and every buy link works.
import {
  euro,
  isDiscounted,
  isPositive,
  statusLabel,
  statusOf,
  type TicketClientData,
} from "./ticket-model";
import { tokenMs } from "../../lib/motion/time";

const reducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/* Pressed state on touch, pen and keyboard, not only a mouse :active. */
/* ------------------------------------------------------------------ */

function initPress(root: HTMLElement): void {
  const target = (e: Event) =>
    (e.target as Element | null)?.closest<HTMLElement>(".t-btn") ?? null;
  const release = (el: HTMLElement | null) =>
    el?.classList.remove("is-pressed");

  root.addEventListener("pointerdown", (e) => {
    const el = target(e);
    if (el && e.isPrimary) el.classList.add("is-pressed");
  });
  for (const type of ["pointerup", "pointercancel", "pointerleave"] as const) {
    root.addEventListener(type, (e) => release(target(e)), { capture: true });
  }
  root.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = target(e);
    if (el && !e.repeat) el.classList.add("is-pressed");
  });
  root.addEventListener("keyup", (e) => release(target(e)));
  root.addEventListener("focusout", (e) => release(target(e)));
  // A link opens a new tab and focus never leaves this page; clear any
  // pressed button when the page is shown again.
  window.addEventListener("pageshow", () =>
    root
      .querySelectorAll(".t-btn.is-pressed")
      .forEach((el) => el.classList.remove("is-pressed")),
  );
}

/* ------------------------------------------------------------------ */
/* The ticket picker: the list at the left is a vertical tab list, the  */
/* card at the right the one panel shown.                               */
/* ------------------------------------------------------------------ */

function initTabs(section: HTMLElement): (key: string) => void {
  const list = section.querySelector<HTMLElement>("[data-tablist]");
  if (!list) return () => {};
  const tabs = [...list.querySelectorAll<HTMLButtonElement>("[data-tab]")];
  const panels = [...section.querySelectorAll<HTMLElement>("[data-panel]")];
  const lens = list.querySelector<HTMLElement>("[data-tab-lens]");
  section.setAttribute("data-tabs-ready", "");

  // The glass lens sits under the picked row. Its size snaps; its position
  // glides (CSS transition on translate).
  let current = "";
  const placeLens = (animate: boolean) => {
    const tab = tabs.find((t) => t.dataset.tab === current);
    if (!lens || !tab) return;
    list.toggleAttribute("data-lens-instant", !animate);
    list.style.setProperty("--lens-x", `${tab.offsetLeft}px`);
    list.style.setProperty("--lens-y", `${tab.offsetTop}px`);
    list.style.setProperty("--lens-w", `${tab.offsetWidth}px`);
    list.style.setProperty("--lens-h", `${tab.offsetHeight}px`);
    list.setAttribute("data-lens-ready", "");
  };

  /*
   * The card picked comes in (MOTION-6): it slides in a little from the
   * list's side (from above where the list stands over it) and fades up,
   * then its rows follow in a quick cascade (CSS). Web Animations with a
   * backwards fill only, so a quick next pick cancels whatever is still
   * running and nothing is left on a layer of its own. The cards share
   * one cell, so the page never moves.
   */
  const root = document.documentElement;
  const running: Animation[] = [];
  const stacked = window.matchMedia("(max-width: 959px)");

  const enter = (panel: HTMLElement) => {
    running.splice(0).forEach((a) => a.cancel());
    if (reducedMotion()) return;
    const card = panel.querySelector<HTMLElement>(".t-detail");
    if (!card) return;
    const ease =
      getComputedStyle(root).getPropertyValue("--ease-emphasized").trim() ||
      "ease-out";
    const from = stacked.matches
      ? "translateY(-0.6rem)"
      : "translateX(-1.25rem)";
    running.push(
      card.animate(
        [
          { transform: `${from} scale(0.985)`, opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        {
          duration: tokenMs("--duration-glass-unfold", 380, root),
          easing: ease,
          fill: "backwards",
        },
      ),
    );
  };

  const select = (key: string, focusTab = false, fromTap = false) => {
    const previous = current;
    current = key;
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === key;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      if (on && focusTab) tab.focus({ preventScroll: true });
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== key;
    });
    placeLens(previous !== "" && previous !== key);
    const panel = panels.find((p) => p.dataset.panel === key);
    if (!panel || !previous || previous === key) return;
    enter(panel);
    // Stacked (tablets, phones), the card sits under the list: a tap
    // brings its top into view if it is below the fold.
    if (fromTap && stacked.matches) {
      const top = panel.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.72) {
        panel.scrollIntoView({
          behavior: reducedMotion() ? "auto" : "smooth",
          block: "start",
        });
      }
    }
  };

  // The rows can change height (fonts, a resize); keep the lens under its
  // row.
  new ResizeObserver(() => placeLens(false)).observe(list);

  // WAI-ARIA tabs, vertical: Up and Down move (Left and Right too), Home
  // and End jump; the pick follows the focus.
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () =>
      select(tab.dataset.tab ?? "", false, true),
    );
    tab.addEventListener("keydown", (e) => {
      const last = tabs.length - 1;
      let to = -1;
      if (e.key === "ArrowDown" || e.key === "ArrowRight")
        to = i === last ? 0 : i + 1;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
        to = i === 0 ? last : i - 1;
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = last;
      if (to < 0) return;
      e.preventDefault();
      select(tabs[to]!.dataset.tab ?? "", true);
    });
  });

  const initial =
    tabs.find((t) => t.getAttribute("aria-selected") === "true")?.dataset.tab ??
    tabs[0]?.dataset.tab;
  if (initial) select(initial);

  // Show a ticket from elsewhere (a #included-<key> URL): pick its row,
  // bring the section into view below the fixed header, and move focus to
  // the row so keyboard users land where they asked to go.
  return (key: string) => {
    if (!tabs.some((t) => t.dataset.tab === key)) return;
    select(key);
    section.scrollIntoView({
      behavior: reducedMotion() ? "auto" : "smooth",
      block: "start",
    });
    tabs.find((t) => t.dataset.tab === key)?.focus({ preventScroll: true });
  };
}

/* ------------------------------------------------------------------ */
/* Compare: two pickers re-fill their column from the shared model.     */
/* ------------------------------------------------------------------ */

/*
 * One compare picker: a button that opens a listbox (WAI-ARIA select-only
 * pattern). It always opens downward; when the list would end below the
 * visible area the page first eases down just enough (never above the
 * fixed header). A second tap on the field, a tap outside, Escape or Tab
 * close it and keep the previous pick. Keyboard: Enter, Space, Arrow keys
 * open; Arrows, Home, End and a first letter move; Enter or Space pick.
 */
interface Picker {
  root: HTMLElement;
  value: () => string;
  setValue: (key: string) => void;
  setDisabled: (key: string) => void;
  close: (focusField?: boolean) => void;
  isOpen: () => boolean;
}

const openPickers = new Set<Picker>();

function createPicker(root: HTMLElement, onPick: () => void): Picker | null {
  const field = root.querySelector<HTMLButtonElement>("[data-picker-field]");
  const list = root.querySelector<HTMLElement>("[data-picker-list]");
  const label = root.querySelector<HTMLElement>("[data-picker-value]");
  if (!field || !list || !label) return null;
  const options = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
  let open = false;
  let active = -1;
  let hideTimer = 0;
  let typed = "";
  let typedTimer = 0;

  const enabled = (o: HTMLElement) =>
    o.getAttribute("aria-disabled") !== "true";
  const value = () => root.dataset.value ?? "";

  const setActive = (i: number) => {
    active = i;
    options.forEach((o, n) => o.classList.toggle("is-active", n === i));
    const o = options[i];
    if (o) {
      list.setAttribute("aria-activedescendant", o.id);
      o.scrollIntoView({ block: "nearest" });
    } else list.removeAttribute("aria-activedescendant");
  };

  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) {
      if (enabled(options[i])) return i;
    }
    return from;
  };

  // Bring field and list into view below the fixed header, gently.
  const reveal = () => {
    const header = document.getElementById("site-header");
    const top = (header?.getBoundingClientRect().bottom ?? 0) + 12;
    const view = window.visualViewport?.height ?? window.innerHeight;
    const fieldBox = field.getBoundingClientRect();
    const fieldTop = fieldBox.top;
    // Untransformed size: the list is still mid-unfold when this runs.
    const listBottom =
      fieldBox.bottom + list.offsetTop - field.offsetHeight + list.offsetHeight;
    const need = listBottom + 16 - view;
    if (need <= 0) return;
    // Never push the field itself under the header.
    const by = Math.min(need, Math.max(0, fieldTop - top));
    if (by > 0) {
      window.scrollBy({
        top: by,
        behavior: reducedMotion() ? "auto" : "smooth",
      });
    }
  };

  const show = () => {
    if (open || field.disabled) return;
    openPickers.forEach((p) => p !== picker && p.close());
    open = true;
    openPickers.add(picker);
    clearTimeout(hideTimer);
    list.hidden = false;
    root.classList.add("is-open");
    field.setAttribute("aria-expanded", "true");
    // Next frame so the closed state is painted and the open transition runs.
    void list.offsetHeight;
    list.dataset.state = "open";
    const selected = options.findIndex((o) => o.dataset.value === value());
    setActive(selected >= 0 ? selected : step(-1, 1));
    list.focus({ preventScroll: true });
    reveal();
  };

  const close = (focusField = false) => {
    if (!open) return;
    open = false;
    openPickers.delete(picker);
    root.classList.remove("is-open");
    field.setAttribute("aria-expanded", "false");
    list.dataset.state = "closed";
    list.removeAttribute("aria-activedescendant");
    // Hide only once the fold has played back into the field (the fade
    // sits in the second half of --duration-glass-fold).
    const ms = reducedMotion()
      ? 0
      : tokenMs("--duration-glass-fold", 220, list) + 40;
    hideTimer = window.setTimeout(() => {
      if (!open) list.hidden = true;
    }, ms);
    if (focusField) field.focus({ preventScroll: true });
  };

  const pick = (i: number) => {
    const o = options[i];
    if (!o || !enabled(o)) return;
    const changed = o.dataset.value !== value();
    picker.setValue(o.dataset.value ?? "");
    close(true);
    if (changed) onPick();
  };

  // Tap/click on the field toggles. pointerdown on the field must not count
  // as "outside" for the document listener below.
  field.addEventListener("click", () => (open ? close(true) : show()));
  field.addEventListener("keydown", (e) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      show();
      if (e.key === "ArrowUp") setActive(step(options.length, -1));
    }
  });

  list.addEventListener("click", (e) => {
    const o = (e.target as Element).closest<HTMLElement>('[role="option"]');
    if (o) pick(options.indexOf(o));
  });
  list.addEventListener("pointermove", (e) => {
    const o = (e.target as Element).closest<HTMLElement>('[role="option"]');
    if (o && enabled(o)) setActive(options.indexOf(o));
  });
  list.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowDown":
        setActive(step(active, 1));
        break;
      case "ArrowUp":
        setActive(step(active, -1));
        break;
      case "Home":
        setActive(step(-1, 1));
        break;
      case "End":
        setActive(step(options.length, -1));
        break;
      case "Enter":
      case " ":
        pick(active);
        break;
      case "Escape":
        close(true);
        break;
      case "Tab":
        close();
        return; // let focus move on
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          clearTimeout(typedTimer);
          typed += e.key.toLowerCase();
          typedTimer = window.setTimeout(() => (typed = ""), 600);
          const hit = options.findIndex(
            (o) =>
              enabled(o) &&
              (o.textContent ?? "").trim().toLowerCase().startsWith(typed),
          );
          if (hit >= 0) setActive(hit);
          break;
        }
        return;
    }
    e.preventDefault();
  });
  // Focus leaving the picker (e.g. a screen reader moving on) closes it.
  root.addEventListener("focusout", (e) => {
    if (open && !root.contains(e.relatedTarget as Node | null)) close();
  });

  const picker: Picker = {
    root,
    value,
    isOpen: () => open,
    close,
    setValue: (key) => {
      root.dataset.value = key;
      options.forEach((o) =>
        o.setAttribute(
          "aria-selected",
          o.dataset.value === key ? "true" : "false",
        ),
      );
      const o = options.find((x) => x.dataset.value === key);
      label.textContent = o?.textContent?.trim() ?? key;
    },
    setDisabled: (key) =>
      options.forEach((o) =>
        o.dataset.value === key
          ? o.setAttribute("aria-disabled", "true")
          : o.removeAttribute("aria-disabled"),
      ),
  };
  field.disabled = false;
  return picker;
}

// A tap or click anywhere outside an open picker closes it (no pick).
document.addEventListener(
  "pointerdown",
  (e) => {
    openPickers.forEach((p) => {
      if (!p.root.contains(e.target as Node)) p.close();
    });
  },
  { capture: true },
);

function initCompare(section: HTMLElement): void {
  const raw = section.querySelector("[data-ticket-data]")?.textContent;
  if (!raw) return;
  const data = JSON.parse(raw) as TicketClientData;
  const roots = [0, 1].map((col) =>
    section.querySelector<HTMLElement>(`[data-picker="${col}"]`),
  );
  if (!roots[0] || !roots[1]) return;
  const made: (Picker | null)[] = [];
  roots.forEach((root, col) =>
    made.push(
      createPicker(root as HTMLElement, () => {
        lockOptions();
        fill(col);
      }),
    ),
  );
  if (!made[0] || !made[1]) return;
  const pickers = made as [Picker, Picker];

  const replay = (el: Element | null) => {
    if (!el || reducedMotion()) return;
    el.classList.remove("is-swapping");
    void (el as HTMLElement).offsetWidth; // restart the fade
    el.classList.add("is-swapping");
  };

  const fill = (col: number) => {
    const ticket = data.tickets.find((t) => t.key === pickers[col].value());
    if (!ticket) return;

    const box = section.querySelector<HTMLElement>(`[data-swap="${col}"]`);
    const set = (field: string, text: string) => {
      const el = box?.querySelector<HTMLElement>(`[data-f="${field}"]`);
      if (el) el.textContent = text;
    };
    set("price", euro(ticket.price));
    set("regular", euro(ticket.regularPrice));
    // No struck regular price while the ticket is not discounted.
    const regular = box?.querySelector<HTMLElement>('[data-f="regular-wrap"]');
    if (regular) regular.hidden = !isDiscounted(ticket);
    // Like prices, names and every status cell, the description changes
    // at once.
    set("description", ticket.description);
    set("buy-name", `: ${ticket.name}`);
    const buy = box?.querySelector<HTMLAnchorElement>('[data-f="buy"]');
    if (buy) {
      buy.href = data.purchaseHref;
      buy.dataset.phPropTierName = ticket.name;
      buy.dataset.phPropTierPrice = euro(ticket.price);
    }
    replay(box);

    const name = section.querySelector<HTMLElement>(
      `.t-cmp-name-cell[data-col="${col}"]`,
    );
    if (name) {
      name.textContent = ticket.name;
      replay(name);
    }

    data.groups.forEach((group, gi) => {
      group.rows.forEach((row, ri) => {
        const cell = section.querySelector<HTMLElement>(
          `[data-cell="${gi}.${ri}"][data-col="${col}"]`,
        );
        const mark = cell?.querySelector<HTMLElement>("[data-status]");
        const label = cell?.querySelector<HTMLElement>("[data-status-label]");
        if (!cell || !mark || !label) return;
        const status = statusOf(group, row, ticket.key);
        mark.dataset.positive = isPositive(status) ? "true" : "false";
        label.textContent = statusLabel(status, data.labels);
        replay(cell);
      });
    });
  };

  // A ticket already shown in one column cannot be picked in the other.
  function lockOptions() {
    pickers.forEach((picker, col) =>
      picker.setDisabled(pickers[1 - col].value()),
    );
  }

  lockOptions();
}

/* ------------------------------------------------------------------ */
/* Motion: pause what is off screen.                                    */
/* ------------------------------------------------------------------ */

function initAmbientPause(): void {
  if (!("IntersectionObserver" in window)) return;
  const motion = [
    ...document.querySelectorAll<HTMLElement>("[data-ticket-motion]"),
  ];

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      (entry.target as HTMLElement).toggleAttribute(
        "data-ticket-still",
        !entry.isIntersecting,
      );
    }
  });
  motion.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ */

export function initTicketPage(): void {
  const page = document.querySelector<HTMLElement>("[data-ticket-page]");
  if (!page || page.hasAttribute("data-ticket-ready")) return;
  page.setAttribute("data-ticket-ready", "");

  initPress(document.body);

  const included = page.querySelector<HTMLElement>("[data-ticket-included]");
  const show = included ? initTabs(included) : () => {};

  // Arriving with #included-<key> in the URL opens that ticket's card.
  const fromHash = location.hash.match(/^#included-([\w-]+)$/)?.[1];
  if (fromHash) show(fromHash);

  const compare = page.querySelector<HTMLElement>("[data-ticket-compare]");
  if (compare) initCompare(compare);

  initAmbientPause();
}
