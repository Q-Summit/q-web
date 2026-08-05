#!/usr/bin/env node
/**
 * Fast quality gate for pre-commit: structural docs first, then the rest in
 * parallel (markdownlint, cspell, prettier, design, events taxonomy, cms
 * styles, scripts tests). Full
 * `pnpm run check` calls this, then runs web + cms apps in parallel.
 */
import { runCommand } from "../lib/run.mjs";

// Fail closed on structure before spending wall time on parallel linters.
const docsCode = await runCommand("node", ["scripts/check/docs.mjs"], {
  label: "check:fast",
});
if (docsCode !== 0) process.exit(docsCode);

const parallel = [
  // Single source of truth for the lint invocations: the check:md,
  // check:spell, and format:check scripts in package.json. Editing their args
  // there changes this gate too.
  ["pnpm", ["run", "check:md"]],
  ["pnpm", ["run", "check:spell"]],
  // format:check, NOT an inline prettier glob. This gate used to carry its own
  // narrower glob (md/json/jsonc/yml/yaml/mjs) while `format` wrote ts,tsx,astro
  // and css too, so source formatting was written but never ratcheted and
  // drifted out of shape across 11 files. Delegating keeps the written set and
  // the checked set the same by construction.
  ["pnpm", ["run", "format:check"]],
  ["node", ["scripts/check/design.mjs"]],
  ["node", ["scripts/check/events.mjs"]],
  ["node", ["scripts/check/cms-styles.mjs"]],
  // check:scripts is the single source of truth for the scripts unit tests
  // (both scripts.test.mjs and vrt-report.test.mjs); run it via pnpm so a new
  // test file wired there is picked up by this gate too.
  ["pnpm", ["run", "check:scripts"]],
];

const codes = await Promise.all(
  parallel.map(([cmd, args]) => runCommand(cmd, args, { label: "check:fast" })),
);
process.exit(codes.some((c) => c !== 0) ? 1 : 0);
