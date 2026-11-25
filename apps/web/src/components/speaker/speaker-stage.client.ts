/**
 * Speaker stage on /speaker (SpeakerStage.astro, DESIGN.md SPEAKER-1).
 *
 * The stage photo never changes; this swaps what stands on its screens.
 * Steps loop in both directions and come from the arrows, the left and right
 * arrow keys (arrow-keys.client.ts) and a horizontal swipe. The name is
 * typed one letter every TYPE_MS behind a blinking cursor; screen readers
 * get the whole speaker at once from a polite live region, never the typing
 * (the typed text is aria-hidden). Reduced motion shows the name at once and
 * skips the photo fade. The photos of the previous and next speaker are
 * preloaded so a step never waits for the network.
 */

import { registerArrowKeys } from "./arrow-keys.client";

interface StageSpeaker {
  name: string;
  role: string;
  talkTitle?: string;
  quote?: string;
  photo?: string;
  photoLook?: boolean;
}

const TYPE_MS = 60;
const SWIPE_PX = 40;

const pad = (n: number) => String(n).padStart(2, "0");

function initStage(root: HTMLElement): void {
  const raw = root.querySelector("[data-stage-data]")?.textContent;
  if (!raw) return;
  const speakers = JSON.parse(raw) as StageSpeaker[];
  const total = speakers.length;
  if (total === 0) return;

  const all = <T extends Element = HTMLElement>(sel: string) => [
    ...root.querySelectorAll<T>(sel),
  ];
  const typed = root.querySelector<HTMLElement>("[data-stage-typed]");
  const photo = root.querySelector<HTMLImageElement>("[data-stage-photo]");
  const scene = root.querySelector<HTMLElement>("[data-stage-scene]");
  const live = root.querySelector<HTMLElement>("[data-stage-live]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  let index = 0;
  let typing = 0;

  const typeName = (name: string) => {
    window.clearInterval(typing);
    if (!typed) return;
    if (reduced.matches) {
      typed.textContent = name;
      return;
    }
    const letters = [...name];
    let shown = 0;
    typed.textContent = "";
    typing = window.setInterval(() => {
      shown += 1;
      typed.textContent = letters.slice(0, shown).join("");
      if (shown >= letters.length) window.clearInterval(typing);
    }, TYPE_MS);
  };

  const preload = (i: number) => {
    const src = speakers[(i + total) % total]?.photo;
    if (src) new Image().src = src;
  };

  const show = (next: number) => {
    index = (next + total) % total;
    const s = speakers[index]!;

    all("[data-stage-num]").forEach((el) => (el.textContent = pad(index + 1)));
    all("[data-stage-role]").forEach((el) => (el.textContent = s.role));
    all("[data-stage-talk]").forEach(
      (el) => (el.textContent = s.talkTitle ?? ""),
    );
    all("[data-stage-quote]").forEach((el) => (el.textContent = s.quote ?? ""));
    all("[data-stage-quote-wrap]").forEach((el) => (el.hidden = !s.quote));
    typeName(s.name);

    if (photo && scene) {
      photo.removeAttribute("data-fade");
      // "look": a cutout of the stage with the speaker on the screen, laid
      // over the stage photo; "screen": any other photo, fitted into the
      // screen; "none": the silhouette (SpeakerStage.astro).
      scene.dataset.photo = s.photo
        ? s.photoLook
          ? "look"
          : "screen"
        : "none";
      if (s.photo) {
        photo.hidden = false;
        photo.src = s.photo;
        // Restart the CSS fade (skipped by the reduced-motion rule).
        void photo.offsetWidth;
        photo.setAttribute("data-fade", "");
      } else {
        photo.hidden = true;
        photo.removeAttribute("src");
      }
    }

    if (live) {
      const talk = s.talkTitle ? `. Talk: ${s.talkTitle}` : "";
      live.textContent = `Speaker ${index + 1} of ${total}: ${s.name}, ${s.role}${talk}`;
    }
    preload(index + 1);
    preload(index - 1);
  };

  all<HTMLButtonElement>("[data-stage-prev]").forEach((b) =>
    b.addEventListener("click", () => show(index - 1)),
  );
  all<HTMLButtonElement>("[data-stage-next]").forEach((b) =>
    b.addEventListener("click", () => show(index + 1)),
  );

  // Arrow keys: whenever the stage is focused or the section most in view.
  if (total > 1)
    registerArrowKeys(root, (direction) => show(index + direction));

  // Swipe on the stage and the card under it; vertical scrolling stays
  // native (touch-action: pan-y on the frame).
  let startX = 0;
  let startY = 0;
  root.addEventListener(
    "touchstart",
    (event) => {
      const t = event.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
    },
    { passive: true },
  );
  root.addEventListener(
    "touchend",
    (event) => {
      const t = event.changedTouches[0];
      if (!t || total < 2) return;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy)) return;
      show(dx < 0 ? index + 1 : index - 1);
    },
    { passive: true },
  );

  // Type the first name once the stage comes into view; until then (and
  // without JavaScript) it stands complete.
  if (!reduced.matches && typed && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      if (index === 0) typeName(speakers[0]!.name);
    });
    observer.observe(root);
  }
  preload(1);
  preload(total - 1);
}

document.querySelectorAll<HTMLElement>("[data-stage]").forEach(initStage);
