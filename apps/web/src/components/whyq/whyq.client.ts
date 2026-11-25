/**
 * Behavior of the Why Q audience pages (DESIGN.md WHYQ-1), after the
 * homepage's (home/home-stage.client.ts, home.client.ts). Every page is
 * complete without it; this adds:
 *
 *   hero      the hero's parts rise in once
 *   reveals   [data-h-reveal] rises in early and once; anything already
 *             scrolled past is shown at once (the homepage's rule)
 *   counters  the key figures count up once, fast, from a quarter visible
 *   rows      the activity rows get arrows on their sides to page them
 *             and fade at an edge while more cards lie beyond it
 *   photos    a photo that fails to load is hidden, so the blue to white
 *             wash behind it shows
 *
 * No animation library: the counters run on requestAnimationFrame
 * (MOTION-4); reduced motion shows everything at once.
 */

const reduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initHero(): void {
  document.querySelector(".wq-hero")?.classList.add("is-in");
}

function initReveals(): void {
  const all = [...document.querySelectorAll<HTMLElement>("[data-h-reveal]")];
  if (reduced() || !("IntersectionObserver" in window)) {
    all.forEach((el) => el.classList.add("is-in", "is-instant"));
    return;
  }
  // Cards in a sideways row rise in with their row, one after another
  // (their --h-i), not when each is scrolled into view sideways: a card
  // the row hides would otherwise wait for its failsafe, then blink when
  // it is reached.
  const rows = [
    ...document.querySelectorAll<HTMLElement>("[data-wq-scroller]"),
  ];
  const inRow = (el: HTMLElement) => rows.some((row) => row.contains(el));
  const items = [...all.filter((el) => !inRow(el)), ...rows];
  const reveal = (el: HTMLElement, instant: boolean) => {
    const targets = rows.includes(el)
      ? [...el.querySelectorAll<HTMLElement>("[data-h-reveal]")]
      : [el];
    targets.forEach((t) => {
      if (instant) t.classList.add("is-instant");
      t.classList.add("is-in");
    });
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const passed = entry.boundingClientRect.bottom < 0;
        if (entry.isIntersecting || passed) {
          reveal(el, passed);
          io.unobserve(el);
        }
      }
    },
    { rootMargin: "0px 0px 6% 0px" },
  );
  items.forEach((el) => io.observe(el));
}

function initCounters(): void {
  const figures = [
    ...document.querySelectorAll<HTMLElement>("[data-count-to]"),
  ];
  if (reduced() || figures.length === 0 || !("IntersectionObserver" in window))
    return;
  const fmt = new Intl.NumberFormat("en-US");
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        const end = Number(el.dataset.countTo);
        if (!Number.isFinite(end) || end <= 0) continue;
        const duration = Math.min(1000, 550 + end / 4);
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // power2.out, as the homepage's counters
          const eased = 1 - (1 - t) * (1 - t);
          el.textContent = fmt.format(Math.round(end * eased));
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    },
    { threshold: 0.25 },
  );
  figures.forEach((el) => {
    // A figure already on screen when the page loads stays put.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;
    io.observe(el);
  });
}

/** The activity rows: arrows that page them, and the fade at the edge. */
function initRows(): void {
  document
    .querySelectorAll<HTMLElement>("[data-wq-scroller]")
    .forEach((row) => {
      const section = row.closest("section");
      // The arrows on the row's sides (AudienceActivities .wq-arrow).
      const buttons = [
        ...(row.parentElement?.querySelectorAll<HTMLButtonElement>(
          "[data-wq-scroll]",
        ) ?? []),
      ];
      const update = () => {
        const max = row.scrollWidth - row.clientWidth;
        const overflows = max > 4;
        row.classList.toggle("has-more", row.scrollLeft < max - 4);
        row.classList.toggle("has-before", row.scrollLeft > 4);
        buttons.forEach((button) => {
          const dir = Number(button.dataset.wqScroll);
          button.hidden = !overflows;
          button.disabled =
            dir < 0 ? row.scrollLeft <= 4 : row.scrollLeft >= max - 4;
        });
      };
      buttons.forEach((button) =>
        button.addEventListener("click", () => {
          // One card and its gap: the first card the filter leaves shown.
          const card = [...row.querySelectorAll<HTMLElement>("li")].find(
            (li) => li.offsetWidth > 0,
          );
          const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
          const step = (card?.offsetWidth ?? row.clientWidth) + gap;
          row.scrollBy({
            left: Number(button.dataset.wqScroll) * step,
            behavior: reduced() ? "auto" : "smooth",
          });
        }),
      );
      row.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      section?.querySelectorAll("input[type=radio]").forEach((radio) =>
        radio.addEventListener("change", () => {
          row.scrollTo({ left: 0 });
          update();
        }),
      );
      update();
    });
}

function initPhotoFallback(): void {
  document
    .querySelectorAll<HTMLImageElement>("img[data-wq-img]")
    .forEach((img) => {
      const hide = () => {
        img.hidden = true;
        img.closest(".has-photo")?.classList.remove("has-photo");
      };
      img.addEventListener("error", hide, { once: true });
      if (img.complete && img.naturalWidth === 0) hide();
    });
}

export function initWhyq(): void {
  initHero();
  initReveals();
  initCounters();
  initRows();
  initPhotoFallback();
}
