// Seed preflight: fail fast, before any rows are written, when the fixture
// is missing. Without this, users.ts would seed first and a later content
// seed would abort, leaving a users-but-no-content DB that seed-if-empty
// then treats as already seeded. Also states loudly that seeds are FAKE.
import { resolveContentDir } from "./content-dir";

try {
  const dir = resolveContentDir();
  console.log(`seed preflight: seeding FAKE fixture content from ${dir}`);
  console.log(
    "seed preflight: fine for a workbench. Real content: pull from the " +
      "remote CMS with maintainer-shared creds, make pull ARGS='--import' " +
      "(docs/dev/content-sync.md).",
  );
  process.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
