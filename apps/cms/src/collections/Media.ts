import path from "node:path";
import { fileURLToPath } from "node:url";

import { APIError, type CollectionConfig } from "payload";

import { adminOnly, anyone, authenticated } from "../access";
import { findMediaReferences } from "../lib/media-usage";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploads land on local disk for development. At deploy time this switches
// to Cloudflare R2 via the @payloadcms/storage-s3 plugin registered in
// payload.config.ts (see ADR-0002); the collection itself stays unchanged.
export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Media file",
    plural: "Media library",
  },
  admin: {
    useAsTitle: "alt",
    group: "Shared assets",
    // `filename` is a legal column on an upload collection and Payload swaps
    // in its File cell for it, which is what puts a thumbnail in the list.
    defaultColumns: ["filename", "alt", "updatedAt"],
    // Searching only `alt` meant you could not find a file by its name, which
    // is the one thing an editor actually remembers about it.
    listSearchableFields: ["alt", "filename"],
    pagination: { defaultLimit: 50, limits: [25, 50, 100] },
    description:
      "Images used across the site (logos, photos, portraits). Upload sharp originals up to 5 MB; " +
      "the site generates small sizes itself. Open a file to see everywhere it is used before you " +
      "change or delete it. The hero and hackathon background videos are not here: they are too " +
      "large for this library and IT replaces them directly.",
  },
  access: {
    read: anyone,
    // Editors may upload new assets; overwriting an existing file by id is
    // admin-only so one division cannot replace another division's logos.
    create: authenticated,
    update: adminOnly,
    delete: adminOnly,
  },
  upload: {
    staticDir: path.resolve(dirname, "../../media"),
    // Media is world-readable (served straight from the R2/MinIO bucket via
    // the Worker at /media/*), and any division editor can upload, so the
    // upload surface is locked down here:
    //   - mimeTypes is an allowlist of exactly the formats the site uses
    //     (verified against the seeded media table: webp/svg/jpeg/png/avif).
    //     Anything else (executables, HTML, JS, PDFs we don't serve, ...) is
    //     rejected before it ever lands in the bucket. Payload also runs a
    //     magic-byte check against this list, so a renamed file cannot slip
    //     through on extension alone.
    //   - image/svg+xml is kept because partner and job logos are genuinely
    //     uploaded through the CMS as vector art (the seed maps 11 SVG logos
    //     from the scrape into this collection, and the partner division
    //     edits them going forward). Payload 3.86 hard-rejects SVGs carrying
    //     scripts, event handlers, javascript:/foreignObject/iframe/embed,
    //     external entities, etc. via its built-in validateSvg check, which
    //     runs automatically once SVG is in the allowlist -- that is what
    //     keeps a world-readable SVG from becoming stored XSS. PDF is
    //     deliberately excluded: nothing on the site serves one today (add
    //     "application/pdf" here if that ever changes).
    // The upload size cap (5 MiB) is not a per-collection option in Payload;
    // it lives on the top-level `upload.limits.fileSize` in payload.config.ts
    // and applies to this collection (the only upload collection).
    mimeTypes: [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/avif",
      "image/svg+xml",
    ],
  },
  hooks: {
    // Refuse to delete a file that content still points at. deleteByID runs
    // beforeDelete before deleteAssociatedFiles, so throwing here stops the
    // binary leaving the bucket as well as the row leaving the table.
    beforeDelete: [
      async ({ id, req }) => {
        const refs = await findMediaReferences(req.payload, id);
        if (refs.length === 0) return;
        const used = refs.map((r) => `${r.label}: ${r.title}`).join(", ");
        throw new APIError(
          `This file is still used by ${refs.length} ${
            refs.length === 1 ? "entry" : "entries"
          } (${used}). Point those at a different file first, then delete this one.`,
          400,
          null,
          // Public: without this the sentence never reaches the admin toast
          // and the editor just sees a generic server error.
          true,
        );
      },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description:
          "What the image shows, for screen readers and for search. Describe the content, not the file.",
      },
    },
    {
      name: "usage",
      type: "ui",
      label: "Used on",
      admin: {
        components: {
          Field: "/components/media-references#MediaReferences",
        },
      },
    },
  ],
};
