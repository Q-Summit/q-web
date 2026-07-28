import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import { JSDOM } from "jsdom";
import { convertHTMLToLexical } from "@payloadcms/richtext-lexical";
import config from "../src/payload.config";

const extractedDir = resolveContentDir();

type Faq = {
  question: string;
  answerHtml: string;
  page: string;
};

function readJson(name: string): Faq[] {
  return JSON.parse(
    fs.readFileSync(path.join(extractedDir, `${name}.json`), "utf-8"),
  );
}

type FaqPage = "home" | "program" | "hackathon";

const pageMap: Record<string, FaqPage> = {
  index: "home",
  home: "home",
  program: "program",
  hackathon: "hackathon",
};

function mapPage(value: string | null | undefined): FaqPage | null {
  if (!value) return null;
  const mapped = pageMap[value];
  if (!mapped) {
    console.warn(`Unmapped page value: ${JSON.stringify(value)}`);
    return null;
  }
  return mapped;
}

async function run() {
  const payload = await getPayload({ config });

  const faqsCollectionConfig = payload.collections.faqs.config;
  const answerField: any = faqsCollectionConfig.fields.find(
    (f: any) => f.name === "answer",
  );
  const sanitizedEditorConfig = answerField?.editor?.editorConfig;
  if (!sanitizedEditorConfig) {
    throw new Error(
      "Could not resolve sanitized editor config for faqs.answer field",
    );
  }

  const faqs = readJson("faqs");

  let created = 0;
  let skipped = 0;
  const unfittedValues: string[] = [];

  for (let index = 0; index < faqs.length; index++) {
    const faq = faqs[index];

    // Check if already exists by question and page
    const existing = await payload.find({
      collection: "faqs",
      where: {
        and: [
          { question: { equals: faq.question } },
          { page: { equals: mapPage(faq.page) } },
        ],
      },
      limit: 1,
    });

    if (existing.totalDocs > 0) {
      skipped += 1;
      continue;
    }

    const page = mapPage(faq.page);
    if (faq.page && !page) {
      unfittedValues.push(
        `page="${faq.page}" on question "${faq.question}" does not fit schema (valid: home, program, hackathon)`,
      );
      continue;
    }

    const answer = convertHTMLToLexical({
      editorConfig: sanitizedEditorConfig,
      html: faq.answerHtml,
      JSDOM,
    });

    try {
      await retry(() =>
        payload.create({
          collection: "faqs",
          data: {
            question: faq.question,
            answer,
            page: page ?? "home",
            order: index * 10,
            _status: "published",
          },
          user: { id: "seed-admin", roles: ["admin"] } as any,
          overrideAccess: true,
        }),
      );
      created += 1;
    } catch (err) {
      const _message = err instanceof Error ? err.message : String(err);
      console.error(`Failed to create FAQ "${faq.question}":`, err);
      throw err;
    }
  }

  const count = await payload.count({ collection: "faqs" });

  console.log(`FAQs in source: ${faqs.length}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already existed): ${skipped}`);
  console.log(`Final faqs count (Local API): ${count.totalDocs}`);
  if (unfittedValues.length > 0) {
    console.log("Values that did not fit schema:");
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
