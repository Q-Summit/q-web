#!/usr/bin/env node
/*
 * Regenerate the CI content fixture at apps/web/test/fixtures/ci-content/
 * from a real content snapshot dir passed via --from (maintainer-held,
 * outside git; never wired into any default).
 *
 * Real content is never committed; the fixture exists so the JSON-mode
 * static build stays a meaningful CI/pre-push gate on machines without a
 * snapshot or a CMS. Policy:
 *  - verbatim: page-content.json and site-settings.json (their copy already
 *    lives in the committed generator apps/web/scripts/build-page-content.mjs),
 *    and faqs.json (public marketing copy; any email addresses scrubbed)
 *  - faked: speakers, team, partners, testimonials, jobs, past-teams (people
 *    data and photo filenames from the scrape; obviously fake replacements,
 *    real registry/enum values kept so every page and validator still
 *    exercises its real code path)
 *  - legal.json: placeholder sections (the real text is CMS-owned)
 *
 * Run manually after a content-schema change (maintainers with a snapshot):
 *   pnpm content:fixture -- --from <snapshot dir>
 */
import fs from "node:fs";
import path from "node:path";
import { argValue } from "../lib/args.mjs";
import { REPO_ROOT } from "../lib/paths.mjs";

const archive = argValue("--from");
if (!archive || !fs.existsSync(path.join(archive, "partners.json"))) {
  console.error(
    "content:fixture: pass --from <real content snapshot dir> " +
      "(maintainer-held, outside git; see docs/dev/local-development.md).",
  );
  process.exit(1);
}
const outDir = path.resolve(REPO_ROOT, "apps/web/test/fixtures/ci-content");
fs.mkdirSync(outDir, { recursive: true });

const read = (f) => JSON.parse(fs.readFileSync(path.join(archive, f), "utf-8"));
const write = (f, data) =>
  fs.writeFileSync(path.join(outDir, f), JSON.stringify(data, null, 2) + "\n");

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const scrubEmails = (s) => s.replace(EMAIL, "info@example.com");

// Partners: one fake partner per real tier value. Declared before
// page-content because the home partner band references partners BY NAME, so
// the verbatim copy below has to be remapped onto these names.
const tiers = [...new Set(read("partners.json").map((p) => p.tier))];
const fixturePartners = tiers.map((tier, i) => ({
  name: `Fixture ${tier} Partner ${i + 1}`,
  tier,
  websiteUrl: "https://example.com",
  logoFilename: "fixture-missing-logo.webp",
}));
write("partners.json", fixturePartners);

// Verbatim files (see policy above). page-content/site-settings keep their
// real org contact links; those already live in the committed generator.
//
// One exception: home.partnerBand.items[].logos is a list of real PARTNER
// COMPANY NAMES, which is exactly the sponsor data the fixture is supposed to
// keep out of git, and which pages/index.astro resolves against partners.json
// by name. Copying it verbatim both leaked ~24 real company names and made
// every one of them an unresolvable lookup, so a clean fixture build printed
// 24 "no partner named ..." warnings. That noise floor is the real cost: it
// hides a genuine content mismatch in the same output. Remap onto the fixture
// partners instead, preserving the group sizes so the band still exercises its
// multi-row layout.
const pageContent = read("page-content.json");
if (pageContent?.home?.partnerBand?.items) {
  let cursor = 0;
  pageContent.home.partnerBand.items = pageContent.home.partnerBand.items.map(
    (item) => ({
      ...item,
      logos: (item.logos ?? []).map(() => {
        const partner = fixturePartners[cursor % fixturePartners.length];
        cursor += 1;
        return partner.name;
      }),
    }),
  );
}
write("page-content.json", pageContent);
write("site-settings.json", read("site-settings.json"));
write(
  "past-teams.json",
  read("past-teams.json").map((row) => ({
    year: row.year,
    photoFilename: "fixture-missing-photo.webp",
  })),
);
write(
  "faqs.json",
  read("faqs.json").map((f) => ({
    ...f,
    answerHtml: scrubEmails(f.answerHtml),
  })),
);

// Legal: CMS-owned text; the fixture only needs the three keys to exist.
// No <h1>: the real counsel-provided HTML has none either, and the pages
// supply their own visually-hidden heading. A stub with an <h1> made the
// fixture build look correct while production shipped a heading-less page.
const legalStub = (label) =>
  `<section><p>Placeholder ${label.toLowerCase()} text for CI fixture builds. The real text is owned by the CMS legal global.</p></section>`;
write("legal.json", {
  imprint: legalStub("Imprint"),
  "privacy-policy": legalStub("Privacy Policy"),
  "terms-and-conditions": legalStub("Terms and Conditions"),
});

// One fake entry per (group, year) pair present in the real snapshot, so the
// fixture exercises the same edition-selection path the live site uses.
const speakerSrc = read("speakers.json");
const speakerGroups = [
  ...new Map(speakerSrc.map((s) => [`${s.group}:${s.year ?? ""}`, s])).values(),
];
write(
  "speakers.json",
  speakerGroups.flatMap((s, gi) =>
    [1, 2].map((n) => ({
      name: `Fixture Speaker ${gi * 2 + n}`,
      role: "Example Role",
      roleLine: "Example Role at Example Co",
      company: "Example Co",
      group: s.group,
      // Carry the year through: /speaker selects the newest edition from the
      // data, so a fixture with no year would render an empty lineup.
      year: s.year ?? null,
      photoFilename: "fixture-missing-photo.webp",
    })),
  ),
);

// Team: one fake member per real division, current year set preserved.
const teamSrc = read("team.json");
const year = Math.max(...teamSrc.map((m) => m.year));
const divisions = [...new Set(teamSrc.map((m) => m.division))];
write(
  "team.json",
  divisions.map((division, i) => ({
    name: `Fixture Member ${i + 1}`,
    role: `Head of ${division}`,
    division,
    year,
    photoFilename: "fixture-missing-photo.webp",
    // Obviously fake, and only on some rows on purpose: the field is optional,
    // so the fixture has to exercise both the link and the no-link branch of
    // the member card.
    linkedin:
      i % 2 === 0
        ? `https://www.linkedin.com/in/fixture-member-${i + 1}/`
        : null,
  })),
);

write("partner-testimonials.json", [
  {
    quote: "Placeholder testimonial quote for CI fixture builds.",
    attribution: "Alex Example, Example Co",
    photoFilename: "fixture-missing-photo.webp",
  },
  {
    quote: "A second placeholder quote so multi-item layouts render.",
    attribution: "Sam Sample, Sample GmbH",
    photoFilename: "fixture-missing-photo.webp",
  },
]);

// Jobs: three fake postings covering the real workload values.
const workloads = [...new Set(read("jobs.json").map((j) => j.workload))].slice(
  0,
  3,
);
write(
  "jobs.json",
  workloads.map((workload, i) => ({
    slug: `fixture-job-${i + 1}`,
    title: `Fixture Job ${i + 1}`,
    company: "Example Partner",
    location: "Mannheim",
    workload,
    applyUrl: "mailto:apply@example.com",
    logoFilename: "fixture-missing-logo.webp",
    richTextHtml: "<p>Placeholder job description for CI fixture builds.</p>",
  })),
);

fs.writeFileSync(
  path.join(outDir, "README.md"),
  "# CI content fixture (generated, obviously fake)\n\n" +
    "Generated by `pnpm content:fixture` from the local content archive; used by\n" +
    "`check:web:build` so the JSON-mode static build works in CI and fresh clones\n" +
    "without the archive or a CMS. People data is fake by design; registry and\n" +
    "enum values are real so pages exercise their real code paths. Do not edit\n" +
    "by hand; regenerate after content-schema changes.\n",
);
console.log(
  `content:fixture: wrote ${fs.readdirSync(outDir).length} files to ${path.relative(REPO_ROOT, outDir)}`,
);
