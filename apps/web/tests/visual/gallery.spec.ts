import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { WIDTHS } from "./widths";

// Freeze everything non-deterministic so screenshots are byte-stable across runs
// and runners: motion, the text caret, smooth scroll.
// scroll-snap-type is disabled too: a `scroll-snap-type: x mandatory` carousel
// (e.g. the speaker grid) can rest at a sub-pixel-varying scrollLeft between
// runs, shifting the snapped card a few pixels; the spec also pins every
// scroller to its origin below so the first slide is always framed identically.
const FREEZE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;scroll-behavior:auto!important;scroll-snap-type:none!important}`;

// Enumerate entries from the built gallery: each /vrt/<id>/ page is one
// directory in dist-vrt. Read at collection time (before the web server starts)
// so we generate one test per entry x width, which gives a granular report.
// HTML report nests suites via test.describe(component) below.
// `pnpm vrt` builds dist-vrt first.
const galleryDir = new URL("../../dist-vrt/vrt/", import.meta.url);
let entries: { id: string }[] = [];
try {
  entries = readdirSync(galleryDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ id: e.name }));
} catch {
  throw new Error(
    `VRT gallery build not found at ${fileURLToPath(galleryDir)}. Run the VRT build first (pnpm --filter web run vrt:build).`,
  );
}

test("gallery has entries", () => {
  expect(entries.length, "no *.vrt.ts variants were collected").toBeGreaterThan(
    0,
  );
});

// Group by component (id is `component--variant`) so the Playwright HTML
// report nests suites instead of one flat gallery.spec.ts list. The sticky
// PR comment already groups this way via vrt-report.mjs.
const byComponent = new Map<string, { id: string; variant: string }[]>();
for (const entry of entries) {
  const sep = entry.id.indexOf("--");
  const component = sep === -1 ? entry.id : entry.id.slice(0, sep);
  const variant = sep === -1 ? entry.id : entry.id.slice(sep + 2);
  const list = byComponent.get(component) ?? [];
  list.push({ id: entry.id, variant });
  byComponent.set(component, list);
}

for (const component of [...byComponent.keys()].sort()) {
  test.describe(component, () => {
    for (const { id, variant } of byComponent.get(component)!) {
      for (const width of WIDTHS) {
        test(`${variant} @ ${width}px`, async ({ page }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.goto(`/vrt/${id}/`, { waitUntil: "load" });
          await page.addStyleTag({ content: FREEZE });
          await page.evaluate(() => document.fonts.ready);
          // Neutralize <video>: the hero uses a full-bleed background video that
          // autoplays and never reaches a stable frame. Masking it is wrong here,
          // because the mask paints over the whole hero (video + the text/CTA
          // stacked on top), so the shot would test nothing. Instead pause it and
          // hide it: the component's own backdrop (the navy `.is-dark` section plus
          // `.hero-overlay`) stays, the white content on top stays readable, the
          // real poster image is never baked in, and the frame is deterministic.
          await page.evaluate(() => {
            for (const v of Array.from(document.querySelectorAll("video"))) {
              v.pause();
              v.autoplay = false;
              try {
                v.currentTime = 0;
              } catch {
                /* not seekable yet; hidden below regardless */
              }
              v.style.visibility = "hidden";
            }
          });
          // Replace every image's pixels with a deterministic grey image-placeholder
          // glyph of the same intrinsic size. Real photos are gitignored (absent on a
          // fresh checkout / CI) and must never be baked into a committed baseline;
          // this keeps content out of git, makes diffs flat, and stays stable
          // whether the real file resolves or 404s. The element, its CSS
          // (border-radius, object-fit) and its box are untouched, so layout
          // regressions are still caught. astro:assets <picture> is handled by
          // dropping <source> so the fallback <img> we rewrite is used.
          await page.evaluate(async () => {
            // A recognizable "image" placeholder (framed box + sun + mountain) drawn
            // as pure vector, centered and scaled to the box. It reads as a stand-in
            // photo rather than an empty gap, and being font-free stays byte-stable.
            const BG = "#dfe3e8";
            const FG = "#9aa2ac";
            const placeholder = (w: number, h: number) => {
              const s = Math.max(16, Math.min(120, Math.min(w, h) * 0.5));
              const tx = (w - s) / 2;
              const ty = (h - s) / 2;
              const k = s / 48;
              const svg =
                `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
                `<rect width="${w}" height="${h}" fill="${BG}"/>` +
                `<g transform="translate(${tx} ${ty}) scale(${k})">` +
                `<rect x="4" y="8" width="40" height="32" rx="3" fill="none" stroke="${FG}" stroke-width="3"/>` +
                `<circle cx="14" cy="18" r="3.5" fill="${FG}"/>` +
                `<path d="M7 39 L19 26 L26 33 L33 25 L44 39 Z" fill="${FG}"/>` +
                `</g></svg>`;
              return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
            };
            for (const s of Array.from(
              document.querySelectorAll("picture source"),
            ))
              s.remove();
            for (const img of Array.from(document.querySelectorAll("img"))) {
              const wAttr = parseInt(img.getAttribute("width") || "", 10);
              const hAttr = parseInt(img.getAttribute("height") || "", 10);
              let w = wAttr > 0 ? wAttr : img.naturalWidth;
              let h = hAttr > 0 ? hAttr : img.naturalHeight;
              if (!w || !h) {
                const r = img.getBoundingClientRect();
                w = Math.max(1, Math.round(r.width)) || 100;
                h = Math.max(1, Math.round(r.height)) || 100;
              }
              img.removeAttribute("srcset");
              img.removeAttribute("sizes");
              img.loading = "eager";
              img.src = placeholder(w, h);
            }
            await Promise.all(
              Array.from(document.querySelectorAll("img")).map((i) =>
                i.decode().catch(() => {}),
              ),
            );
            // Pin every scroller (and the page) to its origin so a carousel's
            // resting position never shifts the shot between runs.
            for (const el of Array.from(
              document.querySelectorAll<HTMLElement>("*"),
            )) {
              if (el.scrollLeft) el.scrollLeft = 0;
              if (el.scrollTop) el.scrollTop = 0;
            }
            window.scrollTo(0, 0);
          });
          await page.waitForTimeout(150);
          // Mask only regions a component explicitly marks as intentionally
          // dynamic. Videos are hidden above, not masked (see the note there).
          const mask = page.locator("[data-vrt-mask]");
          await expect(page).toHaveScreenshot(`${id}-${width}.png`, {
            fullPage: true,
            mask: (await mask.count()) ? [mask] : [],
          });
        });
      }
    }
  });
}
