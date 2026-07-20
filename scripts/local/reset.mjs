#!/usr/bin/env node
// Wipe local Docker volumes, bring services back, reseed. Local only.
import { requireHumanConfirm } from "../lib/human-confirm.mjs";
import { REPO_ROOT } from "../lib/paths.mjs";
import { runCommandSync } from "../lib/run.mjs";

await requireHumanConfirm({
  label: "reset-local",
  expected: "YES",
  warnLines: [
    "reset-local will docker compose down -v (wipe Postgres + MinIO volumes) and reseed.",
  ],
});

console.log("reset-local: docker compose down -v…");
const downCode = runCommandSync("docker", ["compose", "down", "-v"], {
  cwd: REPO_ROOT,
});
if (downCode !== 0) {
  console.error(
    `reset-local: docker compose down -v failed (exit ${downCode}).`,
  );
  process.exit(downCode);
}

console.log("reset-local: db:up…");
const upCode = runCommandSync("pnpm", ["db:up"], { cwd: REPO_ROOT });
if (upCode !== 0) {
  console.error(`reset-local: pnpm db:up failed (exit ${upCode}).`);
  process.exit(upCode);
}

console.log("reset-local: seed…");
const seedCode = runCommandSync("pnpm", ["seed"], { cwd: REPO_ROOT });
if (seedCode !== 0) {
  console.error(`reset-local: pnpm seed failed (exit ${seedCode}).`);
  process.exit(seedCode);
}

console.log("reset-local: done.");
