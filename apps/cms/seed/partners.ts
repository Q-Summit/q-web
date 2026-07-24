import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import config from "../src/payload.config";

// Read the mirrored source data at runtime (like the other seeds) rather than
// a compile-time JSON import, so tsc does not need the external mirror present.
const extractedDir = resolveContentDir();
const partnersData = JSON.parse(
  fs.readFileSync(path.join(extractedDir, "partners.json"), "utf-8"),
);

const payload = await getPayload({ config });

// Map tier display names to lowercase values
const tierMap: Record<string, string> = {
  Platinum: "platinum",
  Gold: "gold",
  Silver: "silver",
  Starter: "starter",
  Knowledge: "knowledge",
  Event: "event",
  Mobility: "mobility",
  "University and Network": "university-and-network",
  Media: "media",
};

let created = 0;
let updated = 0;
const errors: string[] = [];

// Query media collection to build filename -> id map
const mediaQuery = await payload.find({
  collection: "media",
  limit: 500,
  where: {},
});

const mediaByFilename = new Map<string, string>();
mediaQuery.docs.forEach((doc: any) => {
  if (doc.filename) {
    mediaByFilename.set(doc.filename, doc.id);
  }
});

console.log(`Found ${mediaByFilename.size} media files`);

const partnersList = partnersData as any[];
for (let index = 0; index < partnersList.length; index++) {
  const partner = partnersList[index];
  try {
    // Check if partner already exists by name
    const existing = await payload.find({
      collection: "partners",
      where: {
        name: {
          equals: partner.name,
        },
      },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      // Idempotent update: keeps `order` (seeded as JSON array index times 10,
      // see docs/architecture/08-concepts.md) and websiteUrl in sync on
      // every re-run instead of freezing them at whatever they were on
      // first create.
      await payload.update({
        collection: "partners",
        id: existing.docs[0]!.id,
        data: { order: index * 10, websiteUrl: partner.websiteUrl || "" },
        user: { id: "seed-admin", roles: ["admin"] } as any,
      });
      console.log(`Updated (exists): ${partner.name}`);
      updated++;
      continue;
    }

    // Get logo ID from media filename
    const logoId = mediaByFilename.get(partner.logoFilename);
    if (!logoId) {
      errors.push(`Logo not found: ${partner.name} (${partner.logoFilename})`);
      continue;
    }

    // Map tier
    const tier = tierMap[partner.tier];
    if (!tier) {
      errors.push(`Invalid tier: ${partner.name} (${partner.tier})`);
      continue;
    }

    // Keep websiteUrl verbatim so JSON mode and CMS mode stay aligned.
    const websiteUrl = partner.websiteUrl || "";

    // Create partner with admin user context to bypass approval gate
    await payload.create({
      collection: "partners",
      data: {
        name: partner.name,
        tier: tier as
          | "platinum"
          | "gold"
          | "silver"
          | "starter"
          | "knowledge"
          | "event"
          | "mobility"
          | "university-and-network"
          | "media",
        websiteUrl,
        logo: logoId as unknown as number,
        order: index * 10,
        _status: "published", // Ensure published
      },
      user: { id: "seed-admin", roles: ["admin"] } as any,
    });

    console.log(`Created: ${partner.name}`);
    created++;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`${partner.name}: ${msg}`);
  }
}

// Query final count
const finalCountResult = await payload.count({
  collection: "partners",
});

console.log("\n=== Seeding Summary ===");
console.log(`Created: ${created}`);
console.log(`Updated (already existed): ${updated}`);
console.log(`Total in collection: ${finalCountResult.totalDocs}`);

if (errors.length > 0) {
  console.log("\n=== Errors ===");
  errors.forEach((err) => console.log(`  - ${err}`));
}

process.exit(errors.length > 0 ? 1 : 0);
