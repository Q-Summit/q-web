// Shared upload loop used by content:propose and content:upload-media.
import { uploadMediaFile } from "./media-files.mjs";

/**
 * @param {{ cmsUrl: string, token: string, actor: string, files: { filename: string, alt: string, filePath: string }[], dryRun?: boolean }} opts
 * @returns {Promise<{ ok: boolean, created: string[], skipped: string[], errors: string[] }>}
 */
export async function uploadPackageMedia(opts) {
  const created = [];
  const skipped = [];
  const errors = [];
  const mode = opts.dryRun ? "dry-run (no writes)" : "create-if-missing";
  console.log(
    `content:upload-media: ${opts.files.length} file(s), ${mode}, ${opts.cmsUrl}`,
  );

  for (const file of opts.files) {
    const res = await uploadMediaFile({
      cmsUrl: opts.cmsUrl,
      token: opts.token,
      actor: opts.actor,
      filePath: file.filePath,
      filename: file.filename,
      alt: file.alt,
      dryRun: opts.dryRun,
    });
    const parsed = res.parsed ?? {};
    if (!res.ok) {
      const detail =
        parsed.error ||
        (Array.isArray(parsed.errors) ? parsed.errors.join("; ") : "") ||
        `HTTP ${res.status}`;
      errors.push(`${file.filename}: ${detail}`);
      console.error(`  fail ${file.filename}: ${detail}`);
      continue;
    }
    for (const row of parsed.created ?? []) created.push(row);
    for (const row of parsed.skipped ?? []) skipped.push(row);
    for (const row of parsed.errors ?? []) errors.push(row);
    const state = (parsed.created ?? []).length
      ? "created"
      : (parsed.skipped ?? []).length
        ? "skipped"
        : "ok";
    console.log(`  ${state} ${file.filename}`);
  }

  if (errors.length > 0) {
    console.error(`content:upload-media: ${errors.length} error(s)`);
    return { ok: false, created, skipped, errors };
  }
  return { ok: true, created, skipped, errors };
}
