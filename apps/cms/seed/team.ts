import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import config from "../src/payload.config";

const extractedDir = resolveContentDir();

interface TeamSource {
  name: string;
  role: string;
  division: string;
  photoFilename: string;
  year: string;
  /** Optional profile URL; omitted for members who have none. */
  linkedin?: string | null;
  /** Optional email address; omitted for members who have none. */
  email?: string | null;
}

function readTeamJson(): TeamSource[] {
  return JSON.parse(
    fs.readFileSync(path.join(extractedDir, "team.json"), "utf-8"),
  );
}

type TeamDivision =
  "chair" | "pr" | "partner" | "finance" | "operations" | "concept" | "it";

// Map the display division names from team.json to the schema division values
function mapDivision(label: string): TeamDivision | null {
  const mapping: { [key: string]: TeamDivision } = {
    Chair: "chair",
    "Public Relations": "pr",
    Partner: "partner",
    Finance: "finance",
    Operations: "operations",
  };
  return mapping[label] ?? null;
}

async function run() {
  const payload = await getPayload({ config });
  const teamData = readTeamJson();

  // Ephemeral in-memory admin context for seeding; never persisted to the
  // users collection (matches speakers.ts / partners.ts). Admin passes both
  // the division scope and the approver publish gate.
  const seedUser = { id: "seed-admin", roles: ["admin"] };

  let created = 0;
  let updated = 0;

  for (let index = 0; index < teamData.length; index++) {
    const item = teamData[index]!;

    // Current members only; past-team year group photos live in
    // past-teams.json / seed/past-teams.ts.
    if (!item.name) {
      throw new Error(
        `team.json entry ${index} has no name; year group photos belong in past-teams.json`,
      );
    }

    const mappedDivision = mapDivision(item.division);
    if (!mappedDivision) {
      console.error(`Unknown division: ${item.division} for ${item.name}`);
      throw new Error(`Unknown division: ${item.division}`);
    }

    // Find the media document by filename. Fixture seed uses
    // fixture-missing-photo.webp; binaries are never in git, so skip until
    // media is pulled locally.
    const mediaResult = await payload.find({
      collection: "media",
      where: {
        filename: { contains: item.photoFilename },
      },
      limit: 1,
    });

    if (mediaResult.totalDocs === 0) {
      console.warn(
        `Media not found, skipping: ${item.photoFilename} (${item.name})`,
      );
      continue;
    }

    const mediaId = mediaResult.docs[0].id;

    // Identity: (name, year), same as the content-sync upsert key.
    const existing = await payload.find({
      collection: "team",
      where: {
        and: [{ name: { equals: item.name } }, { year: { equals: item.year } }],
      },
      limit: 1,
    });

    const data = {
      name: item.name,
      role: item.role,
      division: mappedDivision,
      photo: mediaId,
      year: item.year,
      linkedin: item.linkedin ?? null,
      email: item.email ?? null,
      order: index * 10,
    };

    try {
      if (existing.totalDocs > 0) {
        // Idempotent update: keeps order (and photo, in case the source
        // media changed) in sync on every re-run instead of only creating
        // once.
        await payload.update({
          collection: "team",
          id: existing.docs[0]!.id,
          data,
          user: seedUser as any,
        });
        updated += 1;
        continue;
      }

      // Create as draft first
      const draft = await payload.create({
        collection: "team",
        data,
        user: seedUser as any,
      });

      // Then publish with seed user (who is admin)
      await payload.update({
        collection: "team",
        id: draft.id,
        data: {
          _status: "published",
        },
        user: seedUser as any,
      });

      created += 1;
    } catch (err) {
      console.error(`Failed to seed team entry ${item.name}:`, err);
      throw err;
    }
  }

  // Verify final count
  const finalCount = await payload.find({
    collection: "team",
    limit: 1,
  });

  console.log(`Total items in source: ${teamData.length}`);
  console.log(`Created: ${created}`);
  console.log(`Updated (already existed): ${updated}`);
  console.log(`\nFinal team collection count: ${finalCount.totalDocs}`);

  process.exit(0);
}

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
