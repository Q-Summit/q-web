/**
 * Content source resolution (json | cms) and JSON-file helpers.
 *
 * CONTENT_SOURCE fails closed on anything unrecognized: see resolveContentSource.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function defaultContentDir(): string {
  // Explicit override wins, so a build can PIN its content dir instead of
  // depending on what happens to exist on the machine. `build:fixture` sets
  // it: without that, a maintainer who has restored the real snapshot to
  // apps/web/content/ (for the go-live parity diff, or during a CMS outage)
  // would have `pnpm run check` quietly gate on the SNAPSHOT while CI gates on
  // the fixture -- two different builds wearing the same name.
  const override = process.env.WEB_CONTENT_DIR?.trim();
  if (override) return resolve(override);

  const anchors = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
  for (const anchor of anchors) {
    let dir = anchor;
    for (let depth = 0; depth < 8; depth++) {
      for (const candidate of [
        join(dir, "content"),
        join(dir, "test", "fixtures", "ci-content"),
      ]) {
        if (existsSync(join(candidate, "partners.json"))) return candidate;
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  // Nothing found: return a plausible path so the eventual read error names
  // a sensible location (or use CONTENT_SOURCE=cms).
  return join(process.cwd(), "content");
}

const CONTENT_DIR = defaultContentDir();

/**
 * Resolve the content source, failing closed on anything unrecognized.
 *
 * The old rule was `=== "cms" ? "cms" : "json"`, which quietly treated every
 * other value -- including a typo like `CONTENT_SOURCE=CMS`, and including
 * UNSET -- as "build the committed fake fixture". On a production Workers
 * Build there is no `content/` directory (it is gitignored), so that fallback
 * resolves to apps/web/test/fixtures/ci-content and emits a complete, green,
 * deployable site made of "Fixture Platinum Partner 1" placeholder data.
 * A misconfigured deploy has to fail loudly, not ship fake content.
 *
 * So the value is now required and closed: exactly "cms" or "json", and every
 * entry point (package.json scripts, scripts/local/*, cms-build.yml) states
 * which one it means.
 */
function resolveContentSource(): "cms" | "json" {
  const raw = process.env.CONTENT_SOURCE?.trim();
  if (raw === "cms") return "cms";
  if (raw === "json") return "json";
  throw new Error(
    raw
      ? `[content] CONTENT_SOURCE="${raw}" is not a valid value; use "cms" or "json".`
      : '[content] CONTENT_SOURCE is unset. Set it explicitly: "cms" for production, preview, and ' +
          '`make dev` (also needs CMS_URL and PUBLIC_CMS_URL, see docs/dev/go-live.md), or "json" to ' +
          "build the committed fake fixture (`make dev-web`, `pnpm --filter web run build:fixture`).",
  );
}

export const CONTENT_SOURCE = resolveContentSource();

if (CONTENT_SOURCE === "cms" && !process.env.CMS_URL?.trim()) {
  throw new Error(
    "[content] CONTENT_SOURCE=cms requires CMS_URL (the published CMS origin used to fetch content at build time). " +
      "Example: https://cms.q-summit.de. Local: http://localhost:3000 (see apps/web package.json build:cms / go-live.md).",
  );
}
export const CMS_URL = (process.env.CMS_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

// In CMS mode the site client needs the CMS origin at runtime for the Live
// Preview postMessage origin check. Defaulting it to localhost in a production
// bundle would bake an origin that can never match into the live HTML, so the
// build fails here instead (see components/live-preview/LivePreviewBoot.astro).
if (CONTENT_SOURCE === "cms" && !process.env.PUBLIC_CMS_URL?.trim()) {
  throw new Error(
    "[content] CONTENT_SOURCE=cms requires PUBLIC_CMS_URL (the CMS origin, e.g. https://cms.q-summit.de). " +
      "It is the origin the Live Preview client checks postMessage events against; without it the client " +
      "would fall back to http://localhost:3000 in production HTML.",
  );
}

// One read+parse per JSON file per build, shared across every getter call.
// Static content never changes within a build, so without this a file like
// site-settings.json (read by getSiteSettings from Nav, Footer, and most
// pages) was re-read and re-parsed on the order of ~250x per build. Mirrors
// the cms* caches below, which already memoize their fetched/mapped results.
const jsonFileCache = new Map<string, Promise<unknown>>();

export function readJson<T>(filename: string): Promise<T> {
  const cached = jsonFileCache.get(filename);
  if (cached) return cached as Promise<T>;
  const promise = (async () => {
    const raw = await readFile(join(CONTENT_DIR, filename), "utf-8");
    return JSON.parse(raw) as T;
  })();
  jsonFileCache.set(filename, promise);
  return promise;
}
