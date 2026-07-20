#!/usr/bin/env node
// `pnpm preview:cf`: Cloudflare-native local preview of the built static
// site with a real R2 binding for /media/* (see docs/dev/local-development.md
// and docs/dev/go-live.md). Builds the Astro site in JSON content mode,
// then runs `wrangler dev` from apps/web so it picks up wrangler.jsonc
// (assets + MEDIA R2 binding + worker/index.ts).
//
// Picks the first free port starting at 8787 (wrangler's usual default)
// rather than hardcoding it: dev machines running multiple projects can
// easily have 8787 already bound by something unrelated, and this repo's
// tooling must never assume a port is free or fight another project for
// one. The chosen port is printed before wrangler starts.
//
// Run `pnpm r2:sync` (or `pnpm run seed:local-r2`) first so the local R2
// simulation actually has media -- this script does not sync media itself.

import { REPO_ROOT, WEB_DIR } from "../lib/paths.mjs";
import { findFreePort } from "../lib/ports.mjs";
import { runCommandSync } from "../lib/run.mjs";

const port = await findFreePort(8787, 20);
console.log(
  `preview:cf: using port ${port} (first free port starting from 8787)`,
);

// build:fixture, not "build": CONTENT_SOURCE is required now, and this script
// documents itself as the JSON-mode preview. Naming the mode here also stops a
// stray apps/web/.env from deciding it (that file is not read by astro build's
// process.env, so a bare build had no source at all and threw).
const buildCode = runCommandSync(
  "pnpm",
  ["--filter", "web", "run", "build:fixture"],
  {
    cwd: REPO_ROOT,
  },
);
if (buildCode !== 0) {
  console.error("preview:cf: build failed, not starting wrangler dev.");
  process.exit(buildCode);
}

process.exit(
  runCommandSync("pnpm", ["exec", "wrangler", "dev", "--port", String(port)], {
    cwd: WEB_DIR,
  }),
);
