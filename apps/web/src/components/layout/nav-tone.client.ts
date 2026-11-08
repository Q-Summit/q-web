/**
 * Glass header tone (DESIGN.md COMP-6): sets data-tone="dark" on the header
 * while the bar floats over a dark ground, so Nav.astro can frost the glass
 * and keep the navy logo and links readable. Dark grounds are the
 * `.section.is-dark` shells (the home video hero included) and anything a
 * page marks with `data-nav-tone="dark"`.
 *
 * One IntersectionObserver whose root box is a one-pixel line through the
 * middle of the bar, so it reports exactly which ground sits behind the
 * header. No scroll listener; the line is rebuilt only on resize.
 */
const DARK_GROUNDS = '.section.is-dark, [data-nav-tone="dark"]';

export function initNavTone(header: HTMLElement) {
  if (!("IntersectionObserver" in window)) return;
  const grounds = [...document.querySelectorAll<HTMLElement>(DARK_GROUNDS)];
  if (grounds.length === 0) {
    header.dataset.tone = "light";
    return;
  }

  const behind = new Set<Element>();
  let observer: IntersectionObserver | null = null;

  const apply = () => {
    header.dataset.tone = behind.size > 0 ? "dark" : "light";
  };

  const observe = () => {
    observer?.disconnect();
    behind.clear();
    const bar = header.querySelector<HTMLElement>(".nav-inner") ?? header;
    const rect = bar.getBoundingClientRect();
    const line = Math.round(rect.top + rect.height / 2);
    const below = Math.max(0, window.innerHeight - line - 1);
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) behind.add(entry.target);
          else behind.delete(entry.target);
        }
        apply();
      },
      { rootMargin: `-${line}px 0px -${below}px 0px` },
    );
    grounds.forEach((ground) => observer?.observe(ground));
  };

  observe();
  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(observe);
  });
}
