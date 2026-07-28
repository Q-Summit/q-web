// Shared child-process helpers for root scripts. Prefer these over
// one-off spawn wrappers so exit-code / signal handling stays consistent.

import { spawn, spawnSync } from "node:child_process";

import { REPO_ROOT } from "./paths.mjs";

/**
 * Spawn a command with inherited stdio; resolve to exit code (signal => 1).
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, label?: string }} [opts]
 * @returns {Promise<number>}
 */
export function runCommand(
  command,
  args,
  { cwd = REPO_ROOT, env = process.env, label } = {},
) {
  const tag = label ?? command;
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: false,
      env,
    });
    child.on("error", (err) => {
      console.error(`${tag}: failed to start ${command}: ${err.message}`);
      resolve(1);
    });
    child.on("close", (code, signal) => {
      resolve(signal ? 1 : (code ?? 1));
    });
  });
}

/**
 * Synchronous spawn with inherited stdio. Returns the numeric exit status.
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv }} [opts]
 * @returns {number}
 */
export function runCommandSync(
  command,
  args,
  { cwd = REPO_ROOT, env = process.env } = {},
) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env,
  });
  if (result.error) {
    console.error(`failed to start ${command}: ${result.error.message}`);
    return 1;
  }
  return result.signal ? 1 : (result.status ?? 1);
}

/**
 * Run several `pnpm run <script>` tasks in parallel; exit non-zero if any fail.
 * @param {string[]} scriptNames
 * @param {{ cwd?: string }} [opts]
 * @returns {Promise<number>}
 */
export async function runPnpmScriptsParallel(
  scriptNames,
  { cwd = REPO_ROOT } = {},
) {
  if (scriptNames.length === 0) {
    console.error("run-parallel: pass one or more package.json script names");
    return 1;
  }

  console.log(`run-parallel: starting ${scriptNames.join(" | ")}`);

  const results = await Promise.all(
    scriptNames.map(async (name) => {
      const code = await runCommand("pnpm", ["run", name], {
        cwd,
        label: `run-parallel:${name}`,
      });
      return { name, code };
    }),
  );

  const failed = results.filter((r) => r.code !== 0);
  if (failed.length > 0) {
    for (const f of failed) {
      console.error(`run-parallel: ${f.name} exited ${f.code}`);
    }
    return 1;
  }
  console.log(`run-parallel: ok (${scriptNames.join(" | ")})`);
  return 0;
}
