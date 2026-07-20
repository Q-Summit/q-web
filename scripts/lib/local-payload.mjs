// Local-only Payload package export/import: assert local DB, then payload run.

import { REPO_ROOT } from "./paths.mjs";
import { runCommandSync } from "./run.mjs";

/**
 * Guard with assert-local-db, then run a cms Payload bin script.
 * @param {string} binRelativeToCms e.g. "src/bin/export-package.ts"
 * @param {string[]} [extraArgs] forwarded after `--` (default: process.argv.slice(2))
 * @returns {never}
 */
export function runLocalPayloadBin(
  binRelativeToCms,
  extraArgs = process.argv.slice(2),
) {
  const guard = runCommandSync("node", ["scripts/local/assert-db.mjs"], {
    cwd: REPO_ROOT,
  });
  if (guard !== 0) process.exit(guard);

  const code = runCommandSync(
    "pnpm",
    [
      "--filter",
      "cms",
      "exec",
      "payload",
      "run",
      binRelativeToCms,
      "--",
      ...extraArgs,
    ],
    { cwd: REPO_ROOT },
  );
  process.exit(code);
}
