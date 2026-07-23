import { timingSafeEqual } from "node:crypto";

import type { Payload } from "payload";

import { CONTENT_SYNC_AUDIT_DOMAIN, CONTENT_SYNC_USER_DOMAIN } from "./domains";

export { CONTENT_SYNC_USER_DOMAIN, CONTENT_SYNC_AUDIT_DOMAIN } from "./domains";

/** Client must send this; the CMS normalizes/forces the Workspace domain. */
export const CONTENT_SYNC_ACTOR_HEADER = "x-content-sync-actor";

/**
 * Constant-time compare of the Bearer token to CONTENT_SYNC_TOKEN.
 * Returns false when either side is missing or lengths differ.
 */
export function verifyContentSyncToken(
  header: string | null | undefined,
): boolean {
  const expected = process.env.CONTENT_SYNC_TOKEN;
  if (!expected || !header) return false;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match?.[1]) return false;
  const provided = match[1];
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Normalize an actor claim to `<username>@q-summit.com` for user lookup.
 */
export function normalizeContentSyncUserEmail(
  raw: string | undefined | null,
): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    throw new Error(
      `content-sync actor must be <username>@${CONTENT_SYNC_USER_DOMAIN} (or just <username>)`,
    );
  }

  let local: string;
  let domain: string | null = null;
  const at = trimmed.lastIndexOf("@");
  if (at === -1) {
    local = trimmed;
  } else {
    local = trimmed.slice(0, at).trim();
    domain = trimmed
      .slice(at + 1)
      .trim()
      .toLowerCase();
  }

  local = local.toLowerCase();
  if (
    !local ||
    local.length > 64 ||
    !/^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(local)
  ) {
    throw new Error(
      `content-sync actor local-part is invalid (use letters, digits, . _ -; got "${local || trimmed}")`,
    );
  }

  if (local === "dev") {
    throw new Error(
      `content-sync actor must not be the example value "dev".\n` +
        `  Set CONTENT_SYNC_USER_EMAIL to your Workspace name, e.g. lukas.strickler\n` +
        `  or lukas.strickler@${CONTENT_SYNC_USER_DOMAIN}.\n` +
        `  That person must already exist in Payload (Google sign-in once).`,
    );
  }

  // Accept either Workspace or audit domain from the client; lookup is always Workspace.
  if (
    domain &&
    domain !== CONTENT_SYNC_USER_DOMAIN &&
    domain !== CONTENT_SYNC_AUDIT_DOMAIN
  ) {
    throw new Error(
      `content-sync actor must use @${CONTENT_SYNC_USER_DOMAIN} (got @${domain})`,
    );
  }

  return `${local}@${CONTENT_SYNC_USER_DOMAIN}`;
}

/** Changelog identity: same person, agent domain so UI shows propose vs manual. */
export function contentSyncAuditEmail(workspaceEmail: string): string {
  const local = workspaceEmail.split("@")[0]?.toLowerCase() ?? "";
  if (!local) {
    throw new Error("content-sync audit email requires a non-empty local-part");
  }
  return `${local}@${CONTENT_SYNC_AUDIT_DOMAIN}`;
}

export type SyncUser = {
  id: number | string;
  /** Audit/changelog email (`@agent.q-summit.com`); access uses id/roles/divisions. */
  email: string;
  roles: string[];
  divisions: string[] | null;
};

/**
 * Load a real Payload Workspace user, but stamp changelog as @agent.q-summit.com.
 */
export async function loadSyncUser(
  payload: Payload,
  actorFromRequest?: string | null,
): Promise<SyncUser | null> {
  const raw =
    actorFromRequest != null && String(actorFromRequest).trim() !== ""
      ? actorFromRequest
      : process.env.CONTENT_SYNC_USER_EMAIL;

  const workspaceEmail = normalizeContentSyncUserEmail(raw);
  const found = await payload.find({
    collection: "users",
    where: { email: { equals: workspaceEmail } },
    limit: 1,
    overrideAccess: true,
  });
  const user = found.docs[0];
  if (!user) return null;

  const roles = (user.roles ?? []) as string[];
  const known = roles.filter(
    (role) => role === "editor" || role === "approver" || role === "admin",
  );
  if (known.length === 0) {
    throw new Error(
      `content-sync actor (${workspaceEmail}) has no CMS roles; sign in with Google so Workspace groups sync roles/divisions`,
    );
  }

  const stored = String(user.email ?? "")
    .trim()
    .toLowerCase();
  if (
    stored !== workspaceEmail ||
    !stored.endsWith(`@${CONTENT_SYNC_USER_DOMAIN}`)
  ) {
    throw new Error(
      `content-sync actor DB email must be exactly ${workspaceEmail} (got ${stored || "(empty)"})`,
    );
  }

  // The actor is the real person, with their real roles and divisions. Both
  // halves of that are deliberate:
  //
  //  - Real identity, because the @agent.q-summit.com audit domain
  //    (./domains.ts) exists to attribute a propose to whoever ran it while
  //    still distinguishing it from that person's manual edits: the changelog
  //    shows "you (agent)". A shared bot account would throw both away, and
  //    there is no such account -- "agent" is a stamp, not a login.
  //  - Real roles, because propose is DRAFTS ONLY and the role does not gate
  //    that. Every write below goes through forceDraftData() plus
  //    `draft: true`, so it lands as a version and never touches the published
  //    row, whatever the actor holds. Publishing stays a human in the admin UI
  //    with their own Google session. Pinning the role to editor would only
  //    have narrowed WHICH drafts an admin may propose -- and refused an
  //    IT admin with no content division outright -- without making publishing
  //    any less possible than it already is (which is: not at all).
  //
  // The security boundary here is the token, not the role: `CONTENT_SYNC_TOKEN`
  // is the thing that must stay secret. A holder can propose drafts in the
  // named actor's scope; they cannot publish, deploy, reach `users`/`legal`,
  // or pass off the result as a manual edit.
  return {
    id: user.id,
    email: contentSyncAuditEmail(stored),
    roles,
    divisions: (user.divisions as string[] | null) ?? null,
  };
}
