// Package-dir media helpers for propose / upload-media.
// Binaries stay out of bundle.json (5 MiB JSON cap). Create-if-missing only.
import fs from "node:fs";
import path from "node:path";

const IMAGE_EXT = new Set([".webp", ".jpeg", ".jpg", ".png", ".avif", ".svg"]);

/**
 * @param {string} filename
 * @returns {string}
 */
export function inferAlt(filename) {
  const stem = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return stem || filename;
}

/**
 * @param {unknown} bundle
 * @returns {{ filename: string, alt?: string | null }[]}
 */
export function readMediaManifest(bundle) {
  const raw = bundle?.media?.manifest;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (row) => row && typeof row === "object" && typeof row.filename === "string",
  );
}

/**
 * Collect local image files to upload. Prefers package `media/` then extra dirs.
 * Manifest entries win when present; otherwise every image in those dirs.
 *
 * @param {{ packageDir: string, extraDirs?: string[], manifest?: { filename: string, alt?: string | null }[] }} opts
 * @returns {{ filename: string, alt: string, filePath: string }[]}
 */
export function collectMediaFiles(opts) {
  const extraDirs = opts.extraDirs ?? [];
  const searchDirs = [path.join(opts.packageDir, "media"), ...extraDirs];
  const byName = new Map();

  for (const dir of searchDirs) {
    if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      continue;
    }
    for (const name of fs.readdirSync(dir)) {
      if (name === "manifest.json" || name.startsWith(".")) continue;
      const ext = path.extname(name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      const filePath = path.join(dir, name);
      if (!fs.statSync(filePath).isFile()) continue;
      if (!byName.has(name)) {
        byName.set(name, filePath);
      }
    }
  }

  const manifest = opts.manifest ?? [];
  const wanted =
    manifest.length > 0
      ? manifest
      : [...byName.keys()].map((filename) => ({ filename }));

  /** @type {{ filename: string, alt: string, filePath: string }[]} */
  const out = [];
  for (const row of wanted) {
    const filename = path.basename(row.filename);
    const filePath = byName.get(filename);
    if (!filePath) continue;
    const alt =
      typeof row.alt === "string" && row.alt.trim()
        ? row.alt.trim()
        : inferAlt(filename);
    out.push({ filename, alt, filePath });
  }
  return out;
}

/**
 * @param {{ cmsUrl: string, token: string, actor: string, filePath: string, filename: string, alt: string, dryRun?: boolean }} opts
 */
export async function uploadMediaFile(opts) {
  const url = new URL("/api/content-sync/media", opts.cmsUrl);
  if (opts.dryRun) url.searchParams.set("dryRun", "1");

  const bytes = fs.readFileSync(opts.filePath);
  const form = new FormData();
  form.set(
    "file",
    new Blob([bytes], { type: mimeFor(opts.filename) }),
    opts.filename,
  );
  form.set("alt", opts.alt);
  form.set("filename", opts.filename);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "X-Content-Sync-Actor": opts.actor,
    },
    body: form,
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  return { ok: res.ok, status: res.status, parsed };
}

function mimeFor(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".avif") return "image/avif";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}
