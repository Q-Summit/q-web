import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import config from "../src/payload.config";

const extractedDir = resolveContentDir();

interface PageLink {
  label: string;
  href: string;
}

interface SocialLink extends PageLink {
  platform:
    "tiktok" | "instagram-qsummit" | "instagram-qhack" | "linkedin" | "youtube";
}

interface SiteSettingsSource {
  siteTitle: string;
  nav: PageLink[];
  footer: {
    tagline: string;
    links: PageLink[];
    socialLinks: SocialLink[];
    copyrightHolder: string;
  };
  llms?: {
    summary?: string;
    pitch?: string;
    keyFacts?: string[];
    lastReviewed?: string;
  };
  kickoff?: {
    pageEnabled?: boolean;
    redirectRoot?: boolean;
  };
}

function readJson(): SiteSettingsSource {
  return JSON.parse(
    fs.readFileSync(path.join(extractedDir, "site-settings.json"), "utf-8"),
  );
}

// Idempotent: updateGlobal always overwrites the single site-settings
// document (there is nothing to dedupe), so a re-run just reapplies the
// same data.
async function run() {
  const payload = await getPayload({ config });
  const data = readJson();

  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      siteTitle: data.siteTitle,
      nav: data.nav,
      footer: {
        tagline: data.footer.tagline,
        links: data.footer.links,
        socialLinks: data.footer.socialLinks,
        copyrightHolder: data.footer.copyrightHolder,
      },
      llms: {
        summary: data.llms?.summary ?? "",
        pitch: data.llms?.pitch ?? "",
        keyFacts: (data.llms?.keyFacts ?? []).map((text) => ({ text })),
        lastReviewed: data.llms?.lastReviewed ?? "",
      },
      kickoff: {
        pageEnabled: data.kickoff?.pageEnabled ?? false,
        redirectRoot: data.kickoff?.redirectRoot ?? false,
      },
      _status: "published",
    },
    user: { id: "seed-admin", roles: ["admin", "approver"] } as any,
    overrideAccess: true,
  });

  console.log("site-settings global: updated and published");
  console.log(` - siteTitle: "${data.siteTitle}"`);
  console.log(` - nav items: ${data.nav.length}`);
  console.log(` - footer links: ${data.footer.links.length}`);
  console.log(` - social links: ${data.footer.socialLinks.length}`);
  console.log(` - llms key facts: ${data.llms?.keyFacts?.length ?? 0}`);
  console.log(
    ` - kickoff: pageEnabled=${data.kickoff?.pageEnabled ?? false} redirectRoot=${data.kickoff?.redirectRoot ?? false}`,
  );

  process.exit(0);
}

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
