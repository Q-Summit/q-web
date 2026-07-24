import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveContentDir } from "./content-dir";
import { getPayload, type Payload } from "payload";
import config from "../src/payload.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const extractedDir = resolveContentDir();
const webMediaDir = path.resolve(dirname, "../../web/public/media");

// Seeds the 11 per-page globals from page-content.json. Field shapes mirror
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
): Promise<number> {
  const ext = WHYQ_IMAGE_EXT[imageFile];
  if (!ext)
    throw new Error(
      `No known asset extension registered for whyq image "${imageFile}"`,
    );
  const uploadFilename = `${imageFile}-800.${ext}`;

  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: uploadFilename } },
    limit: 1,
  });
  if (existing.totalDocs > 0) return existing.docs[0]!.id as number;

  const sourcePath = path.join(webMediaDir, uploadFilename);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing whyq image file on disk: ${sourcePath}`);
  }

  const created = await payload.create({
    collection: "media",
    data: { alt },
    filePath: sourcePath,
  });
  console.log(`  created media for ${uploadFilename} (id=${created.id})`);
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

  // page-whyq (resolves each audience's photo to a media doc)
  {
    const whyq = content.whyq;
    const audiences = [];
    for (const audience of whyq.audiences) {
      const imageId = await resolveWhyqImageId(
        payload,
        audience.imageFile,
        audience.imageAlt,
      );
      audiences.push({
        // Web JSON keeps "id" as the anchor; the CMS field is "anchorId" so it
        // does not collide with Payload's own array-row id (which content-sync
        // strips on round-trip).
        anchorId: audience.id,
        heading: audience.heading,
        intro: audience.intro,
        items: audience.items,
        imageFile: imageId,
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
      `page-whyq: updated and published (${audiences.length} audiences)`,
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

  console.log("All 11 page globals seeded from page-content.json.");
  process.exit(0);
}

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
