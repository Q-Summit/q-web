/** Home previous-speakers carousel progressive enhancement (infinite loop + dots). */
function setUpSpeakerCarousel(root: HTMLElement) {
  const list = root.querySelector<HTMLDivElement>(".speakers-list");
  const dots = Array.from(
    root.querySelectorAll<HTMLButtonElement>(".speakers-dot"),
  );
  const navButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>(".speakers-nav"),
  );
  if (!list) return;

  const realCards = Array.from(
    list.querySelectorAll<HTMLDivElement>(".speaker-card"),
  );
  const n = realCards.length;
  if (n < 2) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // --- Clone the full set once before and once after the real slides. ---
  function makeClone(card: HTMLDivElement): HTMLDivElement {
    const clone = card.cloneNode(true) as HTMLDivElement;
    clone.removeAttribute("id");
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("inert", "");
    clone.inert = true;
    clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    return clone;
  }
  const before = realCards.map(makeClone);
  const after = realCards.map(makeClone);
  list.prepend(...before);
  list.append(...after);

  // Absolute layout of every slide (real + clones): [0,n)=head clones,
  // [n,2n)=real, [2n,3n)=tail clones. Recomputed on resize. Seam jumps use
  // `jumpTo(n + realIndex())` (index math), not a pixel delta.
  let centres: number[] = [];
  let step = 0;

  function measure() {
    const all = Array.from(
      list!.querySelectorAll<HTMLDivElement>(".speaker-card"),
    );
    centres = all.map((c) => c.offsetLeft + c.offsetWidth / 2);
    step =
      all.length > 1
        ? all[1].offsetLeft - all[0].offsetLeft
        : all[0].offsetWidth;
  }

  function nearestIndex(): number {
    const centerPos = list!.scrollLeft + list!.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < centres.length; i++) {
      const d = Math.abs(centres[i] - centerPos);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  // Instant (non-animated) scroll to a slide, regardless of the CSS smooth
  // default; used for the invisible seam jump onto a pixel-identical clone.
  function jumpTo(absIndex: number) {
    list!.style.scrollBehavior = "auto";
    list!.scrollLeft = centres[absIndex] - list!.clientWidth / 2;
    void list!.offsetWidth; // flush before restoring
    list!.style.scrollBehavior = "";
  }

  function go(dir: number) {
    list!.scrollBy({
      left: dir * step,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function realIndex(): number {
    return ((nearestIndex() % n) + n) % n;
  }

  function updateActive() {
    const real = realIndex();
    dots.forEach((dot, i) => {
      dot.setAttribute("aria-current", i === real ? "true" : "false");
    });
  }

  // Seam recentre: whenever the row comes to rest on a clone (outside the
  // middle real set), teleport instantly onto the identical middle-set slide
  // so the resting position is always the middle set and neither physical
  // edge can ever be reached (no dead end mid-loop). Absolute so drift can
  // never accumulate. Gated so it never runs mid-gesture (a finger on the
  // glass or a mouse drag in progress): a teleport then would yank the fling.
  let touchActive = false;
  let dragging = false;
  function recentre() {
    if (touchActive || dragging) return;
    const idx = nearestIndex();
    if (idx >= n && idx < 2 * n) return; // already in the middle set
    jumpTo(n + realIndex());
    updateActive();
  }

  // "Idle" = scroll events have stopped. scrollend is the precise signal but
  // does not fire after every momentum settle on every engine, so a debounced
  // timer is the reliable primary trigger and scrollend an earlier hint.
  let idle: number | undefined;
  function armIdle() {
    window.clearTimeout(idle);
    idle = window.setTimeout(recentre, 120);
  }
  if ("onscrollend" in window) list.addEventListener("scrollend", recentre);

  // Controls.
  navButtons.forEach((button) => {
    button.addEventListener("click", () => go(Number(button.dataset.dir) || 0));
  });
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const i = Number(dot.dataset.index) || 0;
      list!.scrollTo({
        left: centres[n + i] - list!.clientWidth / 2,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  });
  list.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
  });

  // Dot sync (rAF-throttled) + idle re-arm on every scroll tick.
  let ticking = false;
  list.addEventListener(
    "scroll",
    () => {
      armIdle();
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateActive();
        ticking = false;
      });
    },
    { passive: true },
  );

  // Touch gate: touchstart/end bracket a native pan reliably (a scrolling
  // touch reports pointercancel rather than pointerup, so pointer events are
  // not trustworthy here). Releasing arms an idle check for the settle.
  list.addEventListener(
    "touchstart",
    () => {
      touchActive = true;
    },
    { passive: true },
  );
  const endTouch = () => {
    touchActive = false;
    armIdle();
  };
  list.addEventListener("touchend", endTouch, { passive: true });
  list.addEventListener("touchcancel", endTouch, { passive: true });

  // Desktop drag-to-scroll (fine pointers, primary button only; touch already
  // pans natively). Plain mouse events, not pointer events: a scrollable
  // element cancels a pointer to start its own pan, so pointermove never
  // arrives, whereas mouse events keep flowing. move/up bind to window so a
  // drag continues past the edges. A movement threshold keeps a plain click
  // intact; past it the closing click is swallowed so a drag never navigates
  // a card link. Snap is suspended (.is-dragging) for 1:1 tracking.
  if (window.matchMedia("(pointer: fine)").matches) {
    let startX = 0;
    let startLeft = 0;
    let down = false;
    list.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      down = true;
      dragging = false;
      startX = event.clientX;
      startLeft = list!.scrollLeft;
    });
    window.addEventListener("mousemove", (event) => {
      if (!down) return;
      const dx = event.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) < 6) return; // below threshold: leave clicks intact
        dragging = true;
        list!.classList.add("is-dragging");
      }
      list!.scrollLeft = startLeft - dx;
      event.preventDefault();
    });
    window.addEventListener("mouseup", () => {
      if (!down) return;
      down = false;
      if (!dragging) return;
      dragging = false;
      list!.classList.remove("is-dragging");
      // Snap back on (class removed), then a smooth scroll settles onto the
      // nearest card; the seam recentre follows once idle.
      list!.scrollTo({
        left: centres[nearestIndex()] - list!.clientWidth / 2,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      list!.addEventListener(
        "click",
        (click) => {
          click.preventDefault();
          click.stopPropagation();
        },
        { capture: true, once: true },
      );
      armIdle();
    });
  }

  // Resize: recompute layout, keep the current real slide centred.
  let resizeTimer: number | undefined;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const real = realIndex();
      measure();
      jumpTo(n + real);
      updateActive();
    }, 150);
  });

  // Init: enable controls, measure, centre the first real slide.
  root.setAttribute("data-js", "true");
  measure();
  jumpTo(n);
  updateActive();
}

export function initSpeakerCarousels(): void {
  // The VRT gallery marks <html data-vrt>; skip the carousel enhancement there
  // so the screenshot captures the deterministic SSR layout. The live carousel
  // does an idle recentre onto a viewport-dependent resting slide, which would
  // otherwise vary the baseline between runs and breakpoints.
  if (document.documentElement.hasAttribute("data-vrt")) return;
  document
    .querySelectorAll<HTMLElement>(".speakers-carousel")
    .forEach(setUpSpeakerCarousel);
}
