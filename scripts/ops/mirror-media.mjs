#!/usr/bin/env node
// `pnpm ops:mirror-media` (scripts/ops/): mirrors the remote R2 media bucket into
// the local MinIO bucket (remote -> local only). Prefer `make pull` / `content:pull` for text packages
// when you only need text. See docs/dev/local-development.md.
//
// Uses @aws-sdk/client-s3 via scripts/lib/s3.mjs (cms storage-s3 install).

import {
  hostnameOf,
  isLocalHostname,
  parseEnvFile,
  requireEnvKeys,
} from "../lib/env.mjs";
import { requireHumanConfirm } from "../lib/human-confirm.mjs";
import { CMS_ENV, CMS_ENV_REMOTE } from "../lib/paths.mjs";
import { envLookup, listAllObjects, loadAwsS3FromCms } from "../lib/s3.mjs";

const localEnv = parseEnvFile(CMS_ENV);
const remoteEnv = parseEnvFile(CMS_ENV_REMOTE);

const REMOTE_S3_KEYS = [
  "REMOTE_S3_BUCKET",
  "REMOTE_S3_ENDPOINT",
  "REMOTE_S3_ACCESS_KEY_ID",
  "REMOTE_S3_SECRET_ACCESS_KEY",
];

try {
  requireEnvKeys("ops:mirror-media", REMOTE_S3_KEYS, process.env, remoteEnv);
} catch (error) {
  console.error(error.message);
  console.error(
    "  ops:mirror-media needs REMOTE_S3_* in apps/cms/.env.remote " +
      "(R2 → Manage API Tokens → Object Read & Write).",
  );
  process.exit(1);
}

const remoteBucket = envLookup("REMOTE_S3_BUCKET", remoteEnv);

const targetBucket = envLookup("S3_BUCKET", localEnv);
const targetEndpoint = envLookup("S3_ENDPOINT", localEnv);

if (!targetBucket || !targetEndpoint) {
  console.error(
    "ops:mirror-media: local S3_BUCKET/S3_ENDPOINT are not set in apps/cms/.env. Run " +
      "`pnpm db:up` and check apps/cms/.env matches .env.example.",
  );
  process.exit(1);
}

// Guard rail mirroring local/assert-db.mjs: the *target* of a pull must be
// the local MinIO, never a remote endpoint (e.g. from an accidentally
// misconfigured .env). Uses the shared isLocalHostname helper so the accepted
// set (including the bracketed IPv6 "[::1]" form) stays in one place.
const targetHostname = hostnameOf(targetEndpoint);
if (!isLocalHostname(targetHostname)) {
  console.error(
    `ops:mirror-media: target S3_ENDPOINT host "${targetHostname || targetEndpoint}" does not ` +
      "look local. Refusing to pull media into a non-local bucket.",
  );
  process.exit(1);
}

await requireHumanConfirm({
  label: "ops:mirror-media",
  expected: remoteBucket,
  warnLines: [
    "WARNING: this mirrors the REAL remote R2 bucket into local MinIO.",
    `  Remote bucket: ${remoteBucket}`,
  ],
});

let s3Sdk;
try {
  s3Sdk = loadAwsS3FromCms();
} catch (error) {
  console.error(`ops:mirror-media: ${error.message}`);
  process.exit(1);
}

const {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} = s3Sdk;

const remoteClient = new S3Client({
  region: "auto",
  endpoint: envLookup("REMOTE_S3_ENDPOINT", remoteEnv),
  credentials: {
    accessKeyId: envLookup("REMOTE_S3_ACCESS_KEY_ID", remoteEnv),
    secretAccessKey: envLookup("REMOTE_S3_SECRET_ACCESS_KEY", remoteEnv),
  },
});

const localClient = new S3Client({
  region: envLookup("S3_REGION", localEnv) || "auto",
  endpoint: targetEndpoint,
  forcePathStyle: envLookup("S3_FORCE_PATH_STYLE", localEnv) === "true",
  credentials: {
    accessKeyId: envLookup("S3_ACCESS_KEY_ID", localEnv),
    secretAccessKey: envLookup("S3_SECRET_ACCESS_KEY", localEnv),
  },
});

console.log(
  `ops:mirror-media: mirroring s3://${remoteBucket} -> local MinIO s3://${targetBucket}`,
);

async function headObjectOrNull(client, bucket, key) {
  try {
    return await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound")
      return null;
    throw error;
  }
}

const remoteObjects = await listAllObjects(
  remoteClient,
  ListObjectsV2Command,
  remoteBucket,
);
console.log(
  `ops:mirror-media: ${remoteObjects.length} objects in remote bucket`,
);

let copied = 0;
let skippedIdentical = 0;
let failed = 0;

for (const obj of remoteObjects) {
  const key = obj.Key;
  try {
    const existing = await headObjectOrNull(localClient, targetBucket, key);
    // Etag-first: a multipart ETag (has a "-" suffix, e.g. "abcd1234-3") is
    // not a content hash, so it cannot be compared across S3 implementations
    // (remote R2 vs local MinIO chunk differently). Only trust ETag equality
    // when both sides look like plain (non-multipart) ETags; otherwise fall
    // back to size, the best remaining cheap signal for this human-driven
    // break-glass mirror. This intentionally trades a few unneeded re-copies
    // for not silently skipping a changed object that happens to keep its
    // byte size.
    const isMultipartEtag = (etag) =>
      typeof etag === "string" && etag.includes("-");
    const bothEtagsComparable =
      existing?.ETag &&
      obj.ETag &&
      !isMultipartEtag(existing.ETag) &&
      !isMultipartEtag(obj.ETag);
    const identical = bothEtagsComparable
      ? existing.ETag === obj.ETag
      : existing?.ContentLength === obj.Size;
    if (existing && identical) {
      skippedIdentical += 1;
      continue;
    }

    const remoteObject = await remoteClient.send(
      new GetObjectCommand({ Bucket: remoteBucket, Key: key }),
    );

    await localClient.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: key,
        Body: remoteObject.Body,
        ContentType: remoteObject.ContentType,
        ContentLength: remoteObject.ContentLength,
      }),
    );
    copied += 1;
    console.log(`  copied: ${key}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAILED: ${key}: ${error.message}`);
  }
}

console.log("");
console.log("ops:mirror-media: summary");
console.log(`  total remote objects: ${remoteObjects.length}`);
console.log(`  copied:               ${copied}`);
console.log(`  skipped (identical):  ${skippedIdentical}`);
console.log(`  failed:               ${failed}`);

if (failed > 0) process.exit(1);
