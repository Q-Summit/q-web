import fs from "node:fs";
import path from "node:path";
import { resolveContentDir } from "./content-dir";
import { getPayload } from "payload";
import config from "../src/payload.config";

const extractedDir = resolveContentDir();

interface LegalSource {
  imprint: string;
  "privacy-policy": string;
  "terms-and-conditions": string;
}

function readJson(): LegalSource {
  return JSON.parse(
    fs.readFileSync(path.join(extractedDir, "legal.json"), "utf-8"),
  );
}

// Verbatim, byte-for-byte: no HTML parsing, no rich text conversion, no
// trimming or reformatting. Idempotent: updateGlobal always overwrites the
// single legal document.
async function run() {
  const payload = await getPayload({ config });
  const data = readJson();

  await payload.updateGlobal({
    slug: "legal",
    data: {
      imprint: data.imprint,
      privacyPolicy: data["privacy-policy"],
      termsAndConditions: data["terms-and-conditions"],
      _status: "published",
    },
    user: { id: "seed-admin", roles: ["admin", "approver"] } as any,
    overrideAccess: true,
  });

  console.log("legal global: updated and published (verbatim, byte-for-byte)");
  console.log(` - imprint: ${data.imprint.length} chars`);
  console.log(` - privacyPolicy: ${data["privacy-policy"].length} chars`);
  console.log(
    ` - termsAndConditions: ${data["terms-and-conditions"].length} chars`,
  );

  process.exit(0);
}

await run().catch((err) => {
  console.error(err);
  process.exit(1);
});
