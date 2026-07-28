#!/usr/bin/env node
// make dev / pnpm run dev: bring up local Postgres+MinIO, seed if empty,
// then run CMS + Astro (CMS mode) together. Ctrl+C stops both children.
import { spawn } from "node:child_process";

import { REPO_ROOT } from "../lib/paths.mjs";
import { runCommandSync } from "../lib/run.mjs";
import { seedIfEmpty } from "../lib/seed-if-empty.mjs";

function banner() {
  console.log(`
q-web local workbench
  CMS admin:  http://localhost:3000
  Astro site: http://localhost:4321  (CONTENT_SOURCE=cms)
  Live Preview iframes localhost:4321 (SITE_URL in apps/cms/.env)
  Accounts:   see docs/dev/local-development.md (seed)
  Agents:     MAY/NEVER and content loops in root AGENTS.md
`);
}

console.log("dev: ensuring Docker Postgres + MinIO…");
const dbUpCode = runCommandSync("pnpm", ["db:up"], { cwd: REPO_ROOT });
if (dbUpCode !== 0) process.exit(dbUpCode);

console.log("dev: local-DB guard…");
const guard = runCommandSync("node", ["scripts/local/assert-db.mjs"], {
  cwd: REPO_ROOT,
});
if (guard !== 0) process.exit(guard);

console.log("dev: seed if empty…");
const seedCode = seedIfEmpty();
if (seedCode !== 0) process.exit(seedCode);

banner();

const children = [];
const cms = spawn("pnpm", ["--filter", "cms", "run", "dev"], {
  cwd: REPO_ROOT,
  stdio: "inherit",
  env: process.env,
});
children.push(cms);

const web = spawn("pnpm", ["--filter", "web", "run", "dev:cms"], {
  cwd: REPO_ROOT,
  stdio: "inherit",
  env: process.env,
});
children.push(web);

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  // Set it eagerly: the timer below is unref'd, so if every child has already
  // exited the event loop can drain and Node exits naturally BEFORE the
  // timeout fires. Without this, `make dev` reported success (exit 0) when the
  // CMS or Astro dev server crashed on startup, which a scripted or CI-driven
  // start reads as "the workbench came up".
  process.exitCode = code;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 500).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    const status = signal ? 1 : (code ?? 1);
    console.error(
      `dev: child exited (code=${code} signal=${signal}); stopping the rest.`,
    );
    shutdown(status);
  });
}
