import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import config from "../src/payload.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const extractedDir = resolveContentDir();
const webMediaDir = path.resolve(dirname, "../../web/public/media");
// Optional sibling checkout: q-summit/site-mirror/mirror/... (CDN recovery).
const mirrorDir = path.resolve(
  dirname,
  "../../../../site-mirror/mirror/cdn.prod.website-files.com",
);

type Ref = { filename: string; alt: string };

function readJson(name: string): any[] {
  return JSON.parse(
    fs.readFileSync(path.join(extractedDir, `${name}.json`), "utf-8"),
  );
}

function collectRefs(): Ref[] {
  const refs: Ref[] = [];
  for (const p of readJson("partners")) {
    if (p.logoFilename) refs.push({ filename: p.logoFilename, alt: p.name });
  }
  for (const j of readJson("jobs")) {
    if (j.logoFilename) refs.push({ filename: j.logoFilename, alt: j.company });
  }
  for (const s of readJson("speakers")) {
    if (s.photoFilename) refs.push({ filename: s.photoFilename, alt: s.name });
  }
  for (const t of readJson("team")) {
    if (t.photoFilename) refs.push({ filename: t.photoFilename, alt: t.name });
  }
  for (const test of readJson("partner-testimonials")) {
    if (test.photoFilename)
      refs.push({ filename: test.photoFilename, alt: test.attribution });
  }
  return refs;
}

let mirrorIndex: Map<string, string> | null = null;
let allMirrorFiles: string[] | null = null;
let allWebFiles: string[] | null = null;

function buildMirrorIndex(): Map<string, string> {
  const index = new Map<string, string>();
  const all: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        // decode URL-encoded characters (e.g. %20 -> space) already handled by fs;
        // just index by basename.
        if (!index.has(entry.name)) {
          index.set(entry.name, full);
        }
        all.push(full);
      }
    }
  }
  if (fs.existsSync(mirrorDir)) walk(mirrorDir);
  allMirrorFiles = all;
  return index;
}

function listWebFiles(): string[] {
  const all: string[] = [];
  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        all.push(full);
      }
    }
  }
  if (fs.existsSync(webMediaDir)) walk(webMediaDir);
  return all;
}

function findSourceFile(filename: string): string | null {
  const webPath = path.join(webMediaDir, filename);
  if (fs.existsSync(webPath)) return webPath;

  if (!mirrorIndex) mirrorIndex = buildMirrorIndex();

  if (mirrorIndex.has(filename)) return mirrorIndex.get(filename)!;

  // try decoding %XX sequences, and try replacing dashes/underscores loosely.
  const decoded = decodeURIComponent(filename);
  if (mirrorIndex.has(decoded)) return mirrorIndex.get(decoded)!;

  // fallback: case-insensitive / dash-underscore-insensitive search
  const normalize = (s: string) => s.toLowerCase().replace(/[-_ ]+/g, "");
  const target = normalize(filename);
  for (const [name, full] of mirrorIndex) {
    if (normalize(name) === target) return full;
  }

  // fallback: the referenced filename may be a suffix of the real filename
  // (real files sometimes carry an extra hash prefix), and/or the real
  // extension may differ (e.g. referenced .jpg vs actual .webp). Compare the
  // stem (filename without extension) as a substring match.
  const stem = normalize(filename.replace(/\.[^.]+$/, ""));
  if (stem.length > 0) {
    if (!allWebFiles) allWebFiles = listWebFiles();
    for (const full of allWebFiles) {
      if (normalize(path.basename(full)).includes(stem)) return full;
    }
    if (!allMirrorFiles) buildMirrorIndex();
    for (const full of allMirrorFiles ?? []) {
      if (normalize(path.basename(full)).includes(stem)) return full;
    }
  }

  return null;
}

async function run() {
  const payload = await getPayload({ config });

  const refs = collectRefs();
  const uniqueByFilename = new Map<string, Ref>();
  for (const r of refs) {
    if (!uniqueByFilename.has(r.filename)) uniqueByFilename.set(r.filename, r);
  }

  const totalReferenced = uniqueByFilename.size;
  let created = 0;
  let skippedExisting = 0;
  const notFound: string[] = [];

  for (const [filename, ref] of uniqueByFilename) {
    const sourcePath = findSourceFile(filename);
    if (!sourcePath) {
      notFound.push(filename);
      continue;
    }

    // Dedup by the actual uploaded filename Payload will store, since a
    // fuzzy-resolved source file's basename can differ from the referenced
    // filename (extra hash prefix, different extension, etc).
    const uploadFilename = path.basename(sourcePath);
    const existing = await payload.find({
      collection: "media",
      where: { filename: { equals: uploadFilename } },
      limit: 1,
    });

    if (existing.totalDocs > 0) {
      skippedExisting += 1;
      continue;
    }

    try {
      await payload.create({
        collection: "media",
        data: {
          alt: ref.alt ?? filename,
        },
        filePath: sourcePath,
      });
      created += 1;
    } catch (err) {
      console.error(
        `Failed to create media for ${filename} (alt=${JSON.stringify(ref.alt)}):`,
        err,
      );
      throw err;
    }
  }

  console.log(`Referenced filenames: ${totalReferenced}`);
  console.log(`Created: ${created}`);
  console.log(`Already existed (skipped): ${skippedExisting}`);
  console.log(`Not found: ${notFound.length}`);
  if (notFound.length > 0) {
    console.log("Missing files:");
    for (const f of notFound) console.log(` - ${f}`);
  }

  process.exit(0);
}

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
