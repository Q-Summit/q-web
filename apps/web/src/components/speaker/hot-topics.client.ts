/**
 * Hot topics card on /speaker (HotTopics.astro, DESIGN.md SPEAKER-1).
 *
 * Every topic is already in the HTML; this only moves `data-active` between
 * them. The arrow buttons and the left and right arrow keys
 * (arrow-keys.client.ts) loop (after the last comes the first), a small sphere
 * jumps to its topic, and the change is announced once through a polite
 * live region. Cross-fades are CSS and stop for reduced motion.
 */

import { registerArrowKeys } from "./arrow-keys.client";

function initHotTopics(root: HTMLElement): void {
  const items = [...root.querySelectorAll<HTMLElement>("[data-ht-item]")];
  const minis = [...root.querySelectorAll<HTMLButtonElement>("[data-ht-mini]")];
  const total = minis.length;
  if (total < 2) return;

  const hint = root.querySelector<HTMLElement>("[data-ht-hint]");
  const live = root.querySelector<HTMLElement>("[data-ht-live]");
  const keywords = minis.map(
    (m) => m.getAttribute("aria-label")?.replace(/^Show topic \d+: /, "") ?? "",
  );
  let index = 0;

  const show = (next: number, announce: boolean) => {
    index = (next + total) % total;
    for (const item of items) {
      const on = Number(item.dataset.htItem) === index;
      item.toggleAttribute("data-active", on);
      if (on) item.removeAttribute("aria-hidden");
      else item.setAttribute("aria-hidden", "true");
    }
    minis.forEach((mini, i) =>
      mini.setAttribute("aria-pressed", String(i === index)),
    );
    if (hint)
      hint.textContent = `Topic ${index + 1} of ${total} · Tap a sphere or use the arrows`;
    if (announce && live)
      live.textContent = `Topic ${index + 1} of ${total}: ${keywords[index]}`;
  };

  root
    .querySelectorAll<HTMLButtonElement>("[data-ht-prev]")
    .forEach((b) => b.addEventListener("click", () => show(index - 1, true)));
  root
    .querySelectorAll<HTMLButtonElement>("[data-ht-next]")
    .forEach((b) => b.addEventListener("click", () => show(index + 1, true)));
  minis.forEach((mini, i) =>
    mini.addEventListener("click", () => show(i, true)),
  );
  registerArrowKeys(root, (direction) => show(index + direction, true));
}

document
  .querySelectorAll<HTMLElement>("[data-hot-topics]")
  .forEach(initHotTopics);
