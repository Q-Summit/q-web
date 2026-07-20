#!/usr/bin/env node
/**
 * Seed wrangler's local R2 simulation from apps/web/public/media (or
 * dist/media) WITHOUT MinIO. Used by the Lighthouse CF loop so media is
 * served by the real Worker + Cache API path, matching production topology
 * (see apps/web/wrangler.jsonc, worker/index.ts).
 *
 * Full CMS media flow still uses `pnpm r2:sync` (MinIO -> R2). This is the
 * lighter path when Docker/MinIO is not up: public/media is already the
 * local seed tree.
 *
 * Idempotent via apps/web/.wrangler/lh-r2-manifest.json (size-based skip).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WEB_DIR } from "../lib/paths.mjs";
import { extensionContentType } from "../../apps/web/worker/media-content-types.mjs";

const BUCKET = "qweb-media";
const MANIFEST_PATH = path.join(WEB_DIR, ".wrangler", "lh-r2-manifest.json");

function walkFiles(dir, root = dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(abs, root, out);
    else if (entry.isFile()) {
      out.push({
        abs,
        key: path.relative(root, abs).split(path.sep).join("/"),
      });
    }
  }
  return out;
}

function resolveSourceDir() {
  const publicMedia = path.join(WEB_DIR, "public", "media");
  const distMedia = path.join(WEB_DIR, "dist", "media");
  if (fs.existsSync(publicMedia)) return publicMedia;
  if (fs.existsSync(distMedia)) return distMedia;
  return null;
}

const IMAGE_EXT = new Set([
  ".avif",
  ".webp",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
]);

/**
 * @param {{ sourceDir?: string, quiet?: boolean, imagesOnly?: boolean }} [opts]
 * @returns {{ uploaded: number, skipped: number, failed: number, sourceDir: string | null }}
 */
export function seedLocalR2(opts = {}) {
  const sourceDir = opts.sourceDir ?? resolveSourceDir();
  if (!sourceDir) {
    return { uploaded: 0, skipped: 0, failed: 0, sourceDir: null };
  }

  const wranglerCli = path.resolve(
    WEB_DIR,
    "node_modules/wrangler/wrangler-dist/cli.js",
  );
  if (!fs.existsSync(wranglerCli)) {
    throw new Error(
      "seed-local-r2: apps/web wrangler not found. Run `pnpm install` first.",
    );
  }

  let manifest = {};
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    } catch {
      manifest = {};
    }
  }

  let files = walkFiles(sourceDir);
  if (opts.imagesOnly) {
    files = files.filter((f) =>
      IMAGE_EXT.has(path.extname(f.key).toLowerCase()),
    );
  }
  if (!opts.quiet) {
    console.error(
      `seed-local-r2: ${files.length} file(s) to consider` +
        `${opts.imagesOnly ? " (images only)" : ""} -- first run can take several minutes.`,
    );
  }
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;
  let processed = 0;

  for (const { abs, key } of files) {
    processed += 1;
    const { size } = fs.statSync(abs);
    const cached = manifest[key];
    if (cached && cached.size === size) {
      skipped += 1;
      continue;
    }

    const contentType = extensionContentType(key) ?? "application/octet-stream";
    const put = spawnSync(
      process.execPath,
      [
        wranglerCli,
        "r2",
        "object",
        "put",
        `${BUCKET}/${key}`,
        "--file",
        abs,
        "--local",
        "--content-type",
        contentType,
      ],
      { cwd: WEB_DIR, stdio: ["ignore", "pipe", "pipe"] },
    );

    if (put.status !== 0) {
      failed += 1;
      if (!opts.quiet) {
        const err =
          put.stderr?.toString().trim() ||
          put.stdout?.toString().trim() ||
          `exit ${put.status}`;
        console.error(`  seed-local-r2 FAILED ${key}: ${err}`);
      }
      continue;
    }

    manifest[key] = { size };
    uploaded += 1;
    if (!opts.quiet && (uploaded % 25 === 0 || processed === files.length)) {
      console.error(
        `seed-local-r2: ${processed}/${files.length} checked (uploaded ${uploaded}, skipped ${skipped}, failed ${failed})`,
      );
    }
  }

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  return { uploaded, skipped, failed, sourceDir };
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  try {
    const imagesOnly = process.argv.includes("--images-only");
    const result = seedLocalR2({ imagesOnly });
    if (!result.sourceDir) {
      console.log(
        "seed-local-r2: no public/media or dist/media -- nothing to upload.",
      );
      process.exit(0);
    }
    console.log(
      `seed-local-r2: from ${path.relative(WEB_DIR, result.sourceDir)}` +
        `${imagesOnly ? " (images only)" : ""} -- ` +
        `${result.uploaded} uploaded, ${result.skipped} skipped, ${result.failed} failed.`,
    );
    if (result.failed > 0) process.exit(1);
  } catch (err) {
    console.error(`seed-local-r2: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }
}
