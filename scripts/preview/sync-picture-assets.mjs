#!/usr/bin/env node
/**
 * Hardlink (or copy) image binaries from apps/web/public/media/ into
 * gitignored apps/web/src/assets/media/ so local builds can use Astro
 * <Picture> (avif/webp srcset) instead of plain /media/ <img> fallbacks.
 *
 * Prod/CI keep src/assets/media empty on purpose (AGENTS.md); this is a
 * local/opt-in step for lighthouse and for developers who want responsive
 * images in `astro build` / `make preview`. Safe to re-run; skips existing
 * same-size targets. Never touches committed `*.ts` path barrels.
 *
 * No-op (exit 0) when public/media is missing or empty of images.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WEB_DIR } from "../lib/paths.mjs";

const SRC = path.join(WEB_DIR, "public", "media");
const DEST = path.join(WEB_DIR, "src", "assets", "media");
const IMAGE_EXT = new Set([".avif", ".webp", ".png", ".jpg", ".jpeg"]);

function isImage(name) {
  return IMAGE_EXT.has(path.extname(name).toLowerCase());
}

function linkOrCopy(src, dest) {
  try {
    fs.linkSync(src, dest);
    return "link";
  } catch (err) {
    if (
      err &&
      (err.code === "EEXIST" || err.code === "EPERM" || err.code === "EXDEV")
    ) {
      fs.copyFileSync(src, dest);
      return "copy";
    }
    throw err;
  }
}

export function syncPictureAssets() {
  let entries;
  try {
    entries = fs.readdirSync(SRC, { withFileTypes: true });
  } catch {
    return { linked: 0, skipped: 0, missingSource: true };
  }

  fs.mkdirSync(DEST, { recursive: true });
  let linked = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !isImage(entry.name)) continue;
    const src = path.join(SRC, entry.name);
    const dest = path.join(DEST, entry.name);
    let destStat;
    try {
      destStat = fs.statSync(dest);
    } catch {
      destStat = null;
    }
    const srcStat = fs.statSync(src);
    if (destStat && destStat.size === srcStat.size) {
      skipped++;
      continue;
    }
    if (destStat) fs.unlinkSync(dest);
    linkOrCopy(src, dest);
    linked++;
  }

  return { linked, skipped, missingSource: false };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const result = syncPictureAssets();
  if (result.missingSource) {
    console.log(
      "sync-picture-assets: no apps/web/public/media/ (nothing to link; CI/prod leave src/assets/media empty).",
    );
    process.exit(0);
  }
  console.log(
    `sync-picture-assets: ${result.linked} linked/copied, ${result.skipped} already present under src/assets/media/.`,
  );
}
