// Repo path anchors shared by root scripts. Keep this the only place that
// walks from scripts/lib/ up to the monorepo root.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path to the q-web monorepo root. */
export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

/**
 * True when `dir` is a SEPARATE checkout of this repo rather than part of this
 * one: an agent worktree under .claude/worktrees/, or a nested clone.
 *
 * Root gates (check:docs, check:design) walk from REPO_ROOT and key every
 * exemption on a repo-relative path (the CI content fixture, LICENSE.md, a
 * script exempting itself). A nested checkout's files sit one prefix deeper, so
 * they match none of those and the gate fails on a tree it does not own, citing
 * another branch's files. Skip such a directory: that checkout runs its own
 * gate. Tools that select files by glob instead of walking need the same
 * exclusion in their ignore list (see eslint.config.mjs).
 *
 * `git worktree add` writes .git as a file, `git clone` as a directory, so this
 * tests existence rather than type. REPO_ROOT is excluded explicitly: it has a
 * .git too, and treating it as foreign would skip the whole repo.
 */
export const isNestedCheckout = (dir) =>
  dir !== REPO_ROOT && fs.existsSync(path.join(dir, ".git"));

export const CMS_DIR = path.join(REPO_ROOT, "apps/cms");
export const WEB_DIR = path.join(REPO_ROOT, "apps/web");
export const CMS_ENV = path.join(CMS_DIR, ".env");
export const CMS_ENV_REMOTE = path.join(CMS_DIR, ".env.remote");
export const CMS_ENV_VERCEL = path.join(CMS_DIR, ".env.vercel");
