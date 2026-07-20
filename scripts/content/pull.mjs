#!/usr/bin/env node
// make pull / content:pull: published REST → content package (no Neon, no sync token).
// Optional --import loads the package into local Docker as drafts.
// Not ops:mirror-db (that dumps Neon). See docs/dev/content-sync.md.
import fs from "node:fs";
import path from "node:path";

import { argValue, hasFlag, parseList } from "../lib/args.mjs";
import { parseEnvFile, requireEnvKeys, resolveEnvValue } from "../lib/env.mjs";
import { CMS_ENV_REMOTE, REPO_ROOT } from "../lib/paths.mjs";
import { runCommandSync } from "../lib/run.mjs";
import {
  DEFAULT_PACKAGE_DIR,
  MAX_PACKAGE_DOCS,
  SYNC_COLLECTIONS,
  SYNC_DENY,
  SYNC_GLOBALS,
} from "./sync-scope.mjs";

const remoteEnv = parseEnvFile(CMS_ENV_REMOTE);
try {
  requireEnvKeys("content:pull", ["REMOTE_CMS_URL"], process.env, remoteEnv);
} catch (error) {
  console.error(error.message);
  console.error(
    "  content:pull needs REMOTE_CMS_URL in apps/cms/.env.remote " +
      "(not required for local make dev).",
  );
  process.exit(1);
}
const cmsUrl = resolveEnvValue(
  "REMOTE_CMS_URL",
  process.env,
  remoteEnv,
).replace(/\/$/, "");

function assertPullScope(slugs, { kind, allow, deny }) {
  for (const slug of slugs) {
    if (deny.includes(slug)) {
      throw new Error(`content:pull: denied ${kind} "${slug}" (SYNC_DENY)`);
    }
    if (!allow.includes(slug)) {
      throw new Error(
        `content:pull: unknown or non-allowlisted ${kind} "${slug}" (see scripts/content/sync-scope.mjs)`,
      );
    }
  }
}

function stripDoc(doc) {
  if (!doc || typeof doc !== "object") return doc;
  // Deliberately not identical to the CMS-side lists (serialize.ts STRIP_KEYS,
  // force-draft.ts STRIP_ON_INGEST): pull drops `_status` so the package
  // re-ingests as draft, while the CMS lists drop `deletedAt` instead. Ingest
  // re-strips system fields either way, so do not "sync" these lists.
  const STRIP = new Set([
    "id",
    "createdAt",
    "updatedAt",
    "_status",
    "sizes",
    "url",
    "thumbnailURL",
    "width",
    "height",
    "filesize",
    "mimeType",
    "focalX",
    "focalY",
    "prefix",
  ]);
  // Nested non-media objects keep `url`: after the media-ref conversion it is
  // content (Lexical link `fields.url`), and dropping it breaks links.
  const NESTED_STRIP = new Set([...STRIP].filter((k) => k !== "url"));
  const walk = (value, strip) => {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map((v) => walk(v, strip));
    if (typeof value !== "object") return value;
    const obj = value;
    if (
      typeof obj.filename === "string" &&
      ("url" in obj || "mimeType" in obj)
    ) {
      return { filename: obj.filename, alt: obj.alt ?? undefined };
    }
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (strip.has(k)) continue;
      out[k] = walk(v, NESTED_STRIP);
    }
    return out;
  };
  return walk(doc, STRIP);
}

/**
 * Walk an already-stripped doc/global collecting the `{filename, alt}`
 * media refs stripDoc() leaves behind, deduplicated by filename. Mirrors
 * apps/cms/src/bin/export-package.ts's collectMedia so a pulled package's
 * media/manifest.json reflects the media it actually references instead of
 * always being an empty stub.
 * @param {unknown} value
 * @param {Set<string>} seen
 * @param {{ filename: string, alt?: string | null }[]} out
 */
function collectMediaRefs(value, seen, out) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectMediaRefs(item, seen, out);
    return;
  }
  const obj = value;
  if (typeof obj.filename === "string") {
    if (!seen.has(obj.filename)) {
      seen.add(obj.filename);
      out.push({ filename: obj.filename, alt: obj.alt ?? undefined });
    }
    return;
  }
  for (const v of Object.values(obj)) collectMediaRefs(v, seen, out);
}

async function fetchPublishedDocs(collection) {
  const docs = [];
  let page = 1;
  for (;;) {
    const url = new URL(`/api/${collection}`, cmsUrl);
    url.searchParams.set("limit", "200");
    url.searchParams.set("depth", "1");
    url.searchParams.set("page", String(page));
    url.searchParams.set("where[_status][equals]", "published");
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GET ${url.pathname} failed: ${res.status}`);
    }
    const body = await res.json();
    docs.push(...(body.docs ?? []).map(stripDoc));
    if (!body.hasNextPage) break;
    page += 1;
  }
  return docs;
}

async function fetchGlobal(slug) {
  const url = new URL(`/api/globals/${slug}`, cmsUrl);
  url.searchParams.set("depth", "1");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url.pathname} failed: ${res.status}`);
  }
  return stripDoc(await res.json());
}

const collections = parseList(argValue("--collections"), SYNC_COLLECTIONS);
const globals = parseList(argValue("--globals"), [], SYNC_GLOBALS);
assertPullScope(collections, {
  kind: "collection",
  allow: SYNC_COLLECTIONS,
  deny: SYNC_DENY,
});
assertPullScope(globals, {
  kind: "global",
  allow: SYNC_GLOBALS,
  deny: SYNC_DENY,
});
const outRel = argValue("--out") ?? DEFAULT_PACKAGE_DIR;
const outDir = path.isAbsolute(outRel) ? outRel : path.join(REPO_ROOT, outRel);

// bundle.json is the only file propose reads. The per-collection/global
// sidecar JSONs under collections/ and globals/ are a browsing convenience
// only; editing them without also updating bundle.json silently has no
// effect on propose. Default to not writing them so that trap does not
// exist by default; pass --sidecars to opt in for humans who want to browse
// per-slug files (see docs/dev/content-sync.md).
const writeSidecars = hasFlag("--sidecars");

fs.mkdirSync(outDir, { recursive: true });
if (writeSidecars) {
  fs.mkdirSync(path.join(outDir, "collections"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "globals"), { recursive: true });
}
fs.mkdirSync(path.join(outDir, "media"), { recursive: true });

const packageCollections = {};
for (const slug of collections) {
  process.stdout.write(`pull: ${slug}… `);
  const docs = await fetchPublishedDocs(slug);
  packageCollections[slug] = docs;
  if (writeSidecars) {
    fs.writeFileSync(
      path.join(outDir, "collections", `${slug}.json`),
      `${JSON.stringify(docs, null, 2)}\n`,
    );
  }
  console.log(`${docs.length} docs`);
}

const packageGlobals = {};
for (const slug of globals) {
  process.stdout.write(`pull: global ${slug}… `);
  const doc = await fetchGlobal(slug);
  packageGlobals[slug] = doc;
  if (writeSidecars) {
    fs.writeFileSync(
      path.join(outDir, "globals", `${slug}.json`),
      `${JSON.stringify(doc, null, 2)}\n`,
    );
  }
  console.log("ok");
}

const meta = {
  version: 1,
  exportedAt: new Date().toISOString(),
  source: "remote-published",
  scope: {
    collections: Object.keys(packageCollections),
    globals: Object.keys(packageGlobals),
  },
};

// Build the media manifest from what the pulled docs actually reference
// (same shape/approach as apps/cms/src/bin/export-package.ts's collectMedia),
// instead of always writing an empty stub: stripDoc() already collapsed every
// upload relation into an inline {filename, alt} ref, so walk the final
// collection/global docs and dedupe by filename.
const mediaManifest = [];
const seenMedia = new Set();
for (const docs of Object.values(packageCollections)) {
  for (const doc of docs) collectMediaRefs(doc, seenMedia, mediaManifest);
}
for (const doc of Object.values(packageGlobals)) {
  collectMediaRefs(doc, seenMedia, mediaManifest);
}

const bundle = {
  package: meta,
  collections: packageCollections,
  globals: packageGlobals,
  media: { manifest: mediaManifest },
};

fs.writeFileSync(
  path.join(outDir, "package.json"),
  `${JSON.stringify(meta, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(outDir, "media", "manifest.json"),
  `${JSON.stringify(mediaManifest, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(outDir, "bundle.json"),
  `${JSON.stringify(bundle, null, 2)}\n`,
);

console.log(`\nPulled published package to ${outDir}`);
console.log(`  media refs: ${mediaManifest.length}`);
console.log("Live site unchanged. This was read-only.");

const pulledDocCount =
  Object.values(packageCollections).reduce((n, docs) => n + docs.length, 0) +
  Object.keys(packageGlobals).length;
if (pulledDocCount > MAX_PACKAGE_DOCS) {
  console.warn(
    `content:pull: bundle holds ${pulledDocCount} docs; propose rejects over ` +
      `${MAX_PACKAGE_DOCS}. Re-pull scoped: --collections <a,b> / --globals <c>.`,
  );
}

if (hasFlag("--import")) {
  console.log("content:pull: --import into local drafts...");
  process.exit(
    runCommandSync("node", ["scripts/content/import.mjs", "--dir", outDir], {
      cwd: REPO_ROOT,
    }),
  );
}
