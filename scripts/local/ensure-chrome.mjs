#!/usr/bin/env node
/**
 * Idempotent Chrome-for-Testing install for local Lighthouse.
 *
 * Devs never need a system Google Chrome: `pnpm run setup` (and
 * `pnpm run lighthouse`) call this, which downloads a pinned-stable build
 * into gitignored `.browsers/` via `@puppeteer/browsers`.
 *
 * Prints the executable path on stdout (last line) so other scripts can
 * capture it; human-readable status goes to stderr.
 *
 * Override: set CHROME_PATH to any Chrome/Chromium binary to skip download.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  Browser,
  BrowserTag,
  computeExecutablePath,
  detectBrowserPlatform,
  getInstalledBrowsers,
  install,
  resolveBuildId,
} from "@puppeteer/browsers";

import { REPO_ROOT } from "../lib/paths.mjs";

export const BROWSERS_CACHE_DIR = path.join(REPO_ROOT, ".browsers");

/**
 * Resolve a usable Chrome binary. Installs Chrome-for-Testing into
 * `.browsers/` when CHROME_PATH is unset and no matching build is cached.
 */
export async function ensureChrome() {
  const override = process.env.CHROME_PATH?.trim();
  if (override) {
    if (!fs.existsSync(override)) {
      throw new Error(
        `CHROME_PATH is set to ${override}, but that file does not exist.`,
      );
    }
    return override;
  }

  const platform = detectBrowserPlatform();
  if (!platform) {
    throw new Error(
      "Could not detect OS/arch for Chrome-for-Testing. Set CHROME_PATH to a Chrome or Chromium binary instead.",
    );
  }

  const buildId = await resolveBuildId(
    Browser.CHROME,
    platform,
    BrowserTag.STABLE,
  );
  const executablePath = computeExecutablePath({
    browser: Browser.CHROME,
    buildId,
    cacheDir: BROWSERS_CACHE_DIR,
    platform,
  });

  if (fs.existsSync(executablePath)) {
    return executablePath;
  }

  // Re-check installed browsers in case the cache layout differs slightly.
  const installed = await getInstalledBrowsers({
    cacheDir: BROWSERS_CACHE_DIR,
  });
  const match = installed.find(
    (b) =>
      b.browser === Browser.CHROME &&
      b.buildId === buildId &&
      fs.existsSync(b.executablePath),
  );
  if (match) return match.executablePath;

  console.error(
    `ensure-chrome: downloading Chrome-for-Testing ${buildId} into .browsers/ (one-time, ~150 MB)…`,
  );
  fs.mkdirSync(BROWSERS_CACHE_DIR, { recursive: true });
  const result = await install({
    browser: Browser.CHROME,
    buildId,
    cacheDir: BROWSERS_CACHE_DIR,
    platform,
    unpack: true,
  });
  if (!fs.existsSync(result.executablePath)) {
    throw new Error(
      `ensure-chrome: install reported ${result.executablePath}, but the binary is missing.`,
    );
  }
  console.error(`ensure-chrome: installed ${result.executablePath}`);
  return result.executablePath;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  try {
    const chromePath = await ensureChrome();
    console.error(`ensure-chrome: OK (${chromePath})`);
    console.log(chromePath);
  } catch (err) {
    console.error(`ensure-chrome: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}
