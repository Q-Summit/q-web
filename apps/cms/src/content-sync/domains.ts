/**
 * Forced Workspace domain for looking up the real Payload user (Google JIT).
 */
export const CONTENT_SYNC_USER_DOMAIN = "q-summit.com";

/**
 * Domain stamped into lastEditedBy for content-sync writes so the changelog
 * distinguishes agent proposes from manual admin edits by the same person.
 */
export const CONTENT_SYNC_AUDIT_DOMAIN = "agent.q-summit.com";
