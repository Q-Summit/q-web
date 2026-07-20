#!/usr/bin/env node
/*
 * Build apps/web in JSON (fixture) mode and fail on content warnings.
 *
 * The build already exits non-zero on hard errors. What it did NOT catch was
 * the soft kind: a partner named in the home band that no partner record
 * matches, or a photo filename that resolves to nothing. Those degrade
 * silently -- the logo or portrait is simply dropped from the page -- and the
 * build stays green.
 *
 * That mattered because the fixture build used to print 40 such warnings of
 * its own, all expected. With a permanent noise floor that high, nobody reads
 * the list, and a real mismatch introduced by a content or code change looks
 * exactly like the status quo. The fixture is now self-consistent and the
 * expected-absence cases are silent by construction (see
 * lib/media-filename.ts `isFixtureMediaSentinel`), so the floor is zero and
 * any warning is real.
 *
 * Deliberately a warning gate on the FIXTURE build only. Production runs in
 * CMS mode, where the same conditions must keep degrading gracefully rather
 * than failing: an editor removing a partner must never break the deploy.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { REPO_ROOT } from "../lib/paths.mjs";

/**
 * Build-time content warnings the fixture build must not produce.
 *
 * Matched ANYWHERE in the line, not as a prefix: Astro writes these while a
 * page line is still open, so they arrive appended to it
 * ("  ├─ /speaker/index.html[images] ..."). A startsWith check silently
 * matched nothing, which would have made this gate pass on any warning it was
 * built to catch.
 *
 * This list must cover EVERY tag apps/web can emit from a console.warn/info.
 * It shipped missing `[partner]` and `[whyq]`, so the gate printed
 * "0 content warnings" over a build that had just dropped nine partner logos.
 * scripts/check/scripts.test.mjs greps the source for emitted tags and fails
 * if any is not matched here, so the next new warn site cannot slip outside
 * the gate the same way.
 */
export const WARNING_TAG = /\[(index|images|partner|whyq|content(?::cms)?)\]/;

function runFixtureBuildGate() {
  const child = spawn("pnpm", ["--filter", "web", "run", "build:fixture"], {
    cwd: REPO_ROOT,
    stdio: ["inherit", "pipe", "pipe"],
  });

  const warnings = [];

  function scan(line) {
    const match = WARNING_TAG.exec(line);
    if (match) warnings.push(line.slice(match.index).trim());
  }

  /** Tee a stream to our own stdout/stderr while scanning it for warnings. */
  function watch(stream, sink) {
    let buffered = "";
    stream.setEncoding("utf-8");
    stream.on("data", (chunk) => {
      sink.write(chunk);
      buffered += chunk;
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) scan(line);
    });
    // Astro's final line often has no trailing newline, so it never leaves
    // `buffered` via the split above. Without this flush a warning emitted last
    // was silently dropped and the gate still printed "0 content warnings".
    stream.on("end", () => {
      if (buffered) {
        scan(buffered);
        buffered = "";
      }
    });
  }

  watch(child.stdout, process.stdout);
  watch(child.stderr, process.stderr);

  // 'close' rather than 'exit': 'exit' can fire before the stdio streams have
  // been fully read, which would race the flush above.
  child.on("close", (code) => {
    if (code !== 0) process.exit(code ?? 1);

    if (warnings.length > 0) {
      console.error(
        `\ncheck-build-web: the fixture build emitted ${warnings.length} content warning(s).\n` +
          "These are silent content mismatches: the affected logo, photo, or section is dropped\n" +
          "from the page and the build still succeeds. The fixture build is expected to be clean,\n" +
          "so each of these is a real mismatch to fix (or, if it is genuinely an expected absence,\n" +
          "mark it with the fixture sentinel in scripts/content/make-fixture.mjs).\n",
      );
      for (const warning of warnings) console.error(`  ${warning}`);
      process.exit(1);
    }

    console.log("check-build-web: fixture build clean (0 content warnings).");
  });
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url));

if (isMain) runFixtureBuildGate();
