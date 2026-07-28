/**
 * Import a content package into the LOCAL CMS as drafts (payload run).
 * Flags: --dir <packageDir>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";

import config from "../payload.config";
import { applyContentPackage } from "../content-sync/apply-package";
import { loadSyncUser } from "../content-sync/auth";
import type { ContentPackage } from "../content-sync/package-types";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, "../../../..");

function argValue(flag: string): string | undefined {
  const args = process.argv.filter((a) => a !== "--");
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  return args[i + 1];
}

function loadPackage(dir: string): ContentPackage {
  const bundlePath = path.join(dir, "bundle.json");
  if (!fs.existsSync(bundlePath)) {
    throw new Error(`No bundle.json in ${dir}`);
  }
  return JSON.parse(fs.readFileSync(bundlePath, "utf-8")) as ContentPackage;
}

const run = async () => {
  const dirRel = argValue("--dir") ?? "scripts/content-packages/current";
  const dir = path.isAbsolute(dirRel) ? dirRel : path.join(root, dirRel);
  const pkg = loadPackage(dir);

  const payload = await getPayload({ config });
  const syncUser = await loadSyncUser(payload);
  if (!syncUser) {
    throw new Error(
      "sync user missing; set CONTENT_SYNC_USER_EMAIL to you@q-summit.com, seed (local) or Google-login once (prod)",
    );
  }

  const result = await applyContentPackage({
    payload,
    user: syncUser,
    pkg,
    dryRun: false,
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) process.exit(1);
  process.exit(0);
};

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
