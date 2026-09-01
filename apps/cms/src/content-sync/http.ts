// Shared HTTP helpers for content-sync endpoints (package ingest + media).
import type { Payload } from "payload";

import {
  CONTENT_SYNC_ACTOR_HEADER,
  CONTENT_SYNC_USER_DOMAIN,
  loadSyncUser,
  normalizeContentSyncUserEmail,
  verifyContentSyncToken,
  type SyncUser,
} from "./auth";

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export type ContentSyncAuthOk = { ok: true; user: SyncUser };
export type ContentSyncAuthFail = { ok: false; response: Response };

type AuthReq = {
  headers: { get(name: string): string | null };
  payload: Payload;
};

/**
 * Token + actor gate shared by POST /api/content-sync and
 * POST /api/content-sync/media. Does not read the body.
 */
export async function authenticateContentSync(
  req: AuthReq,
): Promise<ContentSyncAuthOk | ContentSyncAuthFail> {
  if (!verifyContentSyncToken(req.headers.get("authorization"))) {
    return { ok: false, response: json({ error: "unauthorized" }, 401) };
  }

  const actorHeader = req.headers.get(CONTENT_SYNC_ACTOR_HEADER);
  if (!actorHeader?.trim()) {
    return {
      ok: false,
      response: json(
        {
          error:
            `missing ${CONTENT_SYNC_ACTOR_HEADER} header ` +
            `(send your username or username@${CONTENT_SYNC_USER_DOMAIN}; ` +
            `example value "dev" is rejected)`,
        },
        400,
      ),
    };
  }

  let workspaceEmail: string;
  try {
    workspaceEmail = normalizeContentSyncUserEmail(actorHeader);
  } catch (err) {
    return {
      ok: false,
      response: json(
        {
          error:
            err instanceof Error ? err.message : "content-sync actor rejected",
        },
        400,
      ),
    };
  }

  let syncUser;
  try {
    syncUser = await loadSyncUser(req.payload, workspaceEmail);
  } catch (err) {
    return {
      ok: false,
      response: json(
        {
          error:
            err instanceof Error ? err.message : "content-sync actor rejected",
        },
        400,
      ),
    };
  }
  if (!syncUser) {
    return {
      ok: false,
      response: json(
        {
          error:
            `no Payload user for "${workspaceEmail}"; refused. ` +
            `Sign in to the CMS once with Google as that address so the account exists. ` +
            `Wrong or never-logged-in users cannot propose.`,
        },
        400,
      ),
    };
  }

  return { ok: true, user: syncUser };
}
