#!/usr/bin/env node
// `pnpm r2:sync`: mirrors the local MinIO bucket (qweb-media) into
// wrangler's local R2 simulation (apps/web's .wrangler/state) so the
// Worker (apps/web/worker/index.ts) can serve /media/* from a real R2
// binding via `wrangler dev` / `pnpm preview:cf`. See docs/dev/local-development.md ("Media
// storage") for the full two-layer rationale: MinIO simulates R2's S3
// upload endpoint (the only thing Payload can talk to); wrangler simulates
// R2's serving side with a real workerd runtime. There is no local
// S3-compatible endpoint for wrangler's local R2
// (cloudflare/workers-sdk#3687), so the two can only be bridged by reading
// from one and writing through the other's own tooling.
//
// Two phases:
//   1. Seed: any file under apps/web/public/media that is NOT already in
//      MinIO gets uploaded to MinIO first (via the S3 SDK). This keeps
//      MinIO as the single upstream for the R2 sync below -- matching the
//      documented flow (CMS uploads -> MinIO -> wrangler R2) exactly
//      instead of teaching this script two different write paths into R2.
//      Covers static design assets that ship in public/media but were
//      never uploaded through Payload (e.g. hero-1080.mp4, partner logos,
//      hackathon partner logos, team/speaker photos with local filenames).
//   2. Sync: every object in MinIO is written into wrangler's local R2 via
//      `wrangler r2 object put <bucket>/<key> --file <tmp> --local`, run
//      from apps/web so it picks up wrangler.jsonc's bucket name and the
//      default local persistence directory (apps/web/.wrangler/state --
//      the same one `wrangler dev` reads from). wrangler is a CLI
//      (~1-2s per invocation), so this runs sequentially (concurrency 1)
//      and logs progress every 25 objects.
//
// Idempotency: `wrangler r2 object get --local` is too slow to shell out
// to per key just to check "did this change." Instead this script keeps a
// manifest (apps/web/.wrangler/r2-sync-manifest.json -- gitignored
// alongside wrangler's own local state, and deleted together with it if
// someone wipes .wrangler/) mapping key -> { size, etag } as of the last
// successful put. A key is skipped when MinIO's current size+ETag match
// the manifest entry; anything new, changed, or manifest-less is
// re-uploaded. This is a size+ETag check, not a byte-for-byte content
// diff -- good enough for local dev, not a general-purpose sync tool.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { isLocalHostname, parseEnvFile } from "../lib/env.mjs";
import { CMS_ENV, WEB_DIR } from "../lib/paths.mjs";
import { envLookup, listAllObjects, loadAwsS3FromCms } from "../lib/s3.mjs";
import { extensionContentType } from "../../apps/web/worker/media-content-types.mjs";

const publicMediaDir = path.resolve(WEB_DIR, "public/media");

const localEnv = parseEnvFile(CMS_ENV);

const bucket = envLookup("S3_BUCKET", localEnv) || "qweb-media";
const endpoint = envLookup("S3_ENDPOINT", localEnv);

if (!endpoint) {
  console.error(
    "r2:sync: S3_ENDPOINT is not set in apps/cms/.env. Run `pnpm db:up` and check apps/cms/.env matches .env.example.",
  );
  process.exit(1);
}

// Guard rail mirroring ops/mirror-media.mjs / local/assert-db.mjs: this
// script only ever reads from a local MinIO, never a remote bucket.
let endpointHostname = "";
try {
  endpointHostname = new URL(endpoint).hostname;
} catch {
  // fall through, checked below
}
if (!isLocalHostname(endpointHostname)) {
  console.error(
    `r2:sync: S3_ENDPOINT host "${endpointHostname || endpoint}" does not look local. Refusing to sync from a non-local bucket.`,
  );
  process.exit(1);
}

let s3Sdk;
try {
  s3Sdk = loadAwsS3FromCms();
} catch (error) {
  console.error(`r2:sync: ${error.message}`);
  process.exit(1);
}

const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } =
  s3Sdk;

const s3 = new S3Client({
  region: envLookup("S3_REGION", localEnv) || "auto",
  endpoint,
  forcePathStyle: envLookup("S3_FORCE_PATH_STYLE", localEnv) === "true",
  credentials: {
    accessKeyId: envLookup("S3_ACCESS_KEY_ID", localEnv),
    secretAccessKey: envLookup("S3_SECRET_ACCESS_KEY", localEnv),
  },
});

const wranglerCli = path.resolve(
  WEB_DIR,
  "node_modules/wrangler/wrangler-dist/cli.js",
);
if (!fs.existsSync(wranglerCli)) {
  console.error(
    "r2:sync: apps/web/node_modules/wrangler not found. Run `pnpm install` first.",
  );
  process.exit(1);
}

// Content type from the shared extension map (apps/web/worker/
// media-content-types.mjs) -- the single source of truth used by both this
// script (stamps the type on each R2 put) and the Worker. Includes HLS
// types (.m3u8/.m4s/.ts/.vtt) so iOS Safari's native HLS player works.
function contentTypeFor(key) {
  return extensionContentType(key) ?? "application/octet-stream";
}

async function listBucket() {
  return listAllObjects(s3, ListObjectsV2Command, bucket);
}

/**
 * listBucket(), but turns a MinIO-unreachable error into the same clear,
 * one-line guard message this file uses everywhere else instead of a raw
 * stack trace (e.g. `ECONNREFUSED` when the local stack isn't running).
 */
async function listBucketOrFail() {
  try {
    return await listBucket();
  } catch (error) {
    console.error(
      `r2:sync: could not reach MinIO at ${endpoint} (${error.message}). ` +
        "Run `pnpm db:up` first (or `make dev`), then retry.",
    );
    process.exit(1);
  }
}

/** Recursively list files under `dir`, returning POSIX-style keys relative
 * to `baseDir` (so nested folders like hackathon/partners/*.webp become
 * "hackathon/partners/foo.webp", matching how the site references them
 * under /media/ and how a flat S3 bucket stores them). */
function walkMediaDir(dir, baseDir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMediaDir(full, baseDir, out);
    } else if (entry.isFile()) {
      out.push(path.relative(baseDir, full).split(path.sep).join("/"));
    }
  }
  return out;
}

// --- Phase 1: seed public/media files missing from (or changed vs) MinIO --

console.log(
  `r2:sync: checking apps/web/public/media against MinIO s3://${bucket}...`,
);

const sizesBeforeSeed = new Map(
  (await listBucketOrFail()).map((o) => [o.Key, o.Size]),
);
const localMediaKeys = fs.existsSync(publicMediaDir)
  ? walkMediaDir(publicMediaDir, publicMediaDir, [])
  : [];
// Not just "missing" -- also re-seed a key whose local file size no longer
// matches what's in MinIO. These files are static design assets edited
// directly on disk (not through Payload, which never overwrites a key in
// place), so unlike CMS uploads they *can* change after their first sync
// (e.g. a hero video re-encode). Size is a cheap enough signal for this
// local-dev-only check; see the manifest note below for the same tradeoff
// applied to the MinIO -> R2 side.
const localFileSize = (key) =>
  fs.statSync(path.join(publicMediaDir, ...key.split("/"))).size;
const toSeed = localMediaKeys.filter(
  (key) => sizesBeforeSeed.get(key) !== localFileSize(key),
);

if (toSeed.length > 0) {
  console.log(
    `r2:sync: seeding ${toSeed.length} file(s) from public/media into MinIO ` +
      "(static design assets not uploaded through Payload, new or changed):",
  );
  for (const key of toSeed) {
    const filePath = path.join(publicMediaDir, ...key.split("/"));
    const body = fs.readFileSync(filePath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentTypeFor(key),
        ContentLength: body.length,
      }),
    );
    console.log(`  seeded: ${key}`);
  }
} else {
  console.log("r2:sync: public/media has no new or changed files vs MinIO.");
}

// --- Phase 2: sync MinIO -> wrangler local R2 ------------------------------

const manifestPath = path.resolve(WEB_DIR, ".wrangler/r2-sync-manifest.json");
let manifest = {};
if (fs.existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  } catch {
    manifest = {};
  }
}

const objects = await listBucketOrFail();
console.log(`r2:sync: ${objects.length} object(s) in MinIO s3://${bucket}`);

let synced = 0;
let skipped = 0;
let failed = 0;
let processed = 0;

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "r2-sync-"));

try {
  for (const obj of objects) {
    processed += 1;
    const key = obj.Key;
    const cached = manifest[key];

    if (cached && cached.size === obj.Size && cached.etag === obj.ETag) {
      skipped += 1;
    } else {
      try {
        const getResult = await s3.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        );
        const tmpFile = path.join(tmpDir, `obj-${processed}`);
        const bytes = await getResult.Body.transformToByteArray();
        fs.writeFileSync(tmpFile, bytes);

        const put = spawnSync(
          process.execPath,
          [
            wranglerCli,
            "r2",
            "object",
            "put",
            `${bucket}/${key}`,
            "--file",
            tmpFile,
            "--local",
            "--content-type",
            getResult.ContentType || contentTypeFor(key),
          ],
          { cwd: WEB_DIR, stdio: ["ignore", "pipe", "pipe"] },
        );

        fs.rmSync(tmpFile, { force: true });

        if (put.status !== 0) {
          throw new Error(
            put.stderr?.toString().trim() ||
              put.stdout?.toString().trim() ||
              `exit ${put.status}`,
          );
        }

        manifest[key] = { size: obj.Size, etag: obj.ETag };
        synced += 1;
      } catch (error) {
        failed += 1;
        console.error(`  FAILED: ${key}: ${error.message}`);
      }
    }

    if (processed % 25 === 0 || processed === objects.length) {
      console.log(
        `r2:sync: ${processed}/${objects.length} processed ` +
          `(synced ${synced}, skipped ${skipped}, failed ${failed})`,
      );
    }
  }
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log("");
console.log("r2:sync: summary");
console.log(`  seeded into MinIO:    ${toSeed.length}`);
console.log(`  total objects in R2:  ${objects.length}`);
console.log(`  synced (put):         ${synced}`);
console.log(`  skipped (unchanged):  ${skipped}`);
console.log(`  failed:               ${failed}`);

if (failed > 0) process.exit(1);
