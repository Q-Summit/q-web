#!/usr/bin/env node
/**
 * Performance-budget gate for the built site, dependency-free (plain fs).
 * Machine enforcement for quality goal Q1
 * (docs/architecture/10-quality-requirements.md): "no multi-MB assets ship"
 * and the 1600x900 / under-300 KB share-image rule from apps/web/AGENTS.md.
 * Lighthouse itself is the local/opt-in half of Q1 (`make lighthouse`); this
 * check guards the two parts of Q1 a script can measure honestly in CI.
 *
 * The orchestrator wires this into `check:web:build` (build, then budgets), so
 * it always runs against a fresh apps/web/dist. Run directly with
 * `node scripts/check/budgets.mjs` after a build.
 *
 * Two checks, each independently reported:
 *
 *  A. assets        Every file that ships as a Cloudflare static asset is at
 *                   or under a per-file cap. "Ships as a static asset" means
 *                   everything under dist/ EXCEPT the paths in dist/.assetsignore,
 *                   which is exactly the set Wrangler uploads. The one entry
 *                   today is `media`: dist/media/ is the ~80MB scrape copy of
 *                   the media library (hero video up to 13.7 MiB), served by
 *                   the Worker from the R2 binding, never uploaded as a static
 *                   asset (apps/web/public/.assetsignore, run_worker_first in
 *                   wrangler.jsonc). Counting those 13 MiB videos here would
 *                   measure bytes that do not ship as static assets. If a
 *                   future edit drops `media` from .assetsignore, those files
 *                   WOULD ship as static assets and this check would fail on
 *                   them, which is the correct behavior.
 *
 *                   Cap: 1.5 MiB. On a real build the largest shipped static
 *                   asset is ~360 KiB (an optimized _astro JPEG); the next are
 *                   the ~324 KiB HLS shim and a handful of ~230 KiB images. So
 *                   1.5 MiB is roughly 4x the current max: comfortable headroom
 *                   for legitimate growth, tight enough to catch any multi-MB
 *                   static asset regression. No asset needs an allowlist entry.
 *
 *  B. share-images  Every Open Graph share image the built HTML points at is
 *                   exactly 1600x900 and at most 300 KB. The set is discovered
 *                   from the rendered `og:image` meta tags (Base.astro's default
 *                   /media/hero-poster.jpg plus per-page overrides such as
 *                   /hackathon's /media/hack-poster.jpg), so a new page override
 *                   is covered automatically. Dimensions come from the JPEG SOF
 *                   marker, parsed here with no dependency; Base.astro hardcodes
 *                   og:image:type=image/jpeg and 1600x900, so a non-JPEG or a
 *                   wrong-size image is a real card regression.
 *
 *                   Target is dist/ (the post-build artifact, whose bytes are
 *                   what R2 serves), unified with the DIST_DIR / --dist override
 *                   below. Media binaries are gitignored (prod truth is R2), so
 *                   a plain CI build has an empty dist/media/. A share image
 *                   that the HTML references but that is absent from this build
 *                   is reported as skipped, not failed, so CI (no media seed)
 *                   stays green while a build that DOES include media (local
 *                   pre-push, the go-live build) is fully enforced.
 *
 * DIST_DIR (env) or --dist <path> overrides the target so tests can point at a
 * fixture; default is apps/web/dist. A missing target fails with a build-first
 * message.
 */
import fs from "node:fs";
import path from "node:path";

import { argValue } from "../lib/args.mjs";
import { REPO_ROOT, WEB_DIR } from "../lib/paths.mjs";

// 1.5 MiB per-file cap for shipped static assets (see header for the numbers).
const ASSET_BUDGET_BYTES = 1.5 * 1024 * 1024;
// 300 KB share-image cap. Binary KiB to match the asset budget's MiB unit;
// apps/web/AGENTS.md states the same "under ~300 KB" rule.
const SHARE_MAX_BYTES = 300 * 1024;
const SHARE_WIDTH = 1600;
const SHARE_HEIGHT = 900;

const problems = [];
const err = (check, msg) => problems.push(`[${check}] ${msg}`);
const rel = (abs) => {
  const r = path.relative(REPO_ROOT, abs).split(path.sep).join("/");
  return r.startsWith("..") ? abs : r;
};
const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

/** Target dist: --dist flag wins over DIST_DIR env wins over apps/web/dist. */
function resolveDist() {
  const flag = argValue("--dist");
  const chosen = flag ?? process.env.DIST_DIR;
  if (chosen) return path.resolve(REPO_ROOT, chosen);
  return path.join(WEB_DIR, "dist");
}

/** Every regular file under dir, with its POSIX path relative to root. Symlinks skipped. */
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
    else if (entry.isFile())
      out.push({
        abs,
        distRel: path.relative(root, abs).split(path.sep).join("/"),
      });
  }
  return out;
}

/**
 * Entries of dist/.assetsignore (the paths Wrangler must NOT upload as static
 * assets). Not a full gitignore engine: it matches the current contract, a
 * top-level directory or file name (the sole entry is `media`). If the file
 * ever grows globs or nested patterns, revisit this.
 */
function assetsIgnoreEntries(distDir) {
  let text;
  try {
    text = fs.readFileSync(path.join(distDir, ".assetsignore"), "utf8");
  } catch {
    return [];
  }
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.replace(/^\/+|\/+$/g, ""));
}

const isIgnored = (distRel, entries) =>
  entries.some((entry) => distRel === entry || distRel.startsWith(`${entry}/`));

/**
 * Frame size from a JPEG's first SOF marker, or null if none is found. Walks
 * the marker segments: standalone markers (SOI, EOI, RSTn, TEM) carry no
 * length, every other segment is a 2-byte big-endian length that includes
 * itself, and SOF0..SOF15 (0xC0..0xCF, minus DHT 0xC4, JPG 0xC8, DAC 0xCC)
 * hold precision(1), height(2), width(2).
 */
function jpegDimensions(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 3 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    if (marker === 0xff) {
      offset++; // run of 0xFF fill bytes before the real marker
      continue;
    }
    if (
      marker === 0xd8 ||
      marker === 0xd9 ||
      marker === 0x01 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      offset += 2; // no length payload
      continue;
    }
    const len = buf.readUInt16BE(offset + 2);
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      if (offset + 9 > buf.length) return null;
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + len;
  }
  return null;
}

// ---------------------------------------------------------------------------
// A. assets
// ---------------------------------------------------------------------------

function checkAssets(distDir) {
  const ignore = assetsIgnoreEntries(distDir);
  const shipped = walkFiles(distDir).filter(
    ({ distRel }) => !isIgnored(distRel, ignore),
  );

  const offenders = [];
  for (const { abs } of shipped) {
    const { size } = fs.statSync(abs);
    if (size > ASSET_BUDGET_BYTES) offenders.push({ abs, size });
  }
  offenders.sort((a, b) => b.size - a.size);
  for (const { abs, size } of offenders) {
    err(
      "assets",
      `${rel(abs)} is ${kib(size)}, over the 1.5 MiB (${kib(ASSET_BUDGET_BYTES)}) per-file budget.`,
    );
  }
  return { checked: shipped.length, offenders: offenders.length };
}

// ---------------------------------------------------------------------------
// B. share-images
// ---------------------------------------------------------------------------

/** Dist-relative paths of every og:image the built HTML points at. */
function shareImagePaths(distDir) {
  const paths = new Set();
  const patterns = [
    /<meta\b[^>]*\bproperty=["']og:image["'][^>]*\bcontent=["']([^"']+)["']/gi,
    /<meta\b[^>]*\bcontent=["']([^"']+)["'][^>]*\bproperty=["']og:image["']/gi,
  ];
  for (const { abs, distRel } of walkFiles(distDir)) {
    if (!distRel.endsWith(".html")) continue;
    const html = fs.readFileSync(abs, "utf8");
    for (const re of patterns) {
      for (const match of html.matchAll(re)) {
        try {
          const pathname = new URL(match[1], "https://q-summit.com").pathname;
          const clean = decodeURIComponent(pathname).replace(/^\/+/, "");
          if (clean) paths.add(clean);
        } catch {
          // A non-URL content value is not a share image path; ignore it.
        }
      }
    }
  }
  return [...paths].sort();
}

function checkShareImages(distDir) {
  const paths = shareImagePaths(distDir);
  let validated = 0;
  const skipped = [];
  for (const distRel of paths) {
    const abs = path.join(distDir, distRel);
    let buf;
    try {
      buf = fs.readFileSync(abs);
    } catch {
      skipped.push(distRel); // referenced but absent (media is R2-backed, empty in CI)
      continue;
    }
    validated++;
    if (buf.length > SHARE_MAX_BYTES) {
      err(
        "share-images",
        `${rel(abs)} is ${kib(buf.length)}, over the 300 KB (${kib(SHARE_MAX_BYTES)}) share-image budget.`,
      );
    }
    const dims = jpegDimensions(buf);
    if (!dims) {
      err(
        "share-images",
        `${rel(abs)}: could not read JPEG dimensions; share images must be 1600x900 JPEGs (Base.astro sets og:image:type=image/jpeg).`,
      );
    } else if (dims.width !== SHARE_WIDTH || dims.height !== SHARE_HEIGHT) {
      err(
        "share-images",
        `${rel(abs)} is ${dims.width}x${dims.height}, not the required ${SHARE_WIDTH}x${SHARE_HEIGHT}.`,
      );
    }
  }
  return { validated, skipped };
}

// ---------------------------------------------------------------------------

const distDir = resolveDist();
let stat;
try {
  stat = fs.statSync(distDir);
} catch {
  stat = null;
}
if (!stat || !stat.isDirectory()) {
  console.error(
    `check-budgets: no build at ${rel(distDir)}. Run \`pnpm --filter web run build\` first (or point DIST_DIR / --dist at a build).`,
  );
  process.exit(1);
}

const assets = checkAssets(distDir);
const share = checkShareImages(distDir);

if (problems.length) {
  console.error(`check-budgets: ${problems.length} problem(s)\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    "\nBudget: docs/architecture/10-quality-requirements.md Q1 (Lighthouse mobile 90+, no multi-MB assets).",
  );
  process.exit(1);
}

const shareNote = share.skipped.length
  ? `${share.validated} share image(s) within budget (${share.skipped.length} referenced but absent from this build; media is R2-backed)`
  : `${share.validated} share image(s) are ${SHARE_WIDTH}x${SHARE_HEIGHT} JPEGs under 300 KB`;
console.log(
  `check-budgets: ${assets.checked} shipped asset(s) within the 1.5 MiB per-file budget; ${shareNote}.`,
);
