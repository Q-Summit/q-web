#!/usr/bin/env node
// content:upload-media: create-if-missing Media via /api/content-sync/media.
// Agent-OK. Never overwrites. Does not publish. Does not deploy.
import fs from "node:fs";
import path from "node:path";

import { argValue, hasFlag } from "../lib/args.mjs";
import { parseEnvFile, requireEnvKeys, resolveEnvValue } from "../lib/env.mjs";
import { CMS_ENV, CMS_ENV_REMOTE, REPO_ROOT } from "../lib/paths.mjs";
import { collectMediaFiles, readMediaManifest } from "./media-files.mjs";
import { uploadPackageMedia } from "./upload-media-run.mjs";
import { DEFAULT_PACKAGE_DIR } from "./sync-scope.mjs";

const remoteEnv = parseEnvFile(CMS_ENV_REMOTE);
const localEnv = parseEnvFile(CMS_ENV);
const wantLocal = hasFlag("--local");

const remoteUrl = resolveEnvValue(
  "REMOTE_CMS_URL",
  process.env,
  remoteEnv,
).replace(/\/$/, "");
const localUrl = (
  resolveEnvValue("CMS_SERVER_URL", process.env, localEnv) ||
  "http://localhost:3000"
).replace(/\/$/, "");
const targetingRemote = !wantLocal && Boolean(remoteUrl);
const cmsUrl = targetingRemote ? remoteUrl : localUrl;

try {
  if (targetingRemote) {
    requireEnvKeys(
      "content:upload-media",
      ["CONTENT_SYNC_TOKEN", "CONTENT_SYNC_USER_EMAIL"],
      process.env,
      remoteEnv,
      localEnv,
    );
  } else {
    requireEnvKeys(
      "content:upload-media",
      ["CONTENT_SYNC_TOKEN", "CONTENT_SYNC_USER_EMAIL"],
      process.env,
      localEnv,
      remoteEnv,
    );
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const token = resolveEnvValue(
  "CONTENT_SYNC_TOKEN",
  process.env,
  targetingRemote ? remoteEnv : localEnv,
  targetingRemote ? localEnv : remoteEnv,
);
const actor = resolveEnvValue(
  "CONTENT_SYNC_USER_EMAIL",
  process.env,
  localEnv,
  remoteEnv,
);

const dirRel = argValue("--dir") ?? DEFAULT_PACKAGE_DIR;
const dir = path.isAbsolute(dirRel) ? dirRel : path.join(REPO_ROOT, dirRel);
const extraRel = argValue("--media-dir");
const extraDirs = extraRel
  ? [path.isAbsolute(extraRel) ? extraRel : path.join(REPO_ROOT, extraRel)]
  : [];

const bundlePath = path.join(dir, "bundle.json");
let manifest = [];
if (fs.existsSync(bundlePath)) {
  try {
    manifest = readMediaManifest(
      JSON.parse(fs.readFileSync(bundlePath, "utf-8")),
    );
  } catch {
    manifest = [];
  }
}

const files = collectMediaFiles({
  packageDir: dir,
  extraDirs,
  manifest,
});
if (files.length === 0) {
  console.error(
    "content:upload-media: no local image files found.\n" +
      `  Looked in ${path.join(dir, "media")}` +
      (extraDirs[0] ? ` and ${extraDirs[0]}` : "") +
      "\n  Put binaries next to the package or pass --media-dir.",
  );
  process.exit(1);
}

const result = await uploadPackageMedia({
  cmsUrl,
  token,
  actor,
  files,
  dryRun: hasFlag("--dry-run"),
});
if (!result.ok) process.exit(1);
