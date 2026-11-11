/**
 * Home page behavior (DESIGN.md HOME-1). Every part is an enhancement: the
 * page is complete without it.
 *
 *   reveal    content below the fold sharpens out of a blur, once
 *   thumbs    partner logos are swapped for copies at their drawn size
 *   video     the hero video rests while the hero is off screen
 *   count-up  the key figures count up once, the first time they are seen
 *   marquee   the partner strips stop off screen and with the Pause button
 *   ambient   the page light rests while the hero video covers it
 *   light     on a fine pointer, glass panes pick up the cursor as a light
 */

const reduceMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Holds back what is below the fold, then lets it rise in once. */
function initReveal(): void {
  const els = [...document.querySelectorAll<HTMLElement>("[data-h-reveal]")];
  if (!els.length || reduceMotion() || !("IntersectionObserver" in window)) {
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        el.dataset.hReveal = "in";
        // The animation leaves nothing behind (backwards fill); drop the
        // marker once it has played.
        el.addEventListener(
          "animationend",
          () => el.removeAttribute("data-h-reveal"),
          { once: true },
        );
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  for (const el of els) {
    // Already on screen at load: leave it alone, no flash and no replay.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.removeAttribute("data-h-reveal");
      continue;
    }
    el.dataset.hReveal = "held";
    observer.observe(el);
  }
}

/** "1500", "30+", "1,500": the leading number counts, the rest stays. */
const FIGURE = /^(\D*)(\d[\d.,]*)(.*)$/;
const COUNT_MS = 1400;

function countUp(el: HTMLElement): void {
  const match = FIGURE.exec(el.textContent?.trim() ?? "");
  if (!match) return;
  const [, before, digits, after] = match;
  const end = Number(digits.replace(/[.,]/g, ""));
  if (!Number.isFinite(end) || end <= 0) return;
  // Keep the content's own grouping ("1,500" or "1500").
  const separator = /[.,]/.exec(digits)?.[0];
  const format = (n: number) =>
    separator
      ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      : String(n);
  // The figure sharpens out of a blur while it counts (StatsBand.astro).
  el.classList.add("is-counting");
  el.addEventListener(
    "animationend",
    () => el.classList.remove("is-counting"),
    { once: true },
  );
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / COUNT_MS);
    // Ease out: fast first, settling on the final figure.
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = before + format(Math.round(end * eased)) + after;
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function initCountUp(): void {
  const els = [...document.querySelectorAll<HTMLElement>("[data-count-up]")];
  if (!els.length || reduceMotion() || !("IntersectionObserver" in window)) {
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        // Once per page load: scrolling back never restarts it.
        observer.unobserve(entry.target);
        countUp(entry.target as HTMLElement);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => observer.observe(el));
}

function initMarquee(): void {
  const root = document.querySelector<HTMLElement>("[data-marquee]");
  if (!root) return;
  const toggle = root.querySelector<HTMLButtonElement>("[data-marquee-toggle]");
  const label = root.querySelector<HTMLElement>("[data-marquee-label]");
  toggle?.addEventListener("click", () => {
    const paused = root.toggleAttribute("data-paused");
    toggle.setAttribute("aria-pressed", String(paused));
    if (label) {
      label.textContent =
        (paused ? label.dataset.play : label.dataset.pause) ?? "";
    }
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      root.toggleAttribute("data-offscreen", !entry.isIntersecting);
    }).observe(root);
  }
}

/**
 * The ground's light costs frames only while it can be seen: it is covered
 * by the hero video until the hero has scrolled away.
 */
function initAmbient(): void {
  if (!("IntersectionObserver" in window)) return;
  const ground = document.querySelector<HTMLElement>("[data-home-ground]");
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!ground || !hero) return;
  new IntersectionObserver(
    ([entry]) => {
      // Still while the hero fills (nearly) the whole viewport.
      ground.toggleAttribute(
        "data-still",
        entry.intersectionRect.height > window.innerHeight * 0.92,
      );
    },
    { threshold: [0, 0.25, 0.5, 0.75, 0.92, 1] },
  ).observe(hero);
}

/** Largest tilt of a pane toward the pointer, in degrees. */
const TILT_DEG = 3;

/**
 * Pointer light: a pane marked data-h-light shows a soft highlight where
 * the cursor is (--h-lx / --h-ly, read by .h-glare), and one that is also
 * marked data-h-tilt turns a few degrees toward it (--h-rx / --h-ry). Only
 * for a mouse or pen that can hover; touch and reduced motion get the
 * resting pane. One listener for the page, one write per frame.
 */
function initPointerLight(): void {
  if (
    reduceMotion() ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    return;
  }
  let pane: HTMLElement | null = null;
  let x = 0;
  let y = 0;
  let queued = false;

  const rest = (el: HTMLElement) => {
    el.classList.remove("is-lit-by-pointer");
    el.style.removeProperty("--h-rx");
    el.style.removeProperty("--h-ry");
  };

  const paint = () => {
    queued = false;
    if (!pane) return;
    const box = pane.getBoundingClientRect();
    const px = (x - box.left) / Math.max(1, box.width);
    const py = (y - box.top) / Math.max(1, box.height);
    pane.style.setProperty("--h-lx", `${(px * 100).toFixed(1)}%`);
    pane.style.setProperty("--h-ly", `${(py * 100).toFixed(1)}%`);
    if (pane.hasAttribute("data-h-tilt")) {
      pane.style.setProperty(
        "--h-ry",
        `${((px - 0.5) * 2 * TILT_DEG).toFixed(2)}deg`,
      );
      pane.style.setProperty(
        "--h-rx",
        `${((0.5 - py) * 2 * TILT_DEG).toFixed(2)}deg`,
      );
    }
    pane.classList.add("is-lit-by-pointer");
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      const next =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>("[data-h-light]")
          : null;
      if (next !== pane) {
        if (pane) rest(pane);
        pane = next;
      }
      if (!pane) return;
      x = event.clientX;
      y = event.clientY;
      if (!queued) {
        queued = true;
        requestAnimationFrame(paint);
      }
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => {
    if (pane) rest(pane);
    pane = null;
  });
}

/**
 * The partner files are made for the partner page: several hundred pixels
 * wide, here drawn about a hundred wide. Left as they are, the browser
 * decodes and scales one every time it slides into view, a hitch every
 * second or two across three strips. Once the page is idle each distinct
 * logo is drawn once into a bitmap of its drawn size (times the device
 * pixel ratio) and every copy of it in the strips points at that small
 * image instead. Same origin only, nothing leaves the page, and a logo
 * that cannot be converted simply stays as it is.
 */
function initLogoThumbs(): void {
  const imgs = [
    ...document.querySelectorAll<HTMLImageElement>(".h-partner-slab img"),
  ];
  if (!imgs.length || !("createImageBitmap" in window)) return;
  const bySrc = new Map<string, HTMLImageElement[]>();
  for (const img of imgs) {
    const list = bySrc.get(img.src) ?? [];
    list.push(img);
    bySrc.set(img.src, list);
  }
  const scale = Math.min(3, Math.ceil(window.devicePixelRatio || 1));

  async function convert(src: string, copies: HTMLImageElement[]) {
    const first = copies[0];
    try {
      await first.decode();
      const width = Math.max(1, Math.round(first.width * scale));
      const height = Math.max(1, Math.round(first.height * scale));
      // Nothing to gain from a file that is already small.
      if (first.naturalWidth <= width * 1.25) return;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingQuality = "high";
      // Fit inside the box, as object-fit: contain draws it.
      const ratio = Math.min(
        width / first.naturalWidth,
        height / first.naturalHeight,
      );
      const w = first.naturalWidth * ratio;
      const h = first.naturalHeight * ratio;
      ctx.drawImage(first, (width - w) / 2, (height - h) / 2, w, h);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      for (const img of copies) img.src = url;
    } catch {
      // A logo that cannot be read (broken file, tainted canvas) stays.
    }
  }

  const run = async () => {
    for (const [src, copies] of bySrc) {
      await convert(src, copies);
      // One logo per idle slice, so the conversion itself never hitches.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  };
  const start = () =>
    "requestIdleCallback" in window
      ? window.requestIdleCallback(() => void run(), { timeout: 3000 })
      : setTimeout(() => void run(), 1200);
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}

/** The hero video costs decoding only while the hero can be seen. */
function initHeroVideo(): void {
  const hero = document.querySelector<HTMLElement>(".hero");
  if (!hero || !("IntersectionObserver" in window)) return;
  new IntersectionObserver(([entry]) => {
    // Looked up each time: the element is removed for reduced motion and
    // data saver, and only starts playing once its stream is ready.
    const video = hero.querySelector<HTMLVideoElement>("video");
    if (!video) return;
    if (entry.isIntersecting) {
      if (video.paused && video.readyState > 1) {
        video.play().catch(() => {});
      }
    } else if (!video.paused) {
      video.pause();
    }
  }).observe(hero);
}

/** A glass Q that cannot load leaves no broken image behind. */
function initGlassQ(): void {
  document.querySelectorAll<HTMLImageElement>("img.h-q").forEach((img) => {
    if (img.complete && img.naturalWidth === 0) img.remove();
    else img.addEventListener("error", () => img.remove(), { once: true });
  });
}

export function initHomePage(): void {
  initGlassQ();
  initReveal();
  initCountUp();
  initMarquee();
  initAmbient();
  initPointerLight();
  initLogoThumbs();
  initHeroVideo();
}
