import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload, type Payload } from "payload";

import config from "../src/payload.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const localKickoffPath = path.resolve(
  dirname,
  "../../../scripts/content-packages/local/kickoff.json",
);
const webMediaDir = path.resolve(dirname, "../../web/public/media");

const seedUser = { id: "seed-admin", roles: ["admin", "approver"] } as any;
const toTextRows = (values: string[]) => values.map((text) => ({ text }));

function localMediaFilename(href: string | null | undefined): string {
  const value = (href ?? "").trim();
  if (!value.startsWith("/media/")) return "";
  return value.slice("/media/".length);
}

async function ensureMedia(
  payload: Payload,
  href: string | null | undefined,
  alt: string | null | undefined,
): Promise<number | null> {
  const filename = localMediaFilename(href);
  if (!filename) return null;

  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: path.basename(filename) } },
    limit: 1,
  });
  if (existing.totalDocs > 0) return existing.docs[0]!.id as number;

  const sourcePath = path.join(webMediaDir, filename);
  if (!fs.existsSync(sourcePath)) {
    console.warn(
      `  kickoff media missing on disk (${filename}); leaving upload unset until the file is added through Payload`,
    );
    return null;
  }

  const created = await payload.create({
    collection: "media",
    data: { alt: alt?.trim() || path.basename(filename) },
    filePath: sourcePath,
  });
  console.log(`  created media for ${filename} (id=${created.id})`);
  return created.id as number;
}

async function run() {
  if (!fs.existsSync(localKickoffPath)) {
    console.log(
      "seed/kickoff: no scripts/content-packages/local/kickoff.json; skipping",
    );
    process.exit(0);
  }

  const payload = await getPayload({ config });
  const content = JSON.parse(fs.readFileSync(localKickoffPath, "utf-8"));

  const heroImage = await ensureMedia(
    payload,
    content.hero.image,
    content.hero.imageAlt,
  );
  const companyLogo = await ensureMedia(
    payload,
    content.kickoff.company.logo,
    content.kickoff.company.logoAlt,
  );

  const speakers = [];
  for (const speaker of content.kickoff.speakers ?? []) {
    const image = await ensureMedia(payload, speaker.image, speaker.imageAlt);
    speakers.push({
      name: speaker.name,
      role: speaker.role || null,
      bio: speaker.bio || null,
      linkedin: speaker.linkedin || null,
      ...(image !== null ? { image } : {}),
      imageAlt: speaker.imageAlt || null,
      crop: {
        x: speaker.crop?.x ?? 50,
        y: speaker.crop?.y ?? 24,
        zoom: speaker.crop?.zoom ?? 100,
        shiftY: speaker.crop?.shiftY ?? 0,
      },
    });
  }

  const moments = [];
  for (const moment of content.journey.moments ?? []) {
    const image = await ensureMedia(payload, moment.image, moment.imageAlt);
    moments.push({
      title: moment.title,
      text: moment.text,
      ...(image !== null ? { image } : {}),
      imageAlt: moment.imageAlt || null,
    });
  }

  await payload.updateGlobal({
    slug: "page-kickoff",
    data: {
      title: content.title,
      metaDescription: content.metaDescription,
      hero: {
        eyebrow: content.hero.eyebrow,
        headline: content.hero.headline,
        copy: content.hero.copy,
        ...(heroImage !== null ? { image: heroImage } : {}),
        imageAlt: content.hero.imageAlt || null,
        primaryCta: content.hero.primaryCta,
        secondaryCta: content.hero.secondaryCta,
      },
      kickoff: {
        eyebrow: content.kickoff.eyebrow,
        heading: content.kickoff.heading,
        intro: content.kickoff.intro,
        date: content.kickoff.date,
        location: content.kickoff.location,
        panelTitle: content.kickoff.panelTitle,
        ui: content.kickoff.ui,
        company: {
          name: content.kickoff.company.name,
          href: content.kickoff.company.href || null,
          ...(companyLogo !== null ? { logo: companyLogo } : {}),
          logoAlt: content.kickoff.company.logoAlt || null,
        },
        speakers,
      },
      socials: content.socials,
      quiz: {
        eyebrow: content.quiz.eyebrow,
        heading: content.quiz.heading,
        intro: content.quiz.intro,
        ui: content.quiz.ui,
        start: content.quiz.start,
        questions: (content.quiz.questions ?? []).map((question: any) => ({
          kicker: question.kicker,
          question: question.question,
          answers: (question.answers ?? []).map((answer: any) => ({
            answerId: answer.answerId ?? answer.id,
            text: answer.text,
            tags: toTextRows(answer.tags ?? []),
          })),
        })),
        results: (content.quiz.results ?? []).map((result: any) => ({
          team: result.team,
          text: result.text,
          notionHref: result.notionHref || null,
        })),
        resultCopy: content.quiz.resultCopy,
      },
      journey: {
        eyebrow: content.journey.eyebrow,
        heading: content.journey.heading,
        intro: content.journey.intro,
        hint: content.journey.hint,
        moments,
      },
      application: content.application,
      finalCta: content.finalCta,
      _status: "published",
    },
    user: seedUser,
    overrideAccess: true,
  });

  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      kickoff: {
        pageEnabled: true,
        redirectRoot: true,
      },
      _status: "published",
    },
    user: seedUser,
    overrideAccess: true,
  });

  console.log("page-kickoff: updated and published from local/kickoff.json");
  console.log("site-settings.kickoff: pageEnabled=true redirectRoot=true");
  process.exit(0);
}

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
