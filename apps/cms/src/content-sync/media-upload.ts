// Create-if-missing Media rows for content-sync. Never overwrite, never
// fetch a URL, never delete. Apply-package still resolves uploads by filename.
import type { Payload } from "payload";

import { MEDIA_MIME_TYPES } from "../collections/Media";
import { CONTENT_SYNC_CONTEXT } from "../lib/publish-state";
import type { SyncUser } from "./auth";

export const MEDIA_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const MEDIA_FILENAME_RE =
  /^[A-Za-z0-9][A-Za-z0-9._-]*\.(webp|jpe?g|png|avif|svg)$/i;

const MIME_BY_EXT: Record<string, (typeof MEDIA_MIME_TYPES)[number]> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

const ALLOWED_MIME = new Set<string>(MEDIA_MIME_TYPES);

export type MediaUploadInput = {
  filename: string;
  mimeType: string;
  data: Buffer;
  alt: string;
};

export type MediaUploadResult = {
  created: string[];
  skipped: string[];
  errors: string[];
  dryRun: boolean;
};

export function inferMediaMime(filename: string, declared: string): string {
  const trimmed = declared.trim().toLowerCase();
  if (trimmed && trimmed !== "application/octet-stream") return trimmed;
  const ext = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return MIME_BY_EXT[ext] ?? trimmed;
}

export function mediaUploadError(input: {
  filename: string;
  mimeType: string;
  byteLength: number;
  alt: string;
}): string | null {
  const filename = input.filename.trim();
  if (!filename || filename !== pathBasename(filename)) {
    return "filename must be a basename (no path)";
  }
  if (!MEDIA_FILENAME_RE.test(filename)) {
    return `filename "${filename}" is not an allowed image name`;
  }
  const alt = input.alt.trim();
  if (!alt) {
    return "alt is required";
  }
  if (input.byteLength <= 0) {
    return "file is empty";
  }
  if (input.byteLength > MEDIA_UPLOAD_MAX_BYTES) {
    return `file exceeds ${MEDIA_UPLOAD_MAX_BYTES} bytes`;
  }
  const mime = inferMediaMime(filename, input.mimeType);
  if (!ALLOWED_MIME.has(mime)) {
    return `mime type "${mime || "(empty)"}" is not allowed`;
  }
  return null;
}

function pathBasename(filename: string): string {
  return filename.replaceAll("\\", "/").split("/").pop() ?? filename;
}

export async function applyMediaUpload(opts: {
  payload: Payload;
  user: SyncUser;
  input: MediaUploadInput;
  dryRun?: boolean;
}): Promise<MediaUploadResult> {
  const dryRun = Boolean(opts.dryRun);
  const filename = pathBasename(opts.input.filename.trim());
  const alt = opts.input.alt.trim();
  const mimeType = inferMediaMime(filename, opts.input.mimeType);
  const label = `media:${filename}`;
  const result: MediaUploadResult = {
    created: [],
    skipped: [],
    errors: [],
    dryRun,
  };

  const invalid = mediaUploadError({
    filename,
    mimeType,
    byteLength: opts.input.data.byteLength,
    alt,
  });
  if (invalid) {
    result.errors.push(`${label}: ${invalid}`);
    return result;
  }

  const existing = await opts.payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs[0]) {
    result.skipped.push(`${label} (exists)`);
    return result;
  }

  if (dryRun) {
    result.created.push(label);
    return result;
  }

  try {
    await opts.payload.create({
      collection: "media",
      data: { alt },
      file: {
        data: opts.input.data,
        mimetype: mimeType,
        name: filename,
        size: opts.input.data.byteLength,
      },
      overrideAccess: false,
      user: opts.user,
      context: { [CONTENT_SYNC_CONTEXT]: true },
    });
    result.created.push(label);
  } catch (err) {
    result.errors.push(
      `${label}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  return result;
}
