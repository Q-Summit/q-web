// Repo path anchors shared by root scripts. Keep this the only place that
// walks from scripts/lib/ up to the monorepo root.

import path from "node:path";
import { fileURLToPath } from "node:url";

/** Absolute path to the q-web monorepo root. */
export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export const CMS_DIR = path.join(REPO_ROOT, "apps/cms");
export const WEB_DIR = path.join(REPO_ROOT, "apps/web");
export const CMS_ENV = path.join(CMS_DIR, ".env");
export const CMS_ENV_REMOTE = path.join(CMS_DIR, ".env.remote");
export const CMS_ENV_VERCEL = path.join(CMS_DIR, ".env.vercel");
