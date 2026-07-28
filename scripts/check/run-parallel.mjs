#!/usr/bin/env node
/**
 * Run several `pnpm run <script>` tasks in parallel; exit non-zero if any fail.
 * Used by `pnpm run check` (web and cms together) and nested app gates
 * (build alongside test).
 *
 * Usage: node scripts/check/run-parallel.mjs check:web check:cms
 */
import { runPnpmScriptsParallel } from "../lib/run.mjs";

const scripts = process.argv.slice(2).filter((s) => s && !s.startsWith("-"));
process.exit(await runPnpmScriptsParallel(scripts));
