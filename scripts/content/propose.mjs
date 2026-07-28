#!/usr/bin/env node
// make propose: POST content package to /api/content-sync.
// Agent-OK. Creates DRAFTS only. Does not publish. Does not deploy.
import fs from "node:fs";
import path from "node:path";

import { argValue, hasFlag } from "../lib/args.mjs";
import { parseEnvFile, requireEnvKeys, resolveEnvValue } from "../lib/env.mjs";
import { CMS_ENV, CMS_ENV_REMOTE, REPO_ROOT } from "../lib/paths.mjs";
import { DEFAULT_PACKAGE_DIR } from "./sync-scope.mjs";

const remoteEnv = parseEnvFile(CMS_ENV_REMOTE);
const localEnv = parseEnvFile(CMS_ENV);
const wantLocal = hasFlag("--local");

function redact(value) {
  if (!value) return value;
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-2)}`;
}

const remoteUrl = resolveEnvValue(
  "REMOTE_CMS_URL",
  process.env,
  remoteEnv,
).replace(/\/$/, "");
const localUrl = (
  resolveEnvValue("CMS_SERVER_URL", process.env, localEnv) ||
  "http://localhost:3000"
).replace(/\/$/, "");

// Local CMS is the default. Missing / placeholder .env.remote is fine for
// day-to-day local propose; only remote-targeting runs require real remote env.
const targetingRemote = !wantLocal && Boolean(remoteUrl);
const cmsUrl = targetingRemote ? remoteUrl : localUrl;

try {
  if (targetingRemote) {
    requireEnvKeys(
      "content:propose",
      ["CONTENT_SYNC_TOKEN", "CONTENT_SYNC_USER_EMAIL"],
      process.env,
      remoteEnv,
      localEnv,
    );
  } else {
    requireEnvKeys(
      "content:propose",
      ["CONTENT_SYNC_TOKEN", "CONTENT_SYNC_USER_EMAIL"],
      process.env,
      localEnv,
      remoteEnv,
    );
  }
} catch (error) {
  console.error(error.message);
  console.error(
    "  Set CONTENT_SYNC_USER_EMAIL to your name (not the example `dev`); " +
      "the CMS forces @q-summit.com and requires that user to exist in Payload.",
  );
  process.exit(1);
}

const token = resolveEnvValue(
  "CONTENT_SYNC_TOKEN",
  process.env,
  targetingRemote ? remoteEnv : localEnv,
  targetingRemote ? localEnv : remoteEnv,
);

// Sent as X-Content-Sync-Actor; CMS normalizes domain and rejects `dev`.
const actor = resolveEnvValue(
  "CONTENT_SYNC_USER_EMAIL",
  process.env,
  localEnv,
  remoteEnv,
);

// Client-side hint only; the CMS endpoint re-validates and forces the domain.
{
  const at = actor.indexOf("@");
  const localPart = (at === -1 ? actor : actor.slice(0, at)).toLowerCase();
  const domain = at === -1 ? null : actor.slice(at + 1).toLowerCase();
  if (localPart === "dev") {
    console.error(
      'content:propose: CONTENT_SYNC_USER_EMAIL must not be the example value "dev".\n' +
        "  Set it to your Workspace local-part (e.g. lukas.strickler or lukas.strickler@q-summit.com).\n" +
        "  The CMS also rejects this server-side.",
    );
    process.exit(1);
  }
  if (domain && domain !== "q-summit.com" && domain !== "agent.q-summit.com") {
    console.error(
      `content:propose: CONTENT_SYNC_USER_EMAIL must be @q-summit.com (got @${domain}).\n` +
        "  Use lukas.strickler or lukas.strickler@q-summit.com; the CMS will refuse other domains.",
    );
    process.exit(1);
  }
}

const dirRel = argValue("--dir") ?? DEFAULT_PACKAGE_DIR;
const dir = path.isAbsolute(dirRel) ? dirRel : path.join(REPO_ROOT, dirRel);
const bundlePath = path.join(dir, "bundle.json");
if (!fs.existsSync(bundlePath)) {
  console.error(`content:propose: missing ${bundlePath}`);
  console.error(
    `  Remote file loop: pnpm content:pull then edit ${DEFAULT_PACKAGE_DIR}/bundle.json then propose.`,
  );
  console.error(
    `  Local CMS loop:   pnpm content:export (writes ${DEFAULT_PACKAGE_DIR}) then propose --local.`,
  );
  console.error(
    "  Flags: pnpm content:propose -- --dir <path> [--dry-run] [--local]",
  );
  process.exit(1);
}

const body = fs.readFileSync(bundlePath, "utf-8");
if (Buffer.byteLength(body) > 5 * 1024 * 1024) {
  console.error("content:propose: package larger than 5 MiB; refuse to send.");
  process.exit(1);
}

const dryRun = hasFlag("--dry-run");
const url = new URL("/api/content-sync", cmsUrl);
if (dryRun) url.searchParams.set("dryRun", "1");

console.log(`content:propose: ${url.origin}${url.pathname}${url.search}`);
console.log(`  mode: ${dryRun ? "dry-run (no writes)" : "write drafts"}`);
console.log(`  target: ${wantLocal || !remoteUrl ? "local" : "remote"}`);
console.log(
  `  actor: ${actor} (CMS forces @q-summit.com; user must already exist)`,
);
console.log(`  token: ${redact(token)} (not logged in full)`);
console.log(`  package: ${bundlePath}`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Content-Sync-Actor": actor,
  },
  body,
});

const text = await res.text();
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  parsed = { raw: text };
}

if (!res.ok) {
  console.error(`content:propose failed: ${res.status}`);
  console.error(parsed);
  process.exit(1);
}

console.log(JSON.stringify(parsed, null, 2));
console.log(`
Proposed drafts only. Live site unchanged. Approver must Publish in Payload admin.
This did not deploy.
Admin: ${cmsUrl}/
`);

const errors = Array.isArray(parsed?.errors) ? parsed.errors : [];
if (errors.length > 0) {
  console.error(
    `content:propose: ${errors.length} error(s) in result; treating as failure.`,
  );
  process.exit(1);
}
