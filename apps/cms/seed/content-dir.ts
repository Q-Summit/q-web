import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Resolve the JSON dir local seed scripts read: always the committed fake
 * fixture. Real content is never seeded from files; it lives in the CMS and
 * comes down via `make pull` with maintainer-shared remote creds
 * (docs/dev/content-sync.md).
 */
export function resolveContentDir(
  fromModuleUrl: string = import.meta.url,
): string {
  const dirname = path.dirname(fileURLToPath(fromModuleUrl));
  // apps/cms/seed → apps/web/test/fixtures/ci-content
  const fixture = path.resolve(dirname, "../../web/test/fixtures/ci-content");
  if (fs.existsSync(path.join(fixture, "partners.json"))) {
    return fixture;
  }
  throw new Error(
    "Content fixture missing at apps/web/test/fixtures/ci-content. " +
      "Restore it from git; live edits go through Payload, not JSON files.",
  );
}
