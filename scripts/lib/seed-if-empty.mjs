// Run `pnpm seed` only when the local users table is missing or empty.
// Used by `scripts/local/dev.mjs` (not a standalone CLI).

import { execFileSync } from "node:child_process";

import { resolveAppEnv } from "./env.mjs";
import { CMS_DIR, REPO_ROOT } from "./paths.mjs";
import { runCommandSync } from "./run.mjs";

/**
 * @returns {number} exit code (0 = ok / skipped or seeded)
 */
export function seedIfEmpty() {
  const cmsEnv = resolveAppEnv(CMS_DIR);
  const databaseUri = cmsEnv.DATABASE_URI;

  if (!databaseUri) {
    console.error("seed-if-empty: DATABASE_URI missing in apps/cms/.env");
    return 1;
  }

  let count = "";
  try {
    count = execFileSync(
      "docker",
      [
        "run",
        "--rm",
        "--network",
        "host",
        "postgres:17-alpine",
        "psql",
        databaseUri,
        "-tAc",
        "SELECT COUNT(*)::text FROM users",
      ],
      { cwd: REPO_ROOT, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
  } catch (error) {
    // Distinguish "the table is not there yet" (seed) from "the probe could
    // not run at all" (abort). Catching everything as the former meant any
    // Docker hiccup -- daemon down, image pull failure, `--network host`
    // unsupported (Docker Desktop on macOS/Windows), wrong port -- silently
    // triggered a full re-seed, which contradicts the "your local edits stay"
    // guarantee in docs/dev/local-development.md and can overwrite a
    // maintainer's working content.
    const stderr = String(error?.stderr ?? "");
    const tableMissing =
      /relation "users" does not exist|undefined_table/i.test(stderr);
    if (!tableMissing) {
      console.error(
        "seed-if-empty: could not check whether the database is empty, so it is " +
          "NOT seeding (a re-seed would overwrite local content).\n" +
          `  ${stderr.trim() || error?.message || "unknown docker/psql failure"}\n` +
          "  Fix the database connection and re-run, or seed explicitly with `pnpm seed`.",
      );
      return 1;
    }
    console.log("seed-if-empty: users table missing; running pnpm seed…");
    return runCommandSync("pnpm", ["seed"], { cwd: REPO_ROOT });
  }

  const n = Number.parseInt(count, 10);
  if (!Number.isFinite(n) || n === 0) {
    console.log("seed-if-empty: no users yet; running pnpm seed…");
    return runCommandSync("pnpm", ["seed"], { cwd: REPO_ROOT });
  }

  console.log(`seed-if-empty: ${n} user(s) present; skipping seed.`);
  return 0;
}
