/**
 * Local public/media filename resolution for CMS uploads.
 *
 * Exact match, then size-suffix strip, then loose normalize; mirror misses
 * report once per build (production has no local mirror: R2 keys pass through).
 * Matching rules live in media-match.ts (shared with lib/images.ts).
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { matchMediaFilename } from "../media-match";

/* --- Media filename resolution ---
 *
 * Pages reference /media/<filename>; the files live in apps/web/public/media.
 * A CMS media doc's stored filename does not always match a public/media
 * filename byte-for-byte (Webflow's responsive image variants add a
 * "-p-<size>" suffix, e.g. "photo-p-800.webp"), so resolve loosely.
 * Anything still unresolved is logged as a build-time warning and passed
 * through as-is (a broken image is preferable to silently dropping data).
 */

// Resolved from the working directory (astro build/dev always runs with
// apps/web as cwd), not import.meta.url: Astro's build bundles this module
// into dist/, which would otherwise make a source-relative URL point at the
// wrong (and often nonexistent) directory once bundled.
const MEDIA_DIR =
  process.env.WEB_PUBLIC_MEDIA_DIR ?? join(process.cwd(), "public", "media");

interface MediaIndex {
  files: string[];
}

let mediaIndexPromise: Promise<MediaIndex> | null = null;

async function loadMediaIndex(): Promise<MediaIndex> {
  if (!mediaIndexPromise) {
    mediaIndexPromise = (async () => {
      let files: string[] = [];
      try {
        files = await readdir(MEDIA_DIR);
      } catch {
        // No local media mirror. This is the NORMAL production state:
        // public/media/ is gitignored, so a Workers Build checkout has none,
        // and prod media is served from R2 under the CMS filename anyway (the
        // mirror only exists so local dev can resolve the smaller "-p-<size>"
        // variants). Silent on purpose: warning here, and then once more per
        // file below, produced hundreds of lines describing correct behavior
        // and drowned the handful of warnings that mean something.
      }
      return { files };
    })();
  }
  return mediaIndexPromise;
}

/**
 * Report media the local mirror does not have, once per build rather than
 * once per file.
 *
 * This is not a content error, which is why it does not warn per occurrence.
 * public/media is the Webflow scrape mirror; anything an editor has since
 * uploaded through Payload lives in MinIO (local) or R2 (production) and was
 * never expected here. Returning the CMS filename unchanged is already the
 * correct answer, because that filename IS the R2 key in production.
 *
 * It still deserves one line: in local CMS mode those images 404 in `astro
 * dev`, because the dev server serves /media/* straight from public/media.
 * Per-file it emitted 113 lines on a normal build and buried the warnings that
 * did mean something.
 */
let mirrorMissCount = 0;
const mirrorMissSamples: string[] = [];

function reportMirrorMiss(label: string, filename: string): void {
  mirrorMissCount += 1;
  if (mirrorMissSamples.length < 3)
    mirrorMissSamples.push(`${label} (${filename})`);
  if (mirrorMissCount === 1) {
    console.info(
      "[content:cms] some media is not in the local public/media mirror (CMS uploads live in " +
        "MinIO/R2, not the scrape mirror). These resolve from R2 in production; locally they 404 " +
        "in `astro dev` until you mirror them. Reported once per build; " +
        `first: ${mirrorMissSamples[0]}`,
    );
  }
}

export async function resolveMediaFilename(
  filename: string,
  label: string,
): Promise<string> {
  const index = await loadMediaIndex();
  // No local mirror (production): the CMS filename IS the R2 key, so it is
  // already the right answer and there is nothing to resolve or report.
  if (index.files.length === 0) return filename;

  const match = matchMediaFilename(filename, index.files);
  if (match) return match.file;

  reportMirrorMiss(label, filename);
  return filename;
}

export interface CmsMediaRef {
  filename: string;
  width?: number | null;
  height?: number | null;
}

/**
 * Intrinsic dimensions of a populated upload relation, when Payload recorded
 * them (it always does for raster/svg uploads). Lets logo consumers render a
 * newly uploaded file that has no entry in the code-side logo manifest.
 */
export function uploadDimensions(
  upload: CmsMediaRef | number | string | null | undefined,
): { width: number; height: number } | undefined {
  if (upload === null || upload === undefined || typeof upload !== "object")
    return undefined;
  const { width, height } = upload;
  if (
    typeof width === "number" &&
    width > 0 &&
    typeof height === "number" &&
    height > 0
  ) {
    return { width, height };
  }
  return undefined;
}

export async function resolveUploadFilename(
  upload: CmsMediaRef | number | string | null | undefined,
  label: string,
): Promise<string> {
  if (
    upload === null ||
    upload === undefined ||
    typeof upload !== "object" ||
    !("filename" in upload)
  ) {
    console.warn(
      `[content:cms] upload relation for ${label} was not populated (expected depth=1)`,
    );
    return "";
  }
  return resolveMediaFilename(upload.filename, label);
}

/**
 * Resolve an optional upload relation without warning: some content is
 * legitimately allowed to have no photo (e.g. Speakers.photo for the
 * main-stage-homepage highlights missing from the site mirror; the
 * JSON-mode site also has no working photo for them, see
 * apps/cms/src/collections/Speakers.ts). Returns "" when absent.
 */
export async function resolveOptionalUploadFilename(
  upload: CmsMediaRef | number | string | null | undefined,
  label: string,
): Promise<string> {
  if (upload === null || upload === undefined) return "";
  return resolveUploadFilename(upload, label);
}

/**
 * whyq audience photos are the only page-copy images with an actual upload
 * relation (see apps/cms/src/globals/PageWhyq.ts); the seeded upload is the
 * "-800" responsive variant (e.g. "whyq-attendees-800.webp"), but
 * whyq.astro's imageFile contract is the bare base name ("whyq-attendees")
 * that it looks up in its own code-side extension/dimension registry. This
 * strips both the extension and that known size suffix to recover it.
 */
function stripWhyqImageSizeSuffix(filename: string): string {
  return filename
    .replace(/-(?:500|800|1080)(?=\.[a-zA-Z0-9]+$)/, "")
    .replace(/\.[a-zA-Z0-9]+$/, "");
}

export async function resolveWhyqImageBase(
  upload: CmsMediaRef | number | string | null | undefined,
  label: string,
): Promise<string> {
  const filename = await resolveUploadFilename(upload, label);
  return filename ? stripWhyqImageSizeSuffix(filename) : filename;
}
