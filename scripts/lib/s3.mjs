// Resolve @aws-sdk/client-s3 from @payloadcms/storage-s3 (pnpm strict linking)
// and shared list helpers used by ops/mirror-media and preview/r2-sync.

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

import { isUnsetEnvValue } from "./env.mjs";
import { CMS_DIR } from "./paths.mjs";

/**
 * Look up an env key: process.env wins when the key is present (even if
 * blank/placeholder), else a parsed .env object. Placeholders count as unset.
 * @param {string} key
 * @param {Record<string, string>} fileEnv
 * @param {string} [envKey] alternate key inside fileEnv
 * @returns {string}
 */
export function envLookup(key, fileEnv, envKey = key) {
  if (Object.prototype.hasOwnProperty.call(process.env, key)) {
    const fromProcess = process.env[key];
    if (!isUnsetEnvValue(fromProcess)) return String(fromProcess).trim();
    return "";
  }
  const fromFile = fileEnv[envKey];
  if (!isUnsetEnvValue(fromFile)) return String(fromFile).trim();
  return "";
}

/**
 * Load S3 SDK commands from the cms app's storage-s3 install.
 * @returns {typeof import("@aws-sdk/client-s3")}
 */
export function loadAwsS3FromCms() {
  const storageS3Link = path.resolve(
    CMS_DIR,
    "node_modules/@payloadcms/storage-s3",
  );
  if (!fs.existsSync(storageS3Link)) {
    throw new Error(
      "apps/cms/node_modules/@payloadcms/storage-s3 not found. Run `pnpm install` first.",
    );
  }
  const storageS3RealDir = fs.realpathSync(storageS3Link);
  const requireFromStorageS3 = createRequire(
    path.join(storageS3RealDir, "package.json"),
  );
  return requireFromStorageS3("@aws-sdk/client-s3");
}

/**
 * Paginate ListObjectsV2 until exhausted.
 * @param {import("@aws-sdk/client-s3").S3Client} client
 * @param {new (input: import("@aws-sdk/client-s3").ListObjectsV2CommandInput) => import("@aws-sdk/client-s3").ListObjectsV2Command} ListObjectsV2Command
 * @param {string} bucket
 * @returns {Promise<import("@aws-sdk/client-s3")._Object[]>}
 */
export async function listAllObjects(client, ListObjectsV2Command, bucket) {
  const objects = [];
  let continuationToken;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of page.Contents ?? []) objects.push(obj);
    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);
  return objects;
}
