// Behavior for the 2027 ticket page (DESIGN.md TICKETS-1). Everything here
// is an enhancement of complete static HTML: without this script the cards
// still swipe (native scroll-snap), every "What's included" panel is shown,
// the compare view shows its default pair and every buy link works.
import {
  euro,
  isPositive,
  statusLabel,
  statusOf,
  type TicketClientData,
} from "./ticket-model";
import { typeWords } from "../../lib/motion/typewriter";

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
/* Carousel: one card at rest on phones; grid (no carousel) when wide.  */
/* ------------------------------------------------------------------ */

/*
 * The count, the dots and the card always agree:
 *   - Arrows, dots and keys set a target. The display jumps to it at once
 *     and holds it while the smooth scroll travels there, so a scroll frame
 *     that still has the old card nearest can never pull it back.
 *   - A swipe moves the display only forward in the direction the track is
 *     moving, and only once the next card is clearly closer (hysteresis),
 *     so a finger hovering near the midpoint or a quick reversal cannot
 *     make it flicker 3-4-3.
 *   - When the track comes to rest (scrollend, or a short quiet period
 *     where scrollend is missing) the display is set to the card that is
 *     actually centered, whatever happened on the way.
 * Heavy work (inert, pausing the light of off-screen cards) runs only at
 * rest, never per scroll frame.
 */
function initCarousel(root: HTMLElement): void {
  const track = root.querySelector<HTMLElement>("[data-track]");
  const controls = root.querySelector<HTMLElement>("[data-controls]");
  if (!track || !controls) return;
  const slides = [...track.querySelectorAll<HTMLElement>("[data-slide]")];
  const dots = [...controls.querySelectorAll<HTMLButtonElement>("[data-dot]")];
  const prev = controls.querySelector<HTMLButtonElement>("[data-prev]");
  const next = controls.querySelector<HTMLButtonElement>("[data-next]");
  const current = controls.querySelector<HTMLElement>("[data-current]");
  controls.hidden = false;

  // Shown index (count + dots) and the index the track has settled on.
  let shown = 0;
  let settled = 0;
  // Set while an arrow, dot or key scroll is on its way.
  let target: number | null = null;
  let lastLeft = track.scrollLeft;
  const isCarousel = () => track.scrollWidth > track.clientWidth + 1;

  const show = (i: number) => {
    if (i === shown && current?.textContent === String(i + 1)) return;
    shown = i;
    dots.forEach((dot, d) =>
      d === i
        ? dot.setAttribute("aria-current", "true")
        : dot.removeAttribute("aria-current"),
    );
    if (current) current.textContent = String(i + 1);
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === slides.length - 1;
  };

  // At rest: only the centered card is reachable and lit. The others keep
  // nothing focusable (buy links, All benefits) and hold their light still,
  // which frees the GPU for the one card on screen.
  const settle = (i: number) => {
    settled = i;
    const carousel = isCarousel();
    slides.forEach((slide, s) => {
      const off = carousel && s !== i;
      slide.inert = off;
      slide.toggleAttribute("data-ticket-still", off);
    });
    show(i);
  };

  const centerOf = (i: number) =>
    slides[i].offsetLeft + slides[i].offsetWidth / 2;
  const viewCenter = () => track.scrollLeft + track.clientWidth / 2;

  const nearest = (): number => {
    const center = viewCenter();
    let best = 0;
    let bestDistance = Infinity;
    slides.forEach((_, i) => {
      const distance = Math.abs(centerOf(i) - center);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    return best;
  };

  let frame = 0;
  let quiet = 0;
  const onRest = () => {
    clearTimeout(quiet);
    const i = nearest();
    // A programmatic scroll is done once it reaches its card.
    if (target !== null && i === target) target = null;
    if (target === null) settle(i);
  };

  track.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const left = track.scrollLeft;
        const direction = Math.sign(left - lastLeft);
        lastLeft = left;
        if (target === null && direction !== 0) {
          // The neighbor in the direction of travel takes over once its
          // center is within 40% of a card width of the view's center.
          const ahead = shown + direction;
          if (ahead >= 0 && ahead < slides.length) {
            const reach = slides[ahead].offsetWidth * 0.4;
            if (Math.abs(centerOf(ahead) - viewCenter()) < reach) show(ahead);
          }
        }
      });
      // Fallback for browsers without scrollend.
      clearTimeout(quiet);
      quiet = window.setTimeout(onRest, 140);
    },
    { passive: true },
  );
  track.addEventListener("scrollend", onRest);

  // A new touch takes over from any arrow or dot scroll still running.
  track.addEventListener(
    "pointerdown",
    () => {
      target = null;
    },
    { passive: true },
  );

  const go = (i: number) => {
    const index = Math.max(0, Math.min(slides.length - 1, i));
    const slide = slides[index];
    const left = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
    show(index);
    if (Math.abs(track.scrollLeft - left) < 1) {
      target = null;
      settle(index);
      return;
    }
    target = index;
    // The card being scrolled to must not be inert when it arrives, and
    // its light starts as it slides in.
    slide.inert = false;
    slide.removeAttribute("data-ticket-still");
    track.scrollTo({
      left,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  };

  // Arrows step from what is shown, so quick repeated taps queue up
  // (2 -> 3 -> 4) instead of restarting from the card still sliding away.
  prev?.addEventListener("click", () => go(shown - 1));
  next?.addEventListener("click", () => go(shown + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => go(i)));

  // Arrow keys move between tickets while focus is inside the carousel.
  root.addEventListener("keydown", (e) => {
    if (!isCarousel()) return;
    if ((e.target as Element).closest("select, input, textarea")) return;
    if (e.key === "ArrowRight") go(shown + 1);
    else if (e.key === "ArrowLeft") go(shown - 1);
    else return;
    e.preventDefault();
  });

  // Crossing the 900px breakpoint switches carousel <-> grid; in the grid
  // every card is reachable and lit.
  new ResizeObserver(() => settle(target ?? settled)).observe(track);
  settle(nearest());
}

/* ------------------------------------------------------------------ */
/* What's included: tabs, plus "All benefits" links that pick a tab.   */
/* ------------------------------------------------------------------ */

function initTabs(section: HTMLElement): (key: string) => void {
  const list = section.querySelector<HTMLElement>("[data-tablist]");
  if (!list) return () => {};
  const tabs = [...list.querySelectorAll<HTMLButtonElement>("[data-tab]")];
  const panels = [...section.querySelectorAll<HTMLElement>("[data-panel]")];
  const lens = list.querySelector<HTMLElement>("[data-tab-lens]");
  list.hidden = false;
  section.setAttribute("data-tabs-ready", "");

  // Restart a CSS animation by toggling its class across a reflow.
  const replay = (el: Element, cls: string) => {
    el.classList.remove(cls);
    void (el as HTMLElement).offsetWidth;
    el.classList.add(cls);
  };

  // The glass lens sits under the picked tab. Its size snaps; its position
  // glides (CSS transition on translate) and it stretches while moving.
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
    if (animate && !reducedMotion()) replay(lens, "is-moving");
  };

  // The benefit meter slides from the last ticket's share to the new one.
  const fillOf = (key: string) =>
    section
      .querySelector<HTMLElement>(`[data-panel="${key}"] [data-meter]`)
      ?.style.getPropertyValue("--fill") ?? "0";
  const runMeter = (key: string, from: string) => {
    const meter = section.querySelector<HTMLElement>(
      `[data-panel="${key}"] [data-meter]`,
    );
    if (!meter || reducedMotion()) return;
    meter.style.setProperty("--from", from);
    replay(meter, "is-filling");
  };

  /*
   * The new ticket's panel unfolds out of the tab just picked (MOTION-6):
   * the summary card and, a beat later, the benefit sheet start squeezed
   * into the tab's box and spring open from it; a light runs across the
   * summary; the summary's contents follow a few frames apart (they are
   * invisible while squeezed, so no text is ever seen distorted) and its
   * description writes itself in. Web Animations, so a quick next pick
   * cancels whatever is still running and starts from the new tab.
   */
  const root = document.documentElement;
  const cssMs = (name: string, fallback: number) =>
    parseFloat(getComputedStyle(root).getPropertyValue(name)) || fallback;
  const running: Animation[] = [];

  const unfold = (tab: HTMLElement, panel: HTMLElement) => {
    running.splice(0).forEach((a) => a.cancel());
    panels.forEach((p) => p.removeAttribute("data-unfold"));
    if (reducedMotion()) return;
    panel.setAttribute("data-unfold", "");
    const unfoldMs = cssMs("--duration-glass-unfold", 380);
    const stagger = cssMs("--duration-glass-stagger", 28);
    const ease = (name: string) =>
      getComputedStyle(root).getPropertyValue(name).trim() || "ease-out";
    const spring = ease("--ease-glass-spring");
    const emphasized = ease("--ease-emphasized");
    const t = tab.getBoundingClientRect();
    const parts = [
      panel.querySelector<HTMLElement>(".t-summary"),
      panel.querySelector<HTMLElement>(".t-benefits"),
    ];
    parts.forEach((el, n) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      // The card grows out of the tab; the sheet then unrolls in its own
      // place from its top edge (it never travels over the card).
      const from =
        n === 0
          ? `translate(${t.left + t.width / 2 - (r.left + r.width / 2)}px, ${
              t.top + t.height / 2 - r.top
            }px) scale(${Math.max(0.2, Math.min(1, t.width / r.width))}, ${Math.max(
              0.05,
              Math.min(1, t.height / r.height),
            )})`
          : "translateY(-0.5rem) scale(0.98, 0.08)";
      running.push(
        el.animate(
          [
            { transform: from, opacity: 0 },
            { opacity: 1, offset: 0.2 },
            { transform: "none", opacity: 1 },
          ],
          {
            duration: unfoldMs,
            delay: n * unfoldMs * 0.35,
            easing: spring,
            fill: "backwards",
          },
        ),
      );
      el.style.transformOrigin = "50% 0";
    });

    const summary = parts[0];
    if (!summary) return;
    // Contents come in once the card has mostly opened.
    [...summary.children]
      .filter((c) => !c.classList.contains("t-liquid"))
      .forEach((child, i) =>
        running.push(
          child.animate(
            [
              { opacity: 0, transform: "translateY(0.4rem)" },
              { opacity: 1, transform: "none" },
            ],
            {
              duration: unfoldMs * 0.7,
              delay: unfoldMs * 0.45 + i * stagger,
              easing: emphasized,
              fill: "backwards",
            },
          ),
        ),
      );
    // The light runs in from the side of the tab.
    const light = summary.querySelector<HTMLElement>("[data-unfold-light]");
    if (light) {
      const s = summary.getBoundingClientRect();
      light.style.setProperty(
        "--press-x",
        `${Math.max(0, Math.min(100, ((t.left + t.width / 2 - s.left) / s.width) * 100))}%`,
      );
      light.style.setProperty("--press-y", "0%");
      light.classList.remove("is-lit");
      void light.offsetWidth;
      light.classList.add("is-lit");
    }
    const desc = summary.querySelector<HTMLElement>(".t-summary-desc");
    const text = descriptions.get(panel.dataset.panel ?? "");
    if (desc && text) typeWords(desc, text, { delay: unfoldMs * 0.55 });
  };

  // Each summary's description as authored, read once before any typing.
  const descriptions = new Map(
    panels.map((p) => [
      p.dataset.panel ?? "",
      p.querySelector(".t-summary-desc")?.textContent?.trim() ?? "",
    ]),
  );

  const select = (key: string, focusTab = false) => {
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
    if (previous && previous !== key) {
      runMeter(key, fillOf(previous));
      const tab = tabs.find((t) => t.dataset.tab === key);
      const panel = panels.find((p) => p.dataset.panel === key);
      if (tab && panel) unfold(tab, panel);
    }
  };

  // Tabs can wrap onto a second row; keep the lens under its tab.
  new ResizeObserver(() => placeLens(false)).observe(list);

  // The first time the section comes into view, the meter fills from zero.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      runMeter(current, "0");
    });
    io.observe(section);
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab.dataset.tab ?? ""));
    tab.addEventListener("keydown", (e) => {
      const last = tabs.length - 1;
      let to = -1;
      if (e.key === "ArrowRight") to = i === last ? 0 : i + 1;
      else if (e.key === "ArrowLeft") to = i === 0 ? last : i - 1;
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = last;
      if (to < 0) return;
      e.preventDefault();
      select(tabs[to].dataset.tab ?? "", true);
    });
  });

  const initial =
    tabs.find((t) => t.getAttribute("aria-selected") === "true")?.dataset.tab ??
    tabs[0]?.dataset.tab;
  if (initial) select(initial);

  // Show a ticket from elsewhere (card links, a #included-<key> URL):
  // pick its tab, bring the section into view below the fixed header, and
  // move focus to the tab so keyboard users land where they asked to go.
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
      : (parseFloat(
          getComputedStyle(list).getPropertyValue("--duration-glass-fold"),
        ) || 220) + 40;
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
    // The one line that writes itself in (MOTION-6); prices, names and
    // every status cell change at once.
    const desc = box?.querySelector<HTMLElement>('[data-f="description"]');
    if (desc) typeWords(desc, ticket.description, { delay: 60 });
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
/* Ambient light: pause what is off screen.                             */
/* ------------------------------------------------------------------ */

function initAmbientPause(): void {
  if (!("IntersectionObserver" in window)) return;
  const ground = document.querySelector<HTMLElement>("[data-ticket-ground]");
  const motion = [
    ...document.querySelectorAll<HTMLElement>("[data-ticket-motion]"),
  ];
  const lit = [
    ...document.querySelectorAll<HTMLElement>(
      ".t-hero, .t-cards, [data-ticket-included], [data-ticket-compare]",
    ),
  ];
  const visible = new Set<Element>();

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
      if (motion.includes(entry.target as HTMLElement)) {
        (entry.target as HTMLElement).toggleAttribute(
          "data-ticket-still",
          !entry.isIntersecting,
        );
      }
    }
    // The fixed ground shows through every ticket section (the compare
    // sheet is glass too), never behind the footer.
    ground?.toggleAttribute(
      "data-ticket-still",
      !lit.some((el) => visible.has(el)),
    );
  });
  [...motion, ...lit].forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ */

export function initTicketPage(): void {
  const page = document.querySelector<HTMLElement>("[data-ticket-page]");
  if (!page || page.hasAttribute("data-ticket-ready")) return;
  page.setAttribute("data-ticket-ready", "");

  initPress(document.body);
  page
    .querySelectorAll<HTMLElement>("[data-ticket-carousel]")
    .forEach(initCarousel);

  const included = page.querySelector<HTMLElement>("[data-ticket-included]");
  const show = included ? initTabs(included) : () => {};

  // "All benefits" on a card: select that ticket's tab instead of
  // jumping to a panel that is hidden now that tabs are on.
  page.addEventListener("click", (e) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>(
      "[data-show-ticket]",
    );
    if (!link || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const key = link.dataset.showTicket ?? "";
    show(key);
    history.replaceState(null, "", `#included-${key}`);
  });

  // Arriving with #included-<key> in the URL opens that ticket's tab.
  const fromHash = location.hash.match(/^#included-([\w-]+)$/)?.[1];
  if (fromHash) show(fromHash);

  const compare = page.querySelector<HTMLElement>("[data-ticket-compare]");
  if (compare) initCompare(compare);

  initAmbientPause();
}
