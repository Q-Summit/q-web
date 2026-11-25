import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import config from "../src/payload.config";

type HotTopicSource = {
  keyword: string;
  title: string;
  field: string;
  description: string;
  imageFilename: string;
  imageAlt: string;
  thumbFilename?: string | null;
};

const topics = JSON.parse(
  fs.readFileSync(path.join(resolveContentDir(), "hot-topics.json"), "utf-8"),
) as HotTopicSource[];

const payload = await getPayload({ config });

async function mediaId(filename: string): Promise<number | null> {
  const media = await payload.find({
    collection: "media",
    where: { filename: { contains: filename } },
    limit: 1,
  });
  return media.totalDocs > 0 ? media.docs[0]!.id : null;
}

let created = 0;
let updated = 0;
const skipped: string[] = [];
const errors: string[] = [];

for (let index = 0; index < topics.length; index++) {
  const topic = topics[index]!;
  // The sphere is required. The fake fixture names files that are not in a
  // fresh local media library, so a topic without its image is reported and
  // skipped instead of failing the whole seed (the page hides an empty list).
  const image = await mediaId(topic.imageFilename);
  if (image === null) {
    skipped.push(`${topic.keyword} (image: ${topic.imageFilename})`);
    continue;
  }
  const thumb = topic.thumbFilename ? await mediaId(topic.thumbFilename) : null;

  const data = {
    keyword: topic.keyword,
    title: topic.title,
    field: topic.field,
    description: topic.description,
    image,
    thumb: thumb ?? undefined,
    order: index * 10,
    _status: "published" as const,
  };

  try {
    const existing = await payload.find({
      collection: "hot-topics",
      where: { keyword: { equals: topic.keyword } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      await payload.update({
        collection: "hot-topics",
        id: existing.docs[0]!.id,
        data,
        user: { id: "seed-admin", roles: ["admin"] } as any,
        overrideAccess: true,
      });
      updated += 1;
    } else {
      await payload.create({
        collection: "hot-topics",
        data,
        user: { id: "seed-admin", roles: ["admin"] } as any,
        overrideAccess: true,
      });
      created += 1;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`${topic.keyword}: ${msg}`);
    console.error(`Failed to seed hot topic "${topic.keyword}":`, error);
  }
}

console.log("\n=== Hot Topics Seeding Summary ===");
console.log(`Total in source: ${topics.length}`);
console.log(`Created: ${created}`);
console.log(`Updated: ${updated}`);
if (skipped.length > 0) {
  console.log("\nSkipped, no matching media for the required image:");
  for (const item of skipped) console.log(` - ${item}`);
}
if (errors.length > 0) {
  console.log("\n=== Errors ===");
  errors.forEach((err) => console.log(`  - ${err}`));
}

process.exit(errors.length > 0 ? 1 : 0);
