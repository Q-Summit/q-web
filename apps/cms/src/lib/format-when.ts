import { CONTENT_SYNC_AUDIT_DOMAIN } from "../content-sync/domains";

/** Shared date label for admin audit / history UIs. */
export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

/**
 * Audit column label. Agent proposes stamp `@agent.q-summit.com` so they read
 * as "name (agent)" vs a manual admin edit which stays the Workspace email.
 */
export function whoLabel(value: string | null | undefined): string {
  if (!value || value.length === 0) return "-";
  const at = value.lastIndexOf("@");
  if (at === -1) return value;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1).toLowerCase();
  if (domain === CONTENT_SYNC_AUDIT_DOMAIN) {
    return `${local} (agent)`;
  }
  return value;
}
