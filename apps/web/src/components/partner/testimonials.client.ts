/**
 * Speech bubbles for the partner testimonials (TestimonialQuotes.astro).
 * Reveals the photo buttons, hides the quotes and opens one at a time as a
 * bubble. Escape closes it and returns focus to its photo; a click anywhere
 * outside the open card closes it too. Without this script every quote
 * stays visible under its photo.
 */

// The fixed site header's height (the --site-header-height token, in rem),
// so a bubble never ends up under it.
function siteHeaderHeight(): number {
  const root = getComputedStyle(document.documentElement);
  const value = root.getPropertyValue("--site-header-height").trim();
  const rem = Number.parseFloat(root.fontSize) || 16;
  if (value.endsWith("rem")) return Number.parseFloat(value) * rem;
  return Number.parseFloat(value) || 0;
}

function initVoiceList(list: HTMLElement): void {
  const voices = [...list.querySelectorAll<HTMLElement>("[data-voice]")];
  const pairs = voices.flatMap((voice) => {
    const trigger = voice.querySelector<HTMLButtonElement>(
      "[data-voice-trigger]",
    );
    const quote = voice.querySelector<HTMLElement>("[data-voice-quote]");
    return trigger && quote ? [{ voice, trigger, quote }] : [];
  });
  if (pairs.length === 0) return;

  let open: (typeof pairs)[number] | null = null;

  function close(returnFocus = false): void {
    if (!open) return;
    open.trigger.setAttribute("aria-expanded", "false");
    open.quote.hidden = true;
    if (returnFocus) open.trigger.focus();
    open = null;
  }

  function show(pair: (typeof pairs)[number]): void {
    close();
    // The bubble rises above the card, from the card's right edge when it
    // would run past the window from the left edge.
    pair.quote.removeAttribute("data-edge");
    pair.quote.hidden = false;
    if (
      pair.quote.getBoundingClientRect().right >
      document.documentElement.clientWidth
    ) {
      pair.quote.setAttribute("data-edge", "end");
    }
    pair.trigger.setAttribute("aria-expanded", "true");
    open = pair;
    bringIntoView(pair);
  }

  // Opening a bubble pulls the page along so the bubble and its card are
  // in view: down when the bubble starts under the site header, up when
  // the card ends below the window.
  function bringIntoView(pair: (typeof pairs)[number]): void {
    const gap = 16;
    const topLimit = siteHeaderHeight() + gap;
    const top = pair.quote.getBoundingClientRect().top;
    const bottom = pair.voice.getBoundingClientRect().bottom;
    let delta = 0;
    if (top < topLimit) delta = top - topLimit;
    else if (bottom > window.innerHeight - gap)
      delta = Math.min(bottom - (window.innerHeight - gap), top - topLimit);
    if (delta === 0) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollBy({ top: delta, behavior: reduce ? "instant" : "smooth" });
  }

  // Hide first, then switch to bubble styles, so nothing animates on load.
  for (const { trigger, quote } of pairs) {
    quote.hidden = true;
    trigger.hidden = false;
  }
  list.setAttribute("data-enhanced", "");

  for (const pair of pairs) {
    pair.trigger.addEventListener("click", () => {
      if (open === pair) close();
      else show(pair);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (open && !open.voice.contains(event.target as Node)) close();
  });

  // Focus moving out of the open card (Tab past the bubble) closes it, so a
  // bubble never covers the photo a keyboard user lands on next.
  list.addEventListener("focusout", (event) => {
    const next = event.relatedTarget as Node | null;
    if (open && next && !open.voice.contains(next)) close();
  });
}

export function initVoices(): void {
  document
    .querySelectorAll<HTMLElement>("[data-voices]")
    .forEach(initVoiceList);
}
