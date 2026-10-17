#!/usr/bin/env node
// ground:poster: render the still posters of the /hackathon ground shader
// (apps/web/src/components/hackathon/ground-gl.ts) at its start frame and
// write them as small WebP files next to the component. The page shows
// them before the live shader draws, and without WebGL or JavaScript, so
// they must be regenerated whenever the shader or its colors change.
//
// Needs the Astro dev server (make dev-web) for the shader module and the
// color tokens. Runs in the Chrome-for-Testing from setup:chrome (or
// CHROME_PATH), or in an installed browser channel. Usage:
//   pnpm ground:poster [-- --url http://localhost:4321] [--channel msedge]
/* global document, getComputedStyle -- used inside page.evaluate (browser) */
import { createRequire } from "node:module";
import path from "node:path";
import { argValue } from "../lib/args.mjs";
import { REPO_ROOT } from "../lib/paths.mjs";
import { ensureChrome } from "./ensure-chrome.mjs";

const webRequire = createRequire(path.join(REPO_ROOT, "apps/web/package.json"));
const { chromium } = webRequire("@playwright/test");
const sharp = webRequire("sharp");

const base = argValue("--url") ?? "http://localhost:4321";
const channel = argValue("--channel");
const outDir = path.join(REPO_ROOT, "apps/web/src/components/hackathon");

// Wide covers landscape screens up to 2.4:1 (fitted to the height), tall
// covers portrait screens up to 1:2.4 (fitted to the width), matching the
// shader's own scaling by the shorter side. The small copies are inlined
// into the CSS by the build, so they are there at the very first paint.
const POSTERS = [
  { name: "ground-poster-wide", w: 960, h: 400, quality: 72 },
  { name: "ground-poster-tall", w: 320, h: 768, quality: 72 },
  { name: "ground-poster-wide-lqip", w: 96, h: 40, quality: 80, blur: 0.8 },
  { name: "ground-poster-tall-lqip", w: 32, h: 77, quality: 80, blur: 0.8 },
];

try {
  const res = await fetch(`${base}/hackathon/`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
} catch (error) {
  console.error(
    `ground:poster: ${base}/hackathon/ is not reachable (${error.message}). Start make dev-web first.`,
  );
  process.exit(1);
}

const browser = await chromium.launch(
  channel ? { channel } : { executablePath: await ensureChrome() },
);
try {
  const page = await browser.newPage();
  await page.goto(`${base}/hackathon/`, { waitUntil: "networkidle" });
  for (const poster of POSTERS) {
    const b64 = await page.evaluate(
      async ({ w, h }) => {
        const gl = await import("/src/components/hackathon/ground-gl.ts");
        const css = getComputedStyle(document.documentElement);
        const token = (name) => gl.hexToRgb(css.getPropertyValue(name));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("webgl", {
          ...gl.CONTEXT_OPTIONS,
          preserveDrawingBuffer: true,
        });
        if (!ctx) throw new Error("no WebGL in this browser");
        const ground = gl.createGround(ctx, {
          ink: token("--color-hack-ink"),
          deep: token("--color-hack-deep"),
          violet: token("--color-hack-violet"),
          mid: token("--color-hack-mid"),
          glow: token("--color-hack-glow"),
          haze: token("--color-hack-haze"),
        });
        if (!ground) throw new Error("shader did not compile");
        ground.resize(w, h);
        ground.draw(gl.START_TIME);
        return canvas.toDataURL("image/png").split(",")[1];
      },
      { w: poster.w, h: poster.h },
    );
    const file = path.join(outDir, `${poster.name}.webp`);
    // The small copies are softened first: upscaled by the browser, their
    // compression blocks would otherwise show.
    let image = sharp(Buffer.from(b64, "base64"));
    if (poster.blur) image = image.blur(poster.blur);
    const info = await image
      .webp({ quality: poster.quality, effort: 6, smartSubsample: true })
      .toFile(file);
    console.log(
      `ground:poster: ${path.relative(REPO_ROOT, file)} ${info.width}x${info.height} ${(info.size / 1024).toFixed(1)} KB`,
    );
  }
} finally {
  await browser.close();
}
