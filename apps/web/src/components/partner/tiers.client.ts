/**
 * The partner logos (PartnerTiers.astro, DESIGN.md PARTNER-1).
 *
 * Without this script every logo is a link to the partner's website and the
 * tier bar jumps to the tiers. With it:
 *  - a logo click opens the partner's pop-up (partner-dialog.client.ts);
 *  - a logo file that fails to load shows the partner's name instead;
 *  - every logo is redrawn in white and ice blue without its box
 *    (logo-tone.client.ts);
 *  - the tier bar marks the tier in view and keeps it visible when the bar
 *    scrolls sideways (phones). One IntersectionObserver, no scroll
 *    listener.
 */
import { initLogoTone } from "./logo-tone.client";
import { initPartnerDialog } from "./partner-dialog.client";

function markMissing(root: HTMLElement): void {
  for (const img of root.querySelectorAll<HTMLImageElement>(".tier-mark")) {
    const mark = () =>
      img.closest(".tier-logo")?.setAttribute("data-missing", "");
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) mark();
    else img.addEventListener("error", mark, { once: true });
  }
}

function initTierBar(root: HTMLElement): void {
  const bar = root.querySelector<HTMLElement>(".pt-bar ul");
  const links = new Map<string, HTMLAnchorElement>();
  for (const link of root.querySelectorAll<HTMLAnchorElement>(
    "[data-tier-link]",
  ))
    links.set(link.dataset.tierLink!, link);
  const tiers = [...root.querySelectorAll<HTMLElement>(".tier")];
  if (!bar || tiers.length === 0 || typeof IntersectionObserver === "undefined")
    return;

  let current: HTMLAnchorElement | undefined;
  const select = (id: string) => {
    const link = links.get(id);
    if (!link || link === current) return;
    current?.removeAttribute("aria-current");
    link.setAttribute("aria-current", "true");
    current = link;
    // Keep it in view inside the bar, without moving the page.
    if (bar.scrollWidth > bar.clientWidth) {
      const left = link.offsetLeft - (bar.clientWidth - link.offsetWidth) / 2;
      bar.scrollTo({ left, behavior: "smooth" });
    }
  };

  // A tier counts as in view while it crosses a line a third of the way
  // down the window, under the header and the bar.
  const visible = new Set<HTMLElement>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const tier = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(tier);
        else visible.delete(tier);
      }
      const first = tiers.find((tier) => visible.has(tier));
      if (first) select(first.id);
    },
    { rootMargin: "-33% 0px -66% 0px" },
  );
  tiers.forEach((tier) => observer.observe(tier));
}

export function initPartnerTiers(): void {
  for (const root of document.querySelectorAll<HTMLElement>(
    "[data-partner-tiers]",
  )) {
    initPartnerDialog(root);
    initLogoTone(root);
    markMissing(root);
    initTierBar(root);
  }
}
