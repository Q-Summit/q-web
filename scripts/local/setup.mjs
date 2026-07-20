#!/usr/bin/env node
// One-command onboarding: run via `pnpm run setup` after cloning.
// Idempotent, safe to re-run any time.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { REPO_ROOT } from "../lib/paths.mjs";

const root = REPO_ROOT;
let failed = false;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => {
  console.error(`  ✗ ${msg}`);
  failed = true;
};

// 1. Git hooks (pre-commit: check:fast; pre-push + CI: full `pnpm run check`).
//    Git silently ignores a nonexistent hooksPath, so verify the directory
//    before claiming the hooks are active. Ensure hook scripts are executable
//    (clone on some filesystems drops +x).
try {
  if (!fs.existsSync(path.join(root, ".githooks"))) {
    throw new Error(".githooks/ is missing from the working tree");
  }
  for (const hook of ["pre-commit", "pre-push", "commit-msg"]) {
    const hookPath = path.join(root, ".githooks", hook);
    if (fs.existsSync(hookPath)) fs.chmodSync(hookPath, 0o755);
  }
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: root });
  ok(
    "git hooks active (core.hooksPath = .githooks; pre-commit/pre-push/commit-msg)",
  );
} catch (e) {
  bad(`could not set git hooks path: ${e.message}`);
}

// 2. Skills symlink: .claude/skills -> ../.agents/skills (one directory-level
//    link; every skill in .agents/skills/ is automatically visible to Claude
//    Code).
const claudeDir = path.join(root, ".claude");
const link = path.join(claudeDir, "skills");
const target = "../.agents/skills";
fs.mkdirSync(claudeDir, { recursive: true });
// This step's own blocker only: an earlier step failing (e.g. git hooks)
// must not stop the symlink from being created or repaired.
let skillsBlocked = false;
let lst = null;
try {
  lst = fs.lstatSync(link);
} catch {
  // No .claude/skills yet; the symlink is created further down.
}
if (lst?.isSymbolicLink()) {
  try {
    if (
      fs.realpathSync(link) ===
      fs.realpathSync(path.join(root, ".agents", "skills"))
    ) {
      ok(".claude/skills -> ../.agents/skills (already linked)");
    } else {
      fs.unlinkSync(link);
      lst = null;
    }
  } catch {
    fs.unlinkSync(link); // broken link, recreate below
    lst = null;
  }
} else if (lst?.isDirectory()) {
  const entries = fs.readdirSync(link);
  if (entries.length === 0) {
    fs.rmdirSync(link);
    lst = null;
  } else {
    skillsBlocked = true;
    bad(
      `.claude/skills is a real directory with content (${entries.join(", ")}). ` +
        `Move those folders into .agents/skills/ yourself, then re-run pnpm run setup.`,
    );
  }
} else if (lst) {
  skillsBlocked = true;
  bad(
    `.claude/skills exists but is neither a symlink nor a directory: remove it and re-run.`,
  );
}
if (!lst && !skillsBlocked) {
  try {
    // Never leave a dangling link while reporting success: the target must
    // exist before the symlink is worth creating.
    if (!fs.existsSync(path.join(root, ".agents", "skills"))) {
      throw new Error(".agents/skills is missing from the working tree");
    }
    fs.symlinkSync(target, link, "dir");
    ok(".claude/skills -> ../.agents/skills (created)");
  } catch (e) {
    bad(
      `could not create the skills symlink: ${e.message}` +
        (process.platform === "win32"
          ? "; on Windows, enable Developer Mode and `git config core.symlinks true`, then re-run."
          : ""),
    );
  }
}

// 3. Env bootstrap: copy each app's .env.example to .env when missing.
for (const app of ["web", "cms"]) {
  const example = path.join(root, "apps", app, ".env.example");
  const envFile = path.join(root, "apps", app, ".env");
  if (fs.existsSync(example) && !fs.existsSync(envFile)) {
    fs.copyFileSync(example, envFile);
    ok(`apps/${app}/.env created from .env.example (fill in real values)`);
  }
}

// The one .env value a fresh clone MUST edit by hand. seed/users.ts refuses
// the example local-part "dev" (normalizeContentSyncUserEmail), so leaving it
// fails `make dev` partway through the seed chain, after the Docker volumes
// already exist -- the least debuggable moment. Catch it here instead, and
// default it from the git identity when that is already a Workspace address.
{
  const envFile = path.join(root, "apps/cms/.env");
  if (fs.existsSync(envFile)) {
    const contents = fs.readFileSync(envFile, "utf-8");
    if (/^CONTENT_SYNC_USER_EMAIL=dev@/m.test(contents)) {
      let gitEmail = "";
      try {
        gitEmail = execFileSync("git", ["config", "--get", "user.email"], {
          cwd: root,
          encoding: "utf-8",
        }).trim();
      } catch {
        // No git identity configured; fall through to the manual instruction.
      }

      if (gitEmail.toLowerCase().endsWith("@q-summit.com")) {
        fs.writeFileSync(
          envFile,
          contents.replace(
            /^CONTENT_SYNC_USER_EMAIL=dev@.*$/m,
            `CONTENT_SYNC_USER_EMAIL=${gitEmail.toLowerCase()}`,
          ),
        );
        ok(
          `apps/cms/.env: CONTENT_SYNC_USER_EMAIL set to ${gitEmail.toLowerCase()} (from git config user.email)`,
        );
      } else {
        bad(
          "apps/cms/.env still has the example CONTENT_SYNC_USER_EMAIL=dev@q-summit.com.\n" +
            '    The CMS rejects the local-part "dev", so `make dev` would fail during seeding.\n' +
            "    Replace it with your Workspace address, e.g. CONTENT_SYNC_USER_EMAIL=you@q-summit.com\n" +
            "    (a bare username works too), then re-run `make setup`.",
        );
      }
    }
  }
}

// Optional remote tooling sheet (pull / remote propose / mirror-media).
// Placeholders are fine for local-only work; remote scripts fail closed later.
{
  const example = path.join(root, "apps/cms/.env.remote.example");
  const envFile = path.join(root, "apps/cms/.env.remote");
  if (fs.existsSync(example) && !fs.existsSync(envFile)) {
    fs.copyFileSync(example, envFile);
    ok(
      "apps/cms/.env.remote created from .env.remote.example (fill only when using remote scripts)",
    );
  }
}

// 4. Chrome-for-Testing for local Lighthouse (gitignored `.browsers/`).
//    Idempotent: skips download when the stable build is already cached.
//    Override with CHROME_PATH if you already have Chrome/Chromium.
//    Failure here is non-fatal for day-to-day CMS work; `make lighthouse`
//    will re-run the install and fail closed if Chrome is still missing.
try {
  console.log(
    "  … ensuring Chrome-for-Testing for Lighthouse (one-time ~150 MB)…",
  );
  execFileSync(
    process.execPath,
    [path.join(root, "scripts", "local", "ensure-chrome.mjs")],
    {
      cwd: root,
      stdio: ["ignore", "ignore", "inherit"],
      env: process.env,
    },
  );
  ok("Chrome-for-Testing ready (`make lighthouse` / `pnpm run lighthouse`)");
} catch (e) {
  console.error(
    "  ! Chrome-for-Testing install failed (Lighthouse unavailable until fixed).\n" +
      "    Re-run `pnpm run setup:chrome`, or set CHROME_PATH to a Chrome/Chromium binary.\n" +
      `    (${e instanceof Error ? e.message : e})`,
  );
}

// 5. Validate everything.
try {
  execFileSync(
    process.execPath,
    [path.join(root, "scripts", "check", "docs.mjs")],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
} catch {
  failed = true;
}

if (failed) {
  console.error("\nsetup finished with problems; see above.");
  process.exit(1);
}
console.log(
  "\nsetup complete. Next: pnpm db:up · pnpm seed · pnpm dev / pnpm dev:web",
);
console.log(
  "Perf loop: make lighthouse  ·  Docs: docs/dev/local-development.md · docs/dev/go-live.md · pnpm run check",
);
