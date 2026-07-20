#!/usr/bin/env node
// `pnpm ops:mirror-db` (scripts/ops/): seeds the local database from a dump of the
// real remote database. One-way only (remote -> local); there is deliberately
// no data:push. Prefer `make pull` / `content:pull` (published REST package). See docs/dev/local-development.md.
//
// pg_dump/psql run *inside* the docker-compose postgres container (no host
// Postgres client tools required). The dump is also kept as a timestamped
// backup file under scripts/backups/ (gitignored) so a dump can be
// inspected or replayed without re-hitting the remote database.

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { hostnameOf, isLocalHostname, parseEnvFile } from "../lib/env.mjs";
import { requireHumanConfirm } from "../lib/human-confirm.mjs";
import { CMS_ENV, REPO_ROOT } from "../lib/paths.mjs";

const backupsDir = path.join(REPO_ROOT, "scripts/backups");

// Every dump is a plaintext PII-bearing copy of the real remote database
// (speaker/team/contact data; see the warnLines below). Nothing else
// deletes these, so keep only the newest N and purge the rest after each
// successful dump instead of letting them accumulate unbounded on a laptop.
const RETAIN_DUMPS = 5;

function fail(message) {
  console.error(`\nops:mirror-db: ${message}\n`);
  process.exit(1);
}

/**
 * Split a postgres(ql):// connection URI into the standard libpq
 * PG*-prefixed environment variables (PGHOST/PGPORT/PGUSER/PGPASSWORD/
 * PGDATABASE[/PGSSLMODE]) so pg_dump can connect with NO connection info on
 * its own command line at all: passing the URI as a `pg_dump <uri>` argv
 * element (or interpolating it into an `sh -c '...'` string) still leaves
 * the secret sitting in that process's own argv, visible via `ps auxww` /
 * `/proc/<pid>/cmdline` for the lifetime of the dump. Individual PG* env
 * vars are how libpq is designed to take this without ever touching argv.
 * @param {string} uri
 * @returns {Record<string, string>}
 */
function pgEnvFromUri(uri) {
  const parsed = new URL(uri);
  /** @type {Record<string, string>} */
  const env = {
    PGHOST: decodeURIComponent(parsed.hostname),
    PGPORT: parsed.port || "5432",
    PGUSER: decodeURIComponent(parsed.username),
    PGPASSWORD: decodeURIComponent(parsed.password),
    PGDATABASE: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
  };
  const sslmode = parsed.searchParams.get("sslmode");
  if (sslmode) env.PGSSLMODE = sslmode;
  return env;
}

const localEnv = parseEnvFile(CMS_ENV);

// REMOTE_DATABASE_URI (full prod DB access) is deliberately NOT read from
// apps/cms/.env.remote: it is a break-glass credential, not a day-to-day
// one, and must not sit persisted on disk next to REMOTE_CMS_URL /
// CONTENT_SYNC_TOKEN. The operator exports it in their shell per use.
const sourceUri = process.env.REMOTE_DATABASE_URI ?? "";
const targetUri = process.env.DATABASE_URI ?? localEnv.DATABASE_URI ?? "";

const sourceHost = hostnameOf(sourceUri);
const targetHost = hostnameOf(targetUri);

if (!sourceUri || !sourceHost) {
  fail(
    "REMOTE_DATABASE_URI is not set. Export it in your shell before running " +
      "this command, e.g.:\n" +
      '  export REMOTE_DATABASE_URI="postgresql://user:pass@host/db?sslmode=require"\n' +
      "Get the value from the Neon dashboard (prefer a READ-ONLY role). Do not " +
      "add it to apps/cms/.env.remote; it is a per-use break-glass credential, " +
      "not a persisted one.",
  );
}

if (isLocalHostname(sourceHost)) {
  fail(
    `REMOTE_DATABASE_URI host "${sourceHost}" looks local. Refusing: the source of a pull ` +
      "must be the real remote database, not localhost.",
  );
}

if (!targetUri || !isLocalHostname(targetHost)) {
  fail(
    `Target DATABASE_URI host is "${targetHost ?? "(unset)"}", not local. Refusing to pull ` +
      "into a non-local database.",
  );
}

await requireHumanConfirm({
  label: "ops:mirror-db",
  expected: sourceHost,
  warnLines: [
    "WARNING: this dumps the REAL remote database (speaker/team/contact PII) into local Docker",
    `  and scripts/backups/. Source host: ${sourceHost}`,
  ],
});

console.log(
  `ops:mirror-db: source=${sourceHost} (remote) -> target=${targetHost} (local qweb)`,
);

fs.mkdirSync(backupsDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupFile = path.join(backupsDir, `qweb-${timestamp}.sql`);

console.log(`ops:mirror-db: dumping remote database -> ${backupFile}`);
const dumpOut = fs.createWriteStream(backupFile);
const sourcePgEnv = pgEnvFromUri(sourceUri);
await new Promise((resolve, reject) => {
  const dump = spawn(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      // Bare `-e NAME` (no `=value`) forwards the value from THIS process's
      // env into the container; the docker CLI's own argv (visible on the
      // host via ps) only ever contains the variable names, never the
      // secret. pg_dump then reads these PG* vars itself, so its own argv
      // (visible inside the container) carries no connection info either.
      "-e",
      "PGHOST",
      "-e",
      "PGPORT",
      "-e",
      "PGUSER",
      "-e",
      "PGPASSWORD",
      "-e",
      "PGDATABASE",
      ...(sourcePgEnv.PGSSLMODE ? ["-e", "PGSSLMODE"] : []),
      "postgres",
      "pg_dump",
      "--no-owner",
      "--no-privileges",
      "--clean",
      "--if-exists",
    ],
    {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "inherit"],
      env: { ...process.env, ...sourcePgEnv },
    },
  );
  dump.stdout.pipe(dumpOut);
  dump.on("error", reject);
  dump.on("exit", (code) => {
    dumpOut.end();
    if (code === 0) resolve();
    else reject(new Error(`pg_dump exited with code ${code}`));
  });
}).catch((error) => fail(`dump failed: ${error.message}`));

const stat = fs.statSync(backupFile);
console.log(`ops:mirror-db: dump complete (${backupFile}, ${stat.size} bytes)`);

// Retention: keep only the newest RETAIN_DUMPS backups; purge the rest.
{
  const dumps = fs
    .readdirSync(backupsDir)
    .filter((name) => name.startsWith("qweb-") && name.endsWith(".sql"))
    .map((name) => {
      const filePath = path.join(backupsDir, name);
      return { name, filePath, mtimeMs: fs.statSync(filePath).mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  const toPurge = dumps.slice(RETAIN_DUMPS);
  for (const old of toPurge) {
    fs.rmSync(old.filePath, { force: true });
    console.log(`ops:mirror-db: purged old backup ${old.name}`);
  }
  console.log(
    `ops:mirror-db: retention: kept newest ${Math.min(dumps.length, RETAIN_DUMPS)} ` +
      `dump(s) in scripts/backups/, purged ${toPurge.length}`,
  );
}

console.log("ops:mirror-db: restoring into local qweb...");
await new Promise((resolve, reject) => {
  const dumpIn = fs.createReadStream(backupFile);
  const restore = spawn(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "postgres",
      "psql",
      "-U",
      "postgres",
      "-d",
      "qweb",
    ],
    {
      cwd: REPO_ROOT,
      stdio: ["pipe", "inherit", "inherit"],
    },
  );
  dumpIn.pipe(restore.stdin);
  restore.on("error", reject);
  restore.on("exit", (code) => {
    if (code === 0) resolve();
    else reject(new Error(`psql restore exited with code ${code}`));
  });
}).catch((error) => fail(`restore failed: ${error.message}`));

console.log(
  "ops:mirror-db: done. Local qweb database now mirrors the remote dump.",
);
