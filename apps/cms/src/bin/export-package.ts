/**
 * Export a scoped content package from the local CMS (payload run).
 * Flags: --collections speakers,jobs|all  --globals page-home|all  --out <dir>
 * Default: all sync collections, no globals.
 * Packages carry the latest published state only: local drafts are ignored
 * and never-published docs are skipped, so propose cannot leak unreviewed
 * local edits to the remote CMS.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";

import config from "../payload.config";
import { MAX_DOCS } from "../content-sync/apply-package";
import {
  isSyncCollection,
  isSyncGlobal,
  SYNC_COLLECTIONS,
  SYNC_GLOBALS,
} from "../content-sync/keys";
import { serializeDoc } from "../content-sync/serialize";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, "../../../..");

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function parseScope(
  raw: string | undefined,
  all: readonly string[],
  defaultAll: boolean,
): string[] {
  if (raw === undefined) return defaultAll ? [...all] : [];
  if (raw === "all") return [...all];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const run = async () => {
  const collectionSlugs = parseScope(
    argValue("--collections"),
    SYNC_COLLECTIONS,
    true,
  ).filter(isSyncCollection);
  const globalSlugs = parseScope(
    argValue("--globals"),
    SYNC_GLOBALS,
    false,
  ).filter(isSyncGlobal);

  const outRel = argValue("--out") ?? "scripts/content-packages/current";
  const outDir = path.isAbsolute(outRel) ? outRel : path.join(root, outRel);
  // bundle.json is the only file propose reads. The per-collection/global
  // sidecar JSONs under collections/ and globals/ are a browsing convenience
  // only; editing them without also updating bundle.json silently has no
  // effect on propose. Default to not writing them so that trap does not
  // exist by default; pass --sidecars to opt in for humans who want to browse
  // per-slug files (see docs/dev/content-sync.md). Mirrors scripts/content/pull.mjs.
  const writeSidecars = hasFlag("--sidecars");
  fs.mkdirSync(outDir, { recursive: true });
  if (writeSidecars) {
    fs.mkdirSync(path.join(outDir, "collections"), { recursive: true });
    fs.mkdirSync(path.join(outDir, "globals"), { recursive: true });
  }
  fs.mkdirSync(path.join(outDir, "media"), { recursive: true });

  const payload = await getPayload({ config });
  const mediaManifest: { filename: string; alt?: string | null }[] = [];
  const seenMedia = new Set<string>();

  const collectMedia = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(collectMedia);
      return;
    }
    const obj = value as Record<string, unknown>;
    if (typeof obj.filename === "string") {
      if (!seenMedia.has(obj.filename)) {
        seenMedia.add(obj.filename);
        mediaManifest.push({
          filename: obj.filename,
          alt:
            typeof obj.alt === "string" || obj.alt === null
              ? (obj.alt as string | null)
              : undefined,
        });
      }
      return;
    }
    Object.values(obj).forEach(collectMedia);
  };

  const packageCollections: Record<string, Record<string, unknown>[]> = {};
  let unpublishedSkipped = 0;
  for (const slug of collectionSlugs) {
    const docs: Record<string, unknown>[] = [];
    let page = 1;
    for (;;) {
      const res = await payload.find({
        collection: slug,
        limit: 100,
        page,
        depth: 1,
        draft: false,
        overrideAccess: true,
      });
      for (const doc of res.docs) {
        if ((doc as { _status?: string })._status !== "published") {
          unpublishedSkipped += 1;
          console.warn(
            `  skipped never-published ${slug} doc id=${(doc as { id?: unknown }).id}`,
          );
          continue;
        }
        const serialized = serializeDoc(
          doc as unknown as Record<string, unknown>,
        );
        collectMedia(serialized);
        docs.push(serialized);
      }
      if (!res.hasNextPage) break;
      page += 1;
    }
    packageCollections[slug] = docs;
    if (writeSidecars) {
      fs.writeFileSync(
        path.join(outDir, "collections", `${slug}.json`),
        `${JSON.stringify(docs, null, 2)}\n`,
      );
    }
  }

  const packageGlobals: Record<string, Record<string, unknown>> = {};
  for (const slug of globalSlugs) {
    const doc = await payload.findGlobal({
      slug,
      depth: 1,
      draft: false,
      overrideAccess: true,
    });
    if ((doc as { _status?: string })._status !== "published") {
      unpublishedSkipped += 1;
      console.warn(`  skipped never-published global ${slug}`);
      continue;
    }
    const serialized = serializeDoc(doc as unknown as Record<string, unknown>);
    collectMedia(serialized);
    packageGlobals[slug] = serialized;
    if (writeSidecars) {
      fs.writeFileSync(
        path.join(outDir, "globals", `${slug}.json`),
        `${JSON.stringify(serialized, null, 2)}\n`,
      );
    }
  }

  const meta = {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: "local",
    scope: {
      collections: Object.keys(packageCollections),
      globals: Object.keys(packageGlobals),
    },
  };

  fs.writeFileSync(
    path.join(outDir, "package.json"),
    `${JSON.stringify(meta, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, "media", "manifest.json"),
    `${JSON.stringify(mediaManifest, null, 2)}\n`,
  );

  const bundle = {
    package: meta,
    collections: packageCollections,
    globals: packageGlobals,
    media: { manifest: mediaManifest },
  };
  fs.writeFileSync(
    path.join(outDir, "bundle.json"),
    `${JSON.stringify(bundle, null, 2)}\n`,
  );

  console.log(`Exported package to ${outDir}`);
  console.log(
    `  collections: ${Object.keys(packageCollections).join(", ") || "(none)"}`,
  );
  console.log(
    `  globals: ${Object.keys(packageGlobals).join(", ") || "(none)"}`,
  );
  console.log(`  media refs: ${mediaManifest.length}`);
  const exportedDocCount =
    Object.values(packageCollections).reduce((n, docs) => n + docs.length, 0) +
    Object.keys(packageGlobals).length;
  if (exportedDocCount > MAX_DOCS) {
    console.warn(
      `  WARNING: ${exportedDocCount} docs exceeds the propose cap of ${MAX_DOCS}; ` +
        `re-export scoped (--collections / --globals) or propose will reject it.`,
    );
  }
  if (unpublishedSkipped > 0) {
    console.log(`  skipped never-published docs: ${unpublishedSkipped}`);
  }
  process.exit(0);
};

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
