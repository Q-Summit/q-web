// Create-if-missing Media upload for agents (make propose).
//
// SECURITY: create only; never overwrite, delete, publish, or deploy.
// Binaries go through Payload so the Media row and R2/MinIO object stay in
// sync. This file must not import trigger-deploy or wrangler.
import type { Endpoint } from "payload";

import { authenticateContentSync, json } from "../content-sync/http";
import { applyMediaUpload } from "../content-sync/media-upload";

function isFile(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).name === "string"
  );
}

export const contentSyncMediaEndpoint: Endpoint = {
  path: "/content-sync/media",
  method: "post",
  handler: async (req) => {
    const auth = await authenticateContentSync(req);
    if (!auth.ok) return auth.response;

    let form: FormData;
    try {
      if (typeof req.formData !== "function") {
        return json({ error: "expected multipart form data" }, 400);
      }
      form = await req.formData();
    } catch {
      return json({ error: "expected multipart form data" }, 400);
    }

    const file = form.get("file");
    if (!isFile(file)) {
      return json({ error: "file is required" }, 400);
    }

    const altRaw = form.get("alt");
    const alt = typeof altRaw === "string" ? altRaw : "";
    const nameRaw = form.get("filename");
    const filename =
      typeof nameRaw === "string" && nameRaw.trim()
        ? nameRaw.trim()
        : file.name;

    const requestUrl = req.url ?? "http://localhost/api/content-sync/media";
    const dryRun = new URL(requestUrl).searchParams.get("dryRun") === "1";

    const data = Buffer.from(await file.arrayBuffer());
    const result = await applyMediaUpload({
      payload: req.payload,
      user: auth.user,
      input: {
        filename,
        mimeType: file.type || "",
        data,
        alt,
      },
      dryRun,
    });

    req.payload.logger.info(
      `content-sync/media: actor=${auth.user.email} dryRun=${dryRun} created=${result.created.length} skipped=${result.skipped.length} errors=${result.errors.length}`,
    );

    const status = result.errors.length > 0 ? 422 : 200;
    return json(
      {
        ...result,
        actor: auth.user.email,
        message:
          "Media create-if-missing only. Existing files were not overwritten. This did not publish or deploy.",
      },
      status,
    );
  },
};
