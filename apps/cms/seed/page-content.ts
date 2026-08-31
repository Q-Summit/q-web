import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveContentDir } from "./content-dir";
import { getPayload, type Payload } from "payload";
import config from "../src/payload.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const extractedDir = resolveContentDir();
const webMediaDir = path.resolve(dirname, "../../web/public/media");

// Seeds the 12 per-page globals from page-content.json. Field shapes mirror
// apps/web/src/lib/content.ts's PageContent 1:1; the only reshaping done
// here is wrapping plain string[]/boolean[] JSON arrays into Payload's
// named-subfield array rows (see globals/shared-fields.ts + PageTickets.ts).
// Idempotent: updateGlobal always overwrites the single document per slug.

function readJson(name: string): any {
  return JSON.parse(
    fs.readFileSync(path.join(extractedDir, `${name}.json`), "utf-8"),
  );
}

const seedUser = { id: "seed-admin", roles: ["admin", "approver"] } as any;

const toTextRows = (values: string[]) => values.map((text) => ({ text }));
const toValueRows = (values: boolean[]) => values.map((value) => ({ value }));

// whyq audience photos are the only images referenced by page copy; the
// component (FeatureSection.astro, off-limits here) derives its srcset from
// a base filename + code-side extension registry, so the canonical upload
// is the -800 variant of each (matching the `src` FeatureSection renders).
// Binaries are never in git: seed uploads only when a local/MinIO mirror
// already placed the file under public/media (same soft-miss as seed/media.ts).
const WHYQ_IMAGE_EXT: Record<string, "webp" | "jpg"> = {
  "whyq-attendees": "webp",
  "whyq-startups": "webp",
  "whyq-investors": "webp",
  "whyq-partners": "jpg",
  "whyq-founders": "webp",
};

async function resolveWhyqImageId(
  payload: Payload,
  imageFile: string,
  alt: string,
): Promise<number | null> {
  const ext = WHYQ_IMAGE_EXT[imageFile];
  if (!ext) {
    console.warn(
      `  no known asset extension for whyq image "${imageFile}"; leaving image unset`,
    );
    return null;
  }
  const uploadFilename = `${imageFile}-800.${ext}`;

  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: uploadFilename } },
    limit: 1,
  });
  if (existing.totalDocs > 0) return existing.docs[0]!.id as number;

  const sourcePath = path.join(webMediaDir, uploadFilename);
  if (!fs.existsSync(sourcePath)) {
    console.warn(
      `  whyq image missing on disk (${uploadFilename}); leave unset until media is pulled locally`,
    );
    return null;
  }

  const created = await payload.create({
    collection: "media",
    data: { alt },
    filePath: sourcePath,
  });
  console.log(`  created media for ${uploadFilename} (id=${created.id})`);
  return created.id as number;
}

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
  const payload = await getPayload({ config });
  const content = readJson("page-content");

  // page-home
  {
    const home = content.home;
    await payload.updateGlobal({
      slug: "page-home",
      data: {
        title: home.title,
        metaDescription: home.metaDescription,
        hero: {
          headline: home.hero.headline,
          tagline: home.hero.tagline,
          announcementLines: toTextRows(home.hero.announcementLines),
          cta: home.hero.cta,
        },
        event: {
          startDate: home.event.startDate,
          endDate: home.event.endDate,
        },
        stats: {
          heading: home.stats.heading,
          intro: home.stats.intro,
          items: home.stats.items.map((item: any) => ({
            value: item.value,
            label: item.label,
            logos: toTextRows(item.logos ?? []),
          })),
        },
        partnerBand: {
          items: home.partnerBand.items.map((item: any) => ({
            value: item.value,
            label: item.label,
            logos: toTextRows(item.logos ?? []),
          })),
          cta: home.partnerBand.cta,
        },
        previousSpeakers: home.previousSpeakers,
        whyAttend: {
          heading: home.whyAttend.heading,
          intro: home.whyAttend.intro,
          cards: home.whyAttend.cards,
          cta: home.whyAttend.cta,
        },
        faqSection: home.faqSection,
        _status: "published",
      },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-home: updated and published");
  }

  // page-whyq (resolves each audience's photo to a media doc when present)
  {
    const whyq = content.whyq;
    const audiences = [];
    let missingImages = 0;
    for (const audience of whyq.audiences) {
      const imageId = await resolveWhyqImageId(
        payload,
        audience.imageFile,
        audience.imageAlt,
      );
      if (imageId === null) missingImages += 1;
      audiences.push({
        // Web JSON keeps "id" as the anchor; the CMS field is "anchorId" so it
        // does not collide with Payload's own array-row id (which content-sync
        // strips on round-trip).
        anchorId: audience.id,
        heading: audience.heading,
        intro: audience.intro,
        items: audience.items,
        ...(imageId !== null ? { imageFile: imageId } : {}),
        imageAlt: audience.imageAlt,
        imageLeft: audience.imageLeft,
      });
    }
    await payload.updateGlobal({
      slug: "page-whyq",
      data: {
        title: whyq.title,
        metaDescription: whyq.metaDescription,
        heading: whyq.heading,
        intro: whyq.intro,
        audiences,
        _status: "published",
      },
      user: seedUser,
      overrideAccess: true,
    });
    console.log(
      `page-whyq: updated and published (${audiences.length} audiences` +
        (missingImages > 0 ? `, ${missingImages} without local media` : "") +
        ")",
    );
  }

  // page-program
  {
    const program = content.program;
    await payload.updateGlobal({
      slug: "page-program",
      data: {
        title: program.title,
        metaDescription: program.metaDescription,
        agenda: {
          heading: program.agenda.heading,
          intro: program.agenda.intro,
          items: program.agenda.items,
        },
        faqSection: program.faqSection,
        closingCta: program.closingCta,
        _status: "published",
      },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-program: updated and published");
  }

  // page-tickets
  {
    const t = content.ticketCategories;
    await payload.updateGlobal({
      slug: "page-tickets",
      data: {
        title: t.title,
        metaDescription: t.metaDescription,
        tiers: {
          heading: t.tiers.heading,
          intro: t.tiers.intro,
          items: t.tiers.items.map((item: any) => ({
            name: item.name,
            price: item.price,
            features: toTextRows(item.features),
            note: item.note ?? null,
            buyLabel: item.buyLabel,
            buyHref: item.buyHref,
          })),
        },
        comparison: {
          heading: t.comparison.heading,
          intro: t.comparison.intro,
          tiers: t.comparison.tiers,
          groups: t.comparison.groups.map((group: any) => ({
            group: group.group,
            rows: group.rows.map((row: any) => ({
              feature: row.feature,
              included: toValueRows(row.included),
            })),
          })),
          academicNote: t.comparison.academicNote,
        },
        categories: {
          heading: t.categories.heading,
          items: t.categories.items.map((item: any) => ({
            label: item.label,
            bullets: toTextRows(item.bullets),
          })),
        },
        _status: "published",
      },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-tickets: updated and published");
  }

  // page-contact
  {
    const contact = content.contact;
    await payload.updateGlobal({
      slug: "page-contact",
      data: {
        title: contact.title,
        metaDescription: contact.metaDescription,
        board: {
          heading: contact.board.heading,
          paragraphs: toTextRows(contact.board.paragraphs),
          members: contact.board.members,
        },
        reachOut: {
          heading: contact.reachOut.heading,
          paragraphs: toTextRows(contact.reachOut.paragraphs),
          items: contact.reachOut.items.map((item: any) => ({
            label: item.label,
            email: item.email ?? null,
            details: toTextRows(item.details),
          })),
        },
        _status: "published",
      },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-contact: updated and published");
  }

  // page-hackathon
  {
    const h = content.hackathon;
    await payload.updateGlobal({
      slug: "page-hackathon",
      data: {
        title: h.title,
        metaDescription: h.metaDescription,
        hero: h.hero,
        partners: {
          heading: h.partners.heading,
          groups: h.partners.groups.map((group: any) => ({
            group: group.group,
            partners: group.partners.map((p: any) => ({
              name: p.name,
              href: p.href,
              logoFile: p.logoFile,
              note: p.note ?? null,
            })),
          })),
        },
        benefits: h.benefits,
        schedule: h.schedule,
        faqSection: h.faqSection,
        closingCta: h.closingCta,
        _status: "published",
      },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-hackathon: updated and published");
  }

  // page-our-team
  {
    const ourTeam = content.ourTeam;
    await payload.updateGlobal({
      slug: "page-our-team",
      data: { ...ourTeam, _status: "published" },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-our-team: updated and published");
  }

  // page-past-teams
  {
    const pastTeams = content.pastTeams;
    await payload.updateGlobal({
      slug: "page-past-teams",
      data: { ...pastTeams, _status: "published" },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-past-teams: updated and published");
  }

  // page-partner
  {
    const partner = content.partner;
    await payload.updateGlobal({
      slug: "page-partner",
      data: { ...partner, _status: "published" },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-partner: updated and published");
  }

  // page-speaker
  {
    const speaker = content.speaker;
    await payload.updateGlobal({
      slug: "page-speaker",
      data: { ...speaker, _status: "published" },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-speaker: updated and published");
  }

  // page-jobs
  {
    const jobs = content.jobs;
    await payload.updateGlobal({
      slug: "page-jobs",
      data: { ...jobs, _status: "published" },
      user: seedUser,
      overrideAccess: true,
    });
    console.log("page-jobs: updated and published");
  }

  // page-kickoff (optional media from /media/...; soft-miss if the file is absent)
  {
    const k = content.kickoff;
    if (!k) {
      console.log("page-kickoff: skipped (no kickoff in fixture)");
    } else {
      const heroImage = await ensureMedia(
        payload,
        k.hero.image,
        k.hero.imageAlt,
      );
      const companyLogo = await ensureMedia(
        payload,
        k.kickoff.company.logo,
        k.kickoff.company.logoAlt,
      );

      const speakers = [];
      for (const speaker of k.kickoff.speakers ?? []) {
        const image = await ensureMedia(
          payload,
          speaker.image,
          speaker.imageAlt,
        );
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
      for (const moment of k.journey.moments ?? []) {
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
          title: k.title,
          metaDescription: k.metaDescription,
          hero: {
            eyebrow: k.hero.eyebrow,
            headline: k.hero.headline,
            copy: k.hero.copy,
            ...(heroImage !== null ? { image: heroImage } : {}),
            imageAlt: k.hero.imageAlt || null,
            primaryCta: k.hero.primaryCta,
            secondaryCta: k.hero.secondaryCta,
          },
          kickoff: {
            eyebrow: k.kickoff.eyebrow,
            heading: k.kickoff.heading,
            intro: k.kickoff.intro,
            date: k.kickoff.date,
            location: k.kickoff.location,
            panelTitle: k.kickoff.panelTitle,
            ui: k.kickoff.ui,
            company: {
              name: k.kickoff.company.name,
              href: k.kickoff.company.href || null,
              ...(companyLogo !== null ? { logo: companyLogo } : {}),
              logoAlt: k.kickoff.company.logoAlt || null,
            },
            speakers,
          },
          socials: k.socials,
          quiz: {
            eyebrow: k.quiz.eyebrow,
            heading: k.quiz.heading,
            intro: k.quiz.intro,
            ui: k.quiz.ui,
            start: k.quiz.start,
            questions: (k.quiz.questions ?? []).map((question: any) => ({
              kicker: question.kicker,
              question: question.question,
              answers: (question.answers ?? []).map((answer: any) => ({
                answerId: answer.answerId ?? answer.id,
                text: answer.text,
                tags: toTextRows(answer.tags ?? []),
              })),
            })),
            results: k.quiz.results,
            resultCopy: k.quiz.resultCopy,
          },
          journey: {
            eyebrow: k.journey.eyebrow,
            heading: k.journey.heading,
            intro: k.journey.intro,
            hint: k.journey.hint,
            moments,
          },
          application: k.application,
          finalCta: k.finalCta,
          _status: "published",
        },
        user: seedUser,
        overrideAccess: true,
      });
      console.log("page-kickoff: updated and published");
    }
  }

  console.log("All 12 page globals seeded from page-content.json.");
  process.exit(0);
}

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
