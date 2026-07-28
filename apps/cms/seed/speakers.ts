import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import config from "../src/payload.config";

const extractedDir = resolveContentDir();

type SpeakerGroup = "current" | "moderation" | "panel" | "previous";

type SpeakerData = {
  name: string;
  role: string;
  company: string | null;
  photoFilename: string;
  /** CMS enum or legacy Webflow slug; mapGroup normalizes both. */
  group: string;
  roleLine?: string;
  bio?: string;
};

function readJson(name: string): any[] {
  return JSON.parse(
    fs.readFileSync(path.join(extractedDir, `${name}.json`), "utf-8"),
  );
}

const CMS_GROUPS = new Set<SpeakerGroup>([
  "current",
  "moderation",
  "panel",
  "previous",
]);

// Accept CMS enum values (ci-content fixture / content-sync) and legacy
// Webflow slugs from older snapshots.
function mapGroup(group: string): SpeakerGroup {
  if (CMS_GROUPS.has(group as SpeakerGroup)) return group as SpeakerGroup;
  switch (group) {
    case "speakers-2026":
      return "current";
    case "moderation-2026":
      return "moderation";
    case "main-stage-homepage":
      return "panel";
    case "previous-highlights":
      return "previous";
    default:
      throw new Error(`Unknown group: ${group}`);
  }
}

// Get year based on group; current/moderation require 2026
function getYear(group: SpeakerGroup): number | null {
  if (group === "current" || group === "moderation") {
    return 2026;
  }
  return null;
}

async function run() {
  const payload = await getPayload({ config });

  // Create a mock user context with approver role for seeding
  const mockAdminReq = {
    user: {
      id: "seed-admin",
      roles: ["admin", "approver"],
      divisions: [],
    },
  };

  const speakers: SpeakerData[] = readJson("speakers");
  let created = 0;
  let createdWithoutPhoto = 0;
  let updated = 0;
  const missingPhoto: string[] = [];
  const schemaErrors: string[] = [];

  for (let index = 0; index < speakers.length; index++) {
    const speaker = speakers[index]!;
    // Identity is (name, group), not name alone: "Christian Wolf" legitimately
    // appears twice in the source (a previous-highlights speaker and an
    // unrelated main-stage-homepage panel highlight); deduping on name only
    // would silently drop the second one on every re-run.
    const mappedGroup = mapGroup(speaker.group);
    const year = getYear(mappedGroup);

    // Find media by filename. A handful of main-stage-homepage highlights
    // used to have no photo asset anywhere in the site mirror; those 5 were
    // since recovered from the live CDN (see docs/dev/local-development.md), but the lookup
    // stays a lookup rather than a hard requirement so any future gap
    // degrades the same way (publish without a photo, not skip the
    // speaker).
    const mediaResult = await payload.find({
      collection: "media",
      where: { filename: { contains: speaker.photoFilename } },
      limit: 1,
    });
    const mediaId: string | number | null =
      mediaResult.totalDocs > 0 ? mediaResult.docs[0]!.id : null;
    if (mediaId === null) {
      missingPhoto.push(
        `${speaker.name} (${mappedGroup}, photo: ${speaker.photoFilename})`,
      );
    }

    const data = {
      name: speaker.name,
      role: speaker.role,
      company: speaker.company ?? undefined,
      roleLine: speaker.roleLine ?? undefined,
      bio: speaker.bio ?? undefined,
      photo: mediaId ?? undefined,
      group: mappedGroup,
      ...(year !== null && { year }),
      order: index * 10,
      _status: "published" as const,
    };

    const existing = await payload.find({
      collection: "speakers",
      where: {
        and: [
          { name: { equals: speaker.name } },
          { group: { equals: mappedGroup } },
        ],
      },
      limit: 1,
    });

    try {
      if (existing.totalDocs > 0) {
        // Idempotent update: keeps roleLine/bio/order/photo in sync with the
        // source JSON on every re-run instead of freezing whatever the doc
        // looked like the first time it was created.
        const existingDoc = existing.docs[0]!;
        const updateData: Record<string, unknown> = { ...data };
        // Never clobber a photo a human attached in the admin with "no
        // photo" just because the filename lookup missed this run.
        if (mediaId === null && (existingDoc as any).photo) {
          delete updateData.photo;
        }
        await payload.update({
          collection: "speakers",
          id: existingDoc.id,
          req: mockAdminReq as any,
          data: updateData,
        });
        updated += 1;
        continue;
      }

      await payload.create({
        collection: "speakers",
        req: mockAdminReq as any,
        data,
      });

      created += 1;
      if (mediaId === null) createdWithoutPhoto += 1;
    } catch (err) {
      schemaErrors.push(
        `${speaker.name}: ${err instanceof Error ? err.message : String(err)}`,
      );
      console.error(`Failed to create speaker ${speaker.name}:`, err);
    }
  }

  // Verify final count
  const finalResult = await payload.find({
    collection: "speakers",
    limit: 1,
  });
  const finalCount = finalResult.totalDocs;

  console.log(`Total speakers in JSON: ${speakers.length}`);
  console.log(
    `Created: ${created} (of which without a photo: ${createdWithoutPhoto})`,
  );
  console.log(`Updated (already existed): ${updated}`);
  console.log(`Final collection count: ${finalCount}`);

  if (missingPhoto.length > 0) {
    console.log(
      "\nSpeakers with no matching photo in this run (missing from the site mirror):",
    );
    for (const item of missingPhoto) console.log(` - ${item}`);
  }

  if (schemaErrors.length > 0) {
    console.log("\nSchema errors:");
    for (const err of schemaErrors) console.log(` - ${err}`);
  }

  process.exit(schemaErrors.length > 0 ? 1 : 0);
}

await run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
