import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import config from "../src/payload.config";

type TestimonialSource = {
  quote: string;
  attribution: string;
  photoFilename?: string | null;
};

// Read the mirrored source data at runtime (like the other seeds) rather than
// a compile-time JSON import, so tsc does not need the external mirror present.
const extractedDir = resolveContentDir();
const testimonialsData = JSON.parse(
  fs.readFileSync(
    path.join(extractedDir, "partner-testimonials.json"),
    "utf-8",
  ),
);

const payload = await getPayload({ config });

const testimonials = testimonialsData as TestimonialSource[];

let created = 0;
let updated = 0;
const missingPhoto: string[] = [];
const errors: string[] = [];

for (let index = 0; index < testimonials.length; index++) {
  const testimonial = testimonials[index]!;

  let photoId: string | number | null = null;
  if (testimonial.photoFilename) {
    const media = await payload.find({
      collection: "media",
      where: { filename: { contains: testimonial.photoFilename } },
      limit: 1,
    });
    if (media.totalDocs > 0) {
      photoId = media.docs[0]!.id;
    } else {
      missingPhoto.push(
        `${testimonial.attribution} (${testimonial.photoFilename})`,
      );
    }
  }

  try {
    const existing = await payload.find({
      collection: "testimonials",
      where: { attribution: { equals: testimonial.attribution } },
      limit: 1,
    });

    const data = {
      quote: testimonial.quote,
      attribution: testimonial.attribution,
      photo: photoId ?? undefined,
      order: index * 10,
      _status: "published" as const,
    };

    if (existing.docs.length > 0) {
      // Idempotent update: re-running the seed keeps quote/photo/order in
      // sync with the source JSON instead of only creating once and
      // drifting forever.
      await payload.update({
        collection: "testimonials",
        id: existing.docs[0]!.id,
        data,
        user: { id: "seed-admin", roles: ["admin"] } as any,
        overrideAccess: true,
      });
      updated += 1;
    } else {
      await payload.create({
        collection: "testimonials",
        data,
        user: { id: "seed-admin", roles: ["admin"] } as any,
        overrideAccess: true,
      });
      created += 1;
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`${testimonial.attribution}: ${msg}`);
    console.error(
      `Failed to seed testimonial "${testimonial.attribution}":`,
      error,
    );
  }
}

const finalCount = await payload.count({ collection: "testimonials" });

console.log("\n=== Testimonials Seeding Summary ===");
console.log(`Total in source: ${testimonials.length}`);
console.log(`Created: ${created}`);
console.log(`Updated: ${updated}`);
console.log(`Total in collection: ${finalCount.totalDocs}`);

if (missingPhoto.length > 0) {
  console.log("\nTestimonials with no matching media (photo left empty):");
  for (const item of missingPhoto) console.log(` - ${item}`);
}

if (errors.length > 0) {
  console.log("\n=== Errors ===");
  errors.forEach((err) => console.log(`  - ${err}`));
}

process.exit(errors.length > 0 ? 1 : 0);
