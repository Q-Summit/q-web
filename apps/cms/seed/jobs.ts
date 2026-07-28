import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import { JSDOM } from "jsdom";
import { convertHTMLToLexical } from "@payloadcms/richtext-lexical";
import config from "../src/payload.config";

const extractedDir = resolveContentDir();

type Job = {
  slug: string;
  company: string;
  title: string;
  location?: string | null;
  workload?: string | null;
  richTextHtml: string;
  applyUrl: string;
  logoFilename?: string | null;
};

function readJson(name: string): Job[] {
  return JSON.parse(
    fs.readFileSync(path.join(extractedDir, `${name}.json`), "utf-8"),
  );
}

type JobWorkload = "full-time" | "internship" | "working-student";

const workloadMap: Record<string, JobWorkload> = {
  "Full Time": "full-time",
  "Full-Time": "full-time",
  Internship: "internship",
  "Working Student": "working-student",
};

function mapWorkload(value: string | null | undefined): JobWorkload | null {
  if (!value) return null;
  const mapped = workloadMap[value];
  if (!mapped) {
    console.warn(`Unmapped workload value: ${JSON.stringify(value)}`);
    return null;
  }
  return mapped;
}

async function run() {
  const payload = await getPayload({ config });

  const jobsCollectionConfig = payload.collections.jobs.config;
  const descriptionField: any = jobsCollectionConfig.fields.find(
    (f: any) => f.name === "description",
  );
  const sanitizedEditorConfig = descriptionField?.editor?.editorConfig;
  if (!sanitizedEditorConfig) {
    throw new Error(
      "Could not resolve sanitized editor config for jobs.description field",
    );
  }

  const jobs = readJson("jobs");

  let created = 0;
  let updated = 0;
  let missingLogo = 0;
  const unfittedValues: string[] = [];

  for (let index = 0; index < jobs.length; index++) {
    const job = jobs[index]!;
    const existing = await payload.find({
      collection: "jobs",
      where: { slug: { equals: job.slug } },
      limit: 1,
    });

    if (existing.totalDocs > 0) {
      // Idempotent update: keeps `order` (seeded as JSON array index times 10,
      // see docs/architecture/08-concepts.md) in sync on every re-run
      // instead of freezing it at whatever it was on first create.
      await payload.update({
        collection: "jobs",
        id: existing.docs[0]!.id,
        data: { order: index * 10 },
        user: { id: "seed-admin", roles: ["admin"] } as any,
        overrideAccess: true,
      });
      updated += 1;
      continue;
    }

    let logoId: string | number | null = null;
    if (job.logoFilename) {
      const media = await payload.find({
        collection: "media",
        where: { filename: { equals: job.logoFilename } },
        limit: 1,
      });
      if (media.totalDocs > 0) {
        logoId = media.docs[0]!.id;
      } else {
        // fuzzy match: media filenames may have an extra hash prefix or
        // different extension than the referenced logoFilename.
        const stem = job.logoFilename.replace(/\.[^.]+$/, "").toLowerCase();
        const all = await payload.find({
          collection: "media",
          where: {},
          limit: 1000,
        });
        const match = all.docs.find(
          (d: any) =>
            typeof d.filename === "string" &&
            d.filename.toLowerCase().includes(stem),
        );
        if (match) {
          logoId = match.id;
        }
      }
    }

    const workload = mapWorkload(job.workload);
    if (job.workload && !workload) {
      unfittedValues.push(
        `workload=${JSON.stringify(job.workload)} on ${job.slug}`,
      );
    }

    if (!logoId) {
      missingLogo += 1;
      unfittedValues.push(`missing logo for ${job.slug} (${job.logoFilename})`);
      console.warn(
        `Skipping ${job.slug}: no local media for logo (expected on fixture seed)`,
      );
      continue;
    }

    const description = convertHTMLToLexical({
      editorConfig: sanitizedEditorConfig,
      html: job.richTextHtml,
      JSDOM,
    });

    try {
      await retry(() =>
        payload.create({
          collection: "jobs",
          data: {
            slug: job.slug,
            company: job.company,
            title: job.title,
            location: job.location ?? null,
            workload: workload ?? null,
            description,
            applyUrl: job.applyUrl,
            logo: logoId as number,
            order: index * 10,
            _status: "published",
          },
          user: { id: "seed-admin", roles: ["admin"] } as any,
          overrideAccess: true,
        }),
      );
      created += 1;
    } catch (err) {
      // applyUrl validation accepts http(s) URLs and mailto: addresses (both
      // are valid live-site content, see Jobs.ts); this is now a safety net
      // for any other genuinely malformed value, reported rather than
      // aborting the whole run.
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Apply Url")) {
        unfittedValues.push(
          `applyUrl "${job.applyUrl}" on ${job.slug} does not fit schema (requires http/https/mailto); skipped`,
        );
        console.warn(`Skipping ${job.slug}: invalid applyUrl ${job.applyUrl}`);
        continue;
      }
      console.error(`Failed to create job ${job.slug}:`, err);
      throw err;
    }
  }

  const count = await payload.count({ collection: "jobs" });

  console.log(`Jobs in source: ${jobs.length}`);
  console.log(`Created: ${created}`);
  console.log(`Updated (already existed): ${updated}`);
  console.log(`Missing logo: ${missingLogo}`);
  console.log(`Final jobs count (Local API): ${count.totalDocs}`);
  if (unfittedValues.length > 0) {
    console.log("Values that did not fit schema or were missing:");
    for (const v of unfittedValues) console.log(` - ${v}`);
  }

  process.exit(0);
}

async function retry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn("Transient error, retrying once:", err);
    return await fn();
  }
}

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
