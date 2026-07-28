import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import config from "../src/payload.config";

const extractedDir = resolveContentDir();

interface PastTeamSource {
  year: string;
  photoFilename: string;
}

function readPastTeamsJson(): PastTeamSource[] {
  return JSON.parse(
    fs.readFileSync(path.join(extractedDir, "past-teams.json"), "utf-8"),
  );
}

async function run() {
  const payload = await getPayload({ config });
  const pastTeams = readPastTeamsJson();

  // Ephemeral in-memory admin context for seeding; never persisted to the
  // users collection (matches team.ts / speakers.ts). Admin passes both the
  // division scope and the approver publish gate.
  const seedUser = { id: "seed-admin", roles: ["admin"] };

  let created = 0;
  let updated = 0;

  for (const item of pastTeams) {
    // Find the media document by filename. Fixture / fresh-clone seed has no
    // binaries in git; skip the year until media is present locally.
    const mediaResult = await payload.find({
      collection: "media",
      where: {
        filename: { contains: item.photoFilename },
      },
      limit: 1,
    });

    if (mediaResult.totalDocs === 0) {
      console.warn(
        `Media not found, skipping past-team year ${item.year} (${item.photoFilename})`,
      );
      continue;
    }

    const mediaId = mediaResult.docs[0].id;

    // Identity: year (one group photo per board year; content-sync keys on
    // year too).
    const existing = await payload.find({
      collection: "past-teams",
      where: { year: { equals: item.year } },
      limit: 1,
    });

    const data = {
      year: item.year,
      photo: mediaId,
    };

    try {
      if (existing.totalDocs > 0) {
        // Idempotent update: keeps the photo in sync on every re-run instead
        // of only creating once.
        await payload.update({
          collection: "past-teams",
          id: existing.docs[0]!.id,
          data,
          user: seedUser as any,
        });
        updated += 1;
        continue;
      }

      // Create as draft first
      const draft = await payload.create({
        collection: "past-teams",
        data,
        user: seedUser as any,
      });

      // Then publish with seed user (who is admin)
      await payload.update({
        collection: "past-teams",
        id: draft.id,
        data: {
          _status: "published",
        },
        user: seedUser as any,
      });

      created += 1;
    } catch (err) {
      console.error(`Failed to seed past-team year ${item.year}:`, err);
      throw err;
    }
  }

  const finalCount = await payload.find({
    collection: "past-teams",
    limit: 1,
  });

  console.log(`Total years in source: ${pastTeams.length}`);
  console.log(`Created: ${created}`);
  console.log(`Updated (already existed): ${updated}`);
  console.log(`\nFinal past-teams collection count: ${finalCount.totalDocs}`);

  process.exit(0);
}

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
