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

  let active = 0;
  const isCarousel = () => track.scrollWidth > track.clientWidth + 1;

  const render = () => {
    const carousel = isCarousel();
    slides.forEach((slide, i) => {
      // Hidden slides keep nothing focusable (buy links, All benefits).
      slide.inert = carousel && i !== active;
    });
    dots.forEach((dot, i) =>
      i === active
        ? dot.setAttribute("aria-current", "true")
        : dot.removeAttribute("aria-current"),
    );
    if (current) current.textContent = String(active + 1);
    if (prev) prev.disabled = active === 0;
    if (next) next.disabled = active === slides.length - 1;
  };

  // The slide whose center is closest to the track's center is active.
  const nearest = (): number => {
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    slides.forEach((slide, i) => {
      const mid = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(mid - center);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    return best;
  };

  let frame = 0;
  track.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const i = nearest();
        if (i !== active) {
          active = i;
          render();
        }
      });
    },
    { passive: true },
  );

  const go = (i: number) => {
    const index = Math.max(0, Math.min(slides.length - 1, i));
    const slide = slides[index];
    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      behavior: reducedMotion() ? "auto" : "smooth",
    });
    active = index;
    render();
  };

  prev?.addEventListener("click", () => go(active - 1));
  next?.addEventListener("click", () => go(active + 1));
  dots.forEach((dot, i) => dot.addEventListener("click", () => go(i)));

  // Arrow keys move between tickets while focus is inside the carousel.
  root.addEventListener("keydown", (e) => {
    if (!isCarousel()) return;
    if ((e.target as Element).closest("select, input, textarea")) return;
    if (e.key === "ArrowRight") go(active + 1);
    else if (e.key === "ArrowLeft") go(active - 1);
    else return;
    e.preventDefault();
  });

  // Crossing the 900px breakpoint switches carousel <-> grid.
  new ResizeObserver(() => render()).observe(track);
  render();
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
    if (previous && previous !== key) runMeter(key, fillOf(previous));
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

function initCompare(section: HTMLElement): void {
  const raw = section.querySelector("[data-ticket-data]")?.textContent;
  if (!raw) return;
  const data = JSON.parse(raw) as TicketClientData;
  const selects = [0, 1].map((col) =>
    section.querySelector<HTMLSelectElement>(`[data-select="${col}"]`),
  );
  if (!selects[0] || !selects[1]) return;
  const pickers = selects as [HTMLSelectElement, HTMLSelectElement];

  const replay = (el: Element | null) => {
    if (!el || reducedMotion()) return;
    el.classList.remove("is-swapping");
    void (el as HTMLElement).offsetWidth; // restart the fade
    el.classList.add("is-swapping");
  };

  const fill = (col: number) => {
    const ticket = data.tickets.find((t) => t.key === pickers[col].value);
    if (!ticket) return;

    const box = section.querySelector<HTMLElement>(`[data-swap="${col}"]`);
    const set = (field: string, text: string) => {
      const el = box?.querySelector<HTMLElement>(`[data-f="${field}"]`);
      if (el) el.textContent = text;
    };
    set("price", euro(ticket.price));
    set("regular", euro(ticket.regularPrice));
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
  const lockOptions = () => {
    pickers.forEach((picker, col) => {
      const other = pickers[1 - col].value;
      [...picker.options].forEach((option) => {
        option.disabled = option.value === other;
      });
    });
  };

  pickers.forEach((picker, col) => {
    picker.disabled = false;
    picker.addEventListener("change", () => {
      lockOptions();
      fill(col);
    });
  });
  lockOptions();
  // Restore what a back/forward navigation or a form autofill left behind.
  fill(0);
  fill(1);
  section
    .querySelectorAll(".is-swapping")
    .forEach((el) => el.classList.remove("is-swapping"));
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
