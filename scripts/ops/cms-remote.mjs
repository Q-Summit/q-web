#!/usr/bin/env node
// `pnpm ops:cms-remote` (scripts/ops/cms-remote.mjs): Payload admin against the REAL remote
// database. Prefer `pnpm dev:web:remote` (read-only REST) or local `make dev`.
// See docs/dev/local-development.md.
//
// Deliberately interactive: requires typing the remote DB hostname at a
// real TTY. Agents and non-TTY drivers abort immediately.

import { spawn } from "node:child_process";

import {
  hostnameOf,
  isLocalHostname,
  parseEnvFile,
  requireEnvKeys,
} from "../lib/env.mjs";
import { requireHumanConfirm } from "../lib/human-confirm.mjs";
import { CMS_DIR, CMS_ENV_REMOTE } from "../lib/paths.mjs";

// apps/cms/.env.remote is optional here: it carries REMOTE_S3_* only.
// REMOTE_DATABASE_URI (full prod DB access) is a break-glass credential and
// is deliberately NOT read from that file; it must not sit persisted on
// disk next to REMOTE_CMS_URL / CONTENT_SYNC_TOKEN. Export it in the shell
// per use instead.
const remoteEnv = parseEnvFile(CMS_ENV_REMOTE);

const remoteDatabaseUri = process.env.REMOTE_DATABASE_URI ?? "";
const remoteHostname = hostnameOf(remoteDatabaseUri);

if (!remoteHostname) {
  console.error("");
  console.error(
    "REMOTE_DATABASE_URI is not set (or not a valid connection URI).",
  );
  console.error("");
  console.error("Export it in your shell before running this command, e.g.:");
  console.error(
    '  export REMOTE_DATABASE_URI="postgresql://user:pass@host/db?sslmode=require"',
  );
  console.error("");
  console.error(
    "Get the value from the Neon dashboard (prefer a READ-ONLY role). Do not",
  );
  console.error(
    "add it to apps/cms/.env.remote; it is a per-use break-glass credential,",
  );
  console.error("not a persisted one.");
  console.error("");
  console.error(
    "For REMOTE_S3_*: paste R2 Object Read & Write keys into apps/cms/.env.remote.",
  );
  console.error("");
  process.exit(1);
}

if (isLocalHostname(remoteHostname)) {
  console.error(
    `REMOTE_DATABASE_URI host "${remoteHostname}" looks local. .env.remote should point at ` +
      "the real remote database, not localhost.",
  );
  process.exit(1);
}

const RED = "\x1b[31m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

await requireHumanConfirm({
  label: "ops:cms-remote",
  expected: remoteHostname,
  warnLines: [
    `${RED}${BOLD}========================================================${RESET}`,
    `${RED}${BOLD} WARNING: this connects the CMS admin UI to the REAL,${RESET}`,
    `${RED}${BOLD} PRODUCTION database. Any edit you make here is a real edit.${RESET}`,
    `${RED}${BOLD}========================================================${RESET}`,
    `${RED}  Remote DB host: ${remoteHostname}${RESET}`,
    `${RED}  Schema push:    disabled (PAYLOAD_DB_PUSH=false)${RESET}`,
    `${RED}${BOLD}========================================================${RESET}`,
    // `next dev` refuses to run at all with NODE_ENV=production, so this
    // process cannot force it; that means Users.ts's `disableLocalStrategy`
    // (only set when NODE_ENV === "production") stays OFF here, unlike the
    // real Vercel deployment. In practice this is inert (no production user
    // has a password hash; Google JIT-provisions all real accounts), but the
    // auth surface exposed by THIS locally-run instance genuinely differs
    // from production, so say so up front rather than leaving it silent.
    `${RED}  Auth note: this is \`next dev\` (NODE_ENV=development), so the local${RESET}`,
    `${RED}  email/password login strategy stays schema-enabled here, unlike the${RESET}`,
    `${RED}  real production deployment (Google-only SSO, see ADR-0005). No real${RESET}`,
    `${RED}  user has a password set, so this is normally inert -- do not create one.${RESET}`,
    `${RED}${BOLD}========================================================${RESET}`,
  ],
});

console.log("Confirmed. Starting `next dev` against the remote database...");

const childEnv = {
  ...process.env,
  DATABASE_URI: remoteDatabaseUri,
  PAYLOAD_DB_PUSH: "false",
};

const wantsRemoteS3 =
  Boolean(remoteEnv.REMOTE_S3_BUCKET) ||
  Boolean(remoteEnv.REMOTE_S3_ACCESS_KEY_ID) ||
  Boolean(remoteEnv.REMOTE_S3_SECRET_ACCESS_KEY) ||
  Boolean(remoteEnv.REMOTE_S3_ENDPOINT);

if (wantsRemoteS3) {
  try {
    requireEnvKeys(
      "ops:cms-remote",
      [
        "REMOTE_S3_BUCKET",
        "REMOTE_S3_ENDPOINT",
        "REMOTE_S3_ACCESS_KEY_ID",
        "REMOTE_S3_SECRET_ACCESS_KEY",
      ],
      process.env,
      remoteEnv,
    );
  } catch (error) {
    console.error(error.message);
    console.error(
      "  Fix REMOTE_S3_* or remove partial keys from apps/cms/.env.remote.",
    );
    process.exit(1);
  }
  childEnv.S3_BUCKET = remoteEnv.REMOTE_S3_BUCKET;
  childEnv.S3_ENDPOINT = remoteEnv.REMOTE_S3_ENDPOINT ?? "";
  childEnv.S3_ACCESS_KEY_ID = remoteEnv.REMOTE_S3_ACCESS_KEY_ID ?? "";
  childEnv.S3_SECRET_ACCESS_KEY = remoteEnv.REMOTE_S3_SECRET_ACCESS_KEY ?? "";
  childEnv.S3_REGION = "auto";
} else {
  console.log(
    "REMOTE_S3_* not set in .env.remote: media storage falls back to local disk.",
  );
}

const child = spawn("pnpm", ["exec", "next", "dev"], {
  cwd: CMS_DIR,
  env: childEnv,
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
