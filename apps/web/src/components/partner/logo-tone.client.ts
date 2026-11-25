/**
 * White and ice blue partner logos on the dark partner page (DESIGN.md
 * PARTNER-1), with no box behind them.
 *
 * The CSS filter in PartnerTiers.astro already tones every logo and lets
 * a white ground fall away; it is the fallback without JavaScript. It cannot
 * tell a box or a sticker outline from the mark inside it, though: a black
 * outline around white letters, or a colored badge with a symbol in it,
 * would turn into one white block. So this script redraws each logo once,
 * on a small canvas:
 *  1. Key out the ground: the color along the image's edge, when that edge
 *     is solid and even (a white or colored ground).
 *  2. Peel off containers: a shape whose outer band is all one tone (dark
 *     or light) and holds marks of the other tone inside it is a box, a
 *     badge or a sticker outline. When it holds the whole logo (a box, a
 *     sticker outline), the band goes and the marks inside stay. When it
 *     is only one part of the logo (a round badge beside the wordmark),
 *     it is turned the other way round: the badge stays and the marks
 *     inside it are cut out, so the page's own blue shows through them.
 *     Repeated, so a frame around a box around letters peels to the
 *     letters. A plain letter never qualifies: it holds nothing.
 *  3. Tone what remains: neutral parts (black, grey, white) white, colored
 *     parts ice blue, by their chroma.
 * The result, trimmed to the mark, replaces the image, and the tile drops
 * the CSS filter and takes the trimmed aspect ratio. The real logo on the
 * hover card is the untouched file, trimmed to its own mark the same way.
 * The pop-up keeps the original file (data-partner-logo). Logos are processed
 * one at a time when they come near the screen, in idle time. A file the
 * canvas cannot read keeps the CSS tone.
 */

const MAX_WIDTH = 480;
const MAX_HEIGHT = 240;
/** Color distance (0..1) under which a pixel counts as the keyed color. */
const KEY_NEAR = 0.08;
/** Over this much more distance a pixel fades back in (soft edges). */
const KEY_SOFT = 0.14;
/** A container's outer band is at least this share one tone. */
const BAND_SHARE = 0.85;
/** And its two tones differ by at least this much lightness (0..1). */
const MIN_CONTRAST = 0.4;
/** And the band is thicker than an anti-aliased edge, in pixels. */
const MIN_BAND = 2.5;
/** And the marks inside cover at least this share of the shape. */
const MIN_INSIDE = 0.04;
/**
 * A container is only one part of the logo (a badge, cut out instead of
 * peeled) when the logo has at least this much more outside it, relative to
 * the container's own size...
 */
const PART_OUTSIDE = 0.15;
/** ...and the container spans at most this share of the logo's width. */
const PART_WIDTH = 0.7;

export type Rgb = [number, number, number];

function parseColor(value: string): Rgb | null {
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!hex) return null;
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

const smoothstep = (a: number, b: number, n: number) => {
  const t = clamp01((n - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function distance(px: Uint8ClampedArray, i: number, c: Rgb): number {
  const dr = px[i]! - c[0];
  const dg = px[i + 1]! - c[1];
  const db = px[i + 2]! - c[2];
  return Math.sqrt(dr * dr + dg * dg + db * db) / 441.7;
}

/**
 * The color that most of these pixels share, solid and within a small
 * tolerance, or null. The most common color rather than the average, so a
 * few letters touching the edge of a box do not hide the box.
 */
function evenColor(
  px: Uint8ClampedArray,
  alpha: Float32Array,
  indices: number[],
  minShare: number,
): Rgb | null {
  if (indices.length === 0) return null;
  const buckets = new Map<number, number[]>();
  for (const p of indices) {
    const i = p * 4;
    if (px[i + 3]! <= 200 || alpha[p]! < 0.9) continue;
    const key =
      (px[i]! >> 4) * 256 + (px[i + 1]! >> 4) * 16 + (px[i + 2]! >> 4);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(p);
    else buckets.set(key, [p]);
  }
  let top: number[] = [];
  for (const bucket of buckets.values())
    if (bucket.length > top.length) top = bucket;
  if (top.length === 0) return null;
  const mean: Rgb = [0, 0, 0];
  for (const p of top)
    for (let c = 0; c < 3; c++) mean[c] += px[p * 4 + c]! / top.length;
  // Pixels close to that color, not only the ones in its bucket.
  const near = indices.filter(
    (p) =>
      px[p * 4 + 3]! > 200 &&
      alpha[p]! >= 0.9 &&
      distance(px, p * 4, mean) < KEY_NEAR,
  ).length;
  return near / indices.length >= minShare ? mean : null;
}

function keyOut(px: Uint8ClampedArray, alpha: Float32Array, color: Rgb) {
  for (let p = 0; p < alpha.length; p++) {
    if (alpha[p] === 0) continue;
    const d = distance(px, p * 4, color);
    alpha[p] = alpha[p]! * clamp01((d - KEY_NEAR) / KEY_SOFT);
  }
}

function edge(x0: number, y0: number, x1: number, y1: number, w: number) {
  const out: number[] = [];
  for (let x = x0; x <= x1; x++) out.push(y0 * w + x, y1 * w + x);
  for (let y = y0 + 1; y < y1; y++) out.push(y * w + x0, y * w + x1);
  return out;
}

/**
 * The lightness that best splits these pixels into a dark and a light tone:
 * the threshold with the largest variance between the two groups.
 */
function split(lum: Float32Array, pixels: number[]): number {
  const bins = new Float64Array(64);
  for (const p of pixels) bins[Math.min(63, Math.floor(lum[p]! * 64))]! += 1;
  const total = pixels.length;
  let sum = 0;
  for (let b = 0; b < 64; b++) sum += b * bins[b]!;
  let below = 0;
  let belowSum = 0;
  let best = 0;
  let threshold = 32;
  for (let b = 0; b < 63; b++) {
    below += bins[b]!;
    belowSum += b * bins[b]!;
    const above = total - below;
    if (below === 0 || above === 0) continue;
    const between =
      below * above * (belowSum / below - (sum - belowSum) / above) ** 2;
    if (between > best) {
      best = between;
      threshold = b + 1;
    }
  }
  return threshold / 64;
}

/**
 * One round of step 2 over every solid shape of the logo. Returns whether
 * anything was peeled, so the caller can look again at what is left.
 */
function peel(
  px: Uint8ClampedArray,
  lum: Float32Array,
  alpha: Float32Array,
  w: number,
  h: number,
): boolean {
  const n = w * h;
  const solid = (p: number) => alpha[p]! > 0.5;
  const label = new Int32Array(n).fill(-1);
  const minSize = Math.max(48, n * 0.002);
  let changed = false;
  const stack: number[] = [];

  // How much the whole logo holds, and how wide it is.
  let total = 0;
  let left = w;
  let right = -1;
  for (let p = 0; p < n; p++)
    if (solid(p)) {
      total++;
      const x = p % w;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  const logoWidth = right - left + 1;

  for (let start = 0; start < n; start++) {
    if (label[start] !== -1 || !solid(start)) continue;
    // The shape: every solid pixel 4-connected to this one.
    const pixels: number[] = [];
    let shapeLeft = w;
    let shapeRight = -1;
    label[start] = start;
    stack.push(start);
    while (stack.length > 0) {
      const p = stack.pop()!;
      pixels.push(p);
      const x = p % w;
      if (x < shapeLeft) shapeLeft = x;
      if (x > shapeRight) shapeRight = x;
      const next = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w];
      for (const q of next)
        if (q >= 0 && q < n && label[q] === -1 && solid(q)) {
          label[q] = start;
          stack.push(q);
        }
    }
    if (pixels.length < minSize) continue;

    const threshold = split(lum, pixels);
    let dark = 0;
    let darkSum = 0;
    let lightSum = 0;
    let band = 0;
    let bandDark = 0;
    for (const p of pixels) {
      const isDark = lum[p]! < threshold;
      if (isDark) {
        dark++;
        darkSum += lum[p]!;
      } else lightSum += lum[p]!;
      const x = p % w;
      const y = (p - x) / w;
      const outer =
        x === 0 ||
        y === 0 ||
        x === w - 1 ||
        y === h - 1 ||
        !solid(p - 1) ||
        !solid(p + 1) ||
        !solid(p - w) ||
        !solid(p + w);
      if (outer) {
        band++;
        if (isDark) bandDark++;
      }
    }
    const light = pixels.length - dark;
    if (dark === 0 || light === 0 || band === 0) continue;
    const darkMean = darkSum / dark;
    const lightMean = lightSum / light;
    if (lightMean - darkMean < MIN_CONTRAST) continue;

    const bandIsDark = bandDark / band >= BAND_SHARE;
    const bandIsLight = (band - bandDark) / band >= BAND_SHARE;
    if (!bandIsDark && !bandIsLight) continue;
    const outerCount = bandIsDark ? dark : light;
    const innerCount = pixels.length - outerCount;
    if (innerCount / pixels.length < MIN_INSIDE) continue;
    if (outerCount / band < MIN_BAND) continue;

    // The container is the band's tone reached from the band itself, so
    // marks of that same tone further in (light letters inside a dark box
    // inside a light frame) are kept for the next round.
    const inBand = (p: number) => lum[p]! < threshold === bandIsDark;
    const peeled = new Uint8Array(n);
    for (const p of pixels) {
      const x = p % w;
      const y = (p - x) / w;
      const outer =
        x === 0 ||
        y === 0 ||
        x === w - 1 ||
        y === h - 1 ||
        !solid(p - 1) ||
        !solid(p + 1) ||
        !solid(p - w) ||
        !solid(p + w);
      if (outer && inBand(p)) {
        peeled[p] = 1;
        stack.push(p);
      }
    }
    while (stack.length > 0) {
      const p = stack.pop()!;
      const x = p % w;
      const next = [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w];
      for (const q of next)
        if (q >= 0 && q < n && !peeled[q] && label[q] === start && inBand(q)) {
          peeled[q] = 1;
          stack.push(q);
        }
    }

    // The container's own color also where the band cannot reach it: in
    // the counter of a letter on the box (the bowl of a P), which would
    // otherwise read as a mark inside that letter in the next round.
    const color: Rgb = [0, 0, 0];
    let count = 0;
    for (const p of pixels)
      if (peeled[p]) {
        count++;
        for (let c = 0; c < 3; c++) color[c] += px[p * 4 + c]!;
      }
    for (let c = 0; c < 3; c++) color[c] /= count;
    for (const p of pixels)
      if (
        !peeled[p] &&
        inBand(p) &&
        distance(px, p * 4, color) < KEY_NEAR * 1.5
      )
        peeled[p] = 1;

    const from = bandIsDark ? darkMean : lightMean;
    const to = bandIsDark ? lightMean : darkMean;
    const fade = (p: number) =>
      smoothstep(0.3, 0.7, (lum[p]! - from) / (to - from));

    // Only one part of the logo: keep the badge, cut out what it holds.
    const part =
      total - pixels.length >= pixels.length * PART_OUTSIDE &&
      shapeRight - shapeLeft + 1 <= logoWidth * PART_WIDTH;
    if (part) {
      for (const p of pixels)
        if (!peeled[p]) alpha[p] = alpha[p]! * (1 - fade(p));
      changed = true;
      continue;
    }

    // Fade the container out, soft across its edge: its own pixels and the
    // ones right next to it fade by how close they are to its tone.
    // The faint, anti-aliased rim just outside the shape goes with it.
    const near = (p: number) => {
      const x = p % w;
      return (
        peeled[p] ||
        (x > 0 && peeled[p - 1]) ||
        (x < w - 1 && peeled[p + 1]) ||
        (p >= w && peeled[p - w]) ||
        (p + w < n && peeled[p + w])
      );
    };
    const rim: number[] = [];
    for (const p of pixels) {
      if (!peeled[p]) continue;
      const x = p % w;
      for (const q of [
        x > 0 ? p - 1 : -1,
        x < w - 1 ? p + 1 : -1,
        p - w,
        p + w,
      ])
        if (q >= 0 && q < n && alpha[q]! > 0 && !solid(q)) rim.push(q);
    }
    for (const p of pixels) if (near(p)) alpha[p] = alpha[p]! * fade(p);
    for (const q of new Set(rim)) alpha[q] = alpha[q]! * fade(q);
    changed = true;
  }
  return changed;
}

/**
 * Steps 1 to 3 on the pixels of one logo, in place. Exported so it can
 * run on its own, without an image element or the page around it.
 */
export function toneData(data: ImageData, ice: Rgb): void {
  const { width: w, height: h } = data;
  const px = data.data;
  const alpha = new Float32Array(w * h);
  for (let p = 0; p < alpha.length; p++) alpha[p] = px[p * 4 + 3]! / 255;

  // 1. The ground along the image's edge.
  const ground = evenColor(px, alpha, edge(0, 0, w - 1, h - 1, w), 0.6);
  if (ground) keyOut(px, alpha, ground);

  // 2. Boxes, badges and sticker outlines.
  const lum = new Float32Array(w * h);
  for (let p = 0; p < lum.length; p++)
    lum[p] =
      (0.299 * px[p * 4]! + 0.587 * px[p * 4 + 1]! + 0.114 * px[p * 4 + 2]!) /
      255;
  for (let round = 0; round < 3 && peel(px, lum, alpha, w, h); round++);

  // 3. Tone: neutral parts white, colored parts ice blue. Chroma rather
  // than saturation, so a near black with a tint still counts as black.
  for (let p = 0; p < alpha.length; p++) {
    const i = p * 4;
    const a = alpha[p]!;
    if (a <= 0.01) {
      px[i + 3] = 0;
      continue;
    }
    const r = px[i]!;
    const g = px[i + 1]!;
    const b = px[i + 2]!;
    const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
    const white = 1 - smoothstep(0.12, 0.42, chroma);
    px[i] = ice[0] + (255 - ice[0]) * white;
    px[i + 1] = ice[1] + (255 - ice[1]) * white;
    px[i + 2] = ice[2] + (255 - ice[2]) * white;
    px[i + 3] = a * 255;
  }
}

/** The smallest box around every visible pixel, with one pixel to spare. */
function bounds(
  data: ImageData,
): { x: number; y: number; w: number; h: number } | null {
  const { width: w, height: h, data: px } = data;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (px[(y * w + x) * 4 + 3]! > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) return null;
  x0 = Math.max(0, x0 - 1);
  y0 = Math.max(0, y0 - 1);
  x1 = Math.min(w - 1, x1 + 1);
  y1 = Math.min(h - 1, y1 + 1);
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * The box around the mark in the untouched file: everything that is not its
 * even ground (a white or colored edge) and not transparent.
 */
function markBounds(
  data: ImageData,
): { x: number; y: number; w: number; h: number } | null {
  const { width: w, height: h, data: px } = data;
  const alpha = new Float32Array(w * h);
  for (let p = 0; p < alpha.length; p++) alpha[p] = px[p * 4 + 3]! / 255;
  const ground = evenColor(px, alpha, edge(0, 0, w - 1, h - 1, w), 0.6);
  const marks = new ImageData(w, h);
  for (let p = 0; p < alpha.length; p++) {
    const visible =
      alpha[p]! > 0.03 && (!ground || distance(px, p * 4, ground) > KEY_NEAR);
    marks.data[p * 4 + 3] = visible ? 255 : 0;
  }
  return bounds(marks);
}

/** A canvas cut to a box, as a blob URL. */
async function cropUrl(
  source: HTMLCanvasElement,
  box: { x: number; y: number; w: number; h: number },
): Promise<string | null> {
  let out = source;
  if (box.w < source.width || box.h < source.height) {
    out = document.createElement("canvas");
    out.width = box.w;
    out.height = box.h;
    out
      .getContext("2d")
      ?.drawImage(source, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  }
  const blob = await new Promise<Blob | null>((resolve) =>
    out.toBlob(resolve, "image/png"),
  );
  return blob ? URL.createObjectURL(blob) : null;
}

async function tone(img: HTMLImageElement, ice: Rgb): Promise<boolean> {
  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;
  if (!sourceWidth || !sourceHeight) return false;
  const scale = Math.min(1, MAX_WIDTH / sourceWidth, MAX_HEIGHT / sourceHeight);
  const w = Math.max(1, Math.round(sourceWidth * scale));
  const h = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  ctx.drawImage(img, 0, 0, w, h);
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, w, h);
  } catch {
    return false; // A file from another origin taints the canvas.
  }
  // The untouched pixels, for the real logo on the card.
  const original = document.createElement("canvas");
  original.width = w;
  original.height = h;
  original.getContext("2d")?.drawImage(canvas, 0, 0);
  const realBox = markBounds(data);

  toneData(data, ice);
  ctx.putImageData(data, 0, 0);

  // Trim the empty margin the file came with, so every mark fills its
  // cell the same way and the area sizing (--ar) measures the mark itself.
  // The real logo on the card is trimmed the same way, around its mark and
  // any box of its own.
  const box = bounds(data);
  if (!box) return false;
  const url = await cropUrl(canvas, box);
  if (!url) return false;
  const tile = img.closest<HTMLElement>(".tier-logo");
  const real = tile?.querySelector<HTMLImageElement>(".tier-real");
  const realUrl = real && realBox ? await cropUrl(original, realBox) : null;
  if (tile && !tile.dataset.partnerLogo) {
    tile.dataset.partnerLogo = img.currentSrc || img.src;
    tile.dataset.partnerLogoWidth = String(sourceWidth);
    tile.dataset.partnerLogoHeight = String(sourceHeight);
  }
  img.removeAttribute("srcset");
  img.src = url;
  img.width = box.w;
  img.height = box.h;
  await img.decode().catch(() => undefined);
  tile?.style.setProperty("--ar", (box.w / box.h).toFixed(3));
  if (real && realBox && realUrl) {
    real.removeAttribute("srcset");
    real.loading = "eager";
    real.src = realUrl;
    real.width = realBox.w;
    real.height = realBox.h;
    real.style.setProperty("--real-ar", (realBox.w / realBox.h).toFixed(3));
    await real.decode().catch(() => undefined);
  }
  tile?.setAttribute("data-toned", "");
  return true;
}

export function initLogoTone(root: HTMLElement): void {
  const ice =
    parseColor(getComputedStyle(root).getPropertyValue("--color-ticket-ice")) ??
    ([187, 228, 255] as Rgb);
  const images = [
    ...root.querySelectorAll<HTMLImageElement>(
      ".tier-logo[data-tone] .tier-mark",
    ),
  ];
  if (images.length === 0 || typeof IntersectionObserver === "undefined")
    return;

  const queue: HTMLImageElement[] = [];
  let running = false;
  const idle =
    window.requestIdleCallback ??
    ((fn: () => void) => window.setTimeout(fn, 16));

  function pump(): void {
    if (running) return;
    const img = queue.shift();
    if (!img) return;
    running = true;
    idle(() => {
      void run(img);
    });
  }

  async function run(img: HTMLImageElement): Promise<void> {
    try {
      if (!img.complete) await img.decode();
      await tone(img, ice);
    } catch {
      // Keep the CSS tone for this one.
    }
    running = false;
    pump();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        queue.push(entry.target as HTMLImageElement);
      }
      pump();
    },
    { rootMargin: "600px 0px" },
  );
  images.forEach((img) => observer.observe(img));
}
