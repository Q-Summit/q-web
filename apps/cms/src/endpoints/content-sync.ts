// Draft-only content package ingest for agents/humans (make propose).
//
// SECURITY: This handler must NEVER call site deploy tooling or leave
// documents published. Go-live is human approver Publish only. Site rebuild
// on Publish is wired in collection/global afterChange hooks; this file must
// not import or invoke those helpers.
import type { Endpoint } from "payload";

import { applyContentPackage } from "../content-sync/apply-package";
import {
  CONTENT_SYNC_ACTOR_HEADER,
  CONTENT_SYNC_USER_DOMAIN,
  loadSyncUser,
  normalizeContentSyncUserEmail,
  verifyContentSyncToken,
} from "../content-sync/auth";
import type { ContentPackage } from "../content-sync/package-types";

const MAX_BODY_BYTES = 5 * 1024 * 1024;

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export const contentSyncEndpoint: Endpoint = {
  path: "/content-sync",
  method: "post",
  handler: async (req) => {
    if (!verifyContentSyncToken(req.headers.get("authorization"))) {
      return json({ error: "unauthorized" }, 401);
    }

    // Actor is a real Workspace user claim; domain forced here. User row must
    // already exist (Google login once); this endpoint never creates users.
    const actorHeader = req.headers.get(CONTENT_SYNC_ACTOR_HEADER);
    if (!actorHeader?.trim()) {
      return json(
        {
          error:
            `missing ${CONTENT_SYNC_ACTOR_HEADER} header ` +
            `(send your username or username@${CONTENT_SYNC_USER_DOMAIN}; ` +
            `example value "dev" is rejected)`,
        },
        400,
      );
    }

    let workspaceEmail: string;
    try {
      workspaceEmail = normalizeContentSyncUserEmail(actorHeader);
    } catch (err) {
      return json(
        {
          error:
            err instanceof Error ? err.message : "content-sync actor rejected",
        },
        400,
      );
    }

    let rawBody: ArrayBuffer;
    try {
      if (typeof req.arrayBuffer !== "function") {
        return json({ error: "invalid body" }, 400);
      }
      rawBody = await req.arrayBuffer();
    } catch {
      return json({ error: "invalid body" }, 400);
    }
    if (rawBody.byteLength > MAX_BODY_BYTES) {
      return json({ error: "payload too large" }, 413);
    }

    let body: unknown;
    try {
      const text = new TextDecoder().decode(rawBody);
      body = text ? JSON.parse(text) : null;
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return json({ error: "body must be a content package object" }, 400);
    }

    const pkg = body as ContentPackage;
    if (!pkg.package || typeof pkg.package.version !== "number") {
      return json({ error: "package.version (number) is required" }, 400);
    }
    if (pkg.package.version !== 1) {
      return json(
        { error: "unsupported package.version (only 1 is accepted)" },
        400,
      );
    }

    const requestUrl = req.url ?? "http://localhost/api/content-sync";
    const dryRun = new URL(requestUrl).searchParams.get("dryRun") === "1";

    let syncUser;
    try {
      syncUser = await loadSyncUser(req.payload, workspaceEmail);
    } catch (err) {
      return json(
        {
          error:
            err instanceof Error ? err.message : "content-sync actor rejected",
        },
        400,
      );
    }
    if (!syncUser) {
      return json(
        {
          error:
            `no Payload user for "${workspaceEmail}"; refused. ` +
            `Sign in to the CMS once with Google as that address so the account exists. ` +
            `Wrong or never-logged-in users cannot propose.`,
        },
        400,
      );
    }

    const result = await applyContentPackage({
      payload: req.payload,
      user: syncUser,
      pkg,
      dryRun,
    });

    req.payload.logger.info(
      `content-sync: actor=${syncUser.email} dryRun=${dryRun} created=${result.created.length} updated=${result.updated.length} skipped=${result.skipped.length} errors=${result.errors.length}`,
    );

    const status = result.errors.length > 0 ? 422 : 200;
    return json(
      {
        ...result,
        actor: syncUser.email,
        message:
          "Proposed drafts only. Live published content unchanged. Approver must Publish. This did not deploy.",
      },
      status,
    );
  },
};
