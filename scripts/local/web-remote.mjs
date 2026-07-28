#!/usr/bin/env node
// `pnpm dev:web:remote` (root): the safest way to "see real text" -- runs
// the Astro dev server in cms content mode against the DEPLOYED CMS's
// public REST API. Read-only, no database credentials involved at all (see
// docs/dev/local-development.md).

import { spawn } from "node:child_process";

import { parseEnvFile, requireEnvKeys, resolveEnvValue } from "../lib/env.mjs";
import { CMS_ENV_REMOTE, REPO_ROOT } from "../lib/paths.mjs";

const remoteEnv = parseEnvFile(CMS_ENV_REMOTE);
try {
  requireEnvKeys("dev:web:remote", ["REMOTE_CMS_URL"], process.env, remoteEnv);
} catch (error) {
  console.error("");
  console.error(error.message);
  console.error(
    "Copy apps/cms/.env.remote.example to apps/cms/.env.remote and fill it in.",
  );
  console.error("");
  process.exit(1);
}
const cmsUrl = resolveEnvValue("REMOTE_CMS_URL", process.env, remoteEnv);

console.log(
  `dev:web:remote: CONTENT_SOURCE=cms CMS_URL=${cmsUrl} (read-only REST, no DB access)`,
);

const child = spawn("pnpm", ["--filter", "web", "run", "dev"], {
  cwd: REPO_ROOT,
  env: {
    ...process.env,
    CONTENT_SOURCE: "cms",
    CMS_URL: cmsUrl,
    // CMS mode requires the CMS origin for the Live Preview postMessage check.
    // Same origin we read content from here, since that is the CMS host.
    PUBLIC_CMS_URL: cmsUrl,
  },
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
