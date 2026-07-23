// Google Workspace group membership drives roles/divisions on the users
// collection (docs/architecture/08-concepts.md, Authorization). The pure
// mapping (buildGroupMap / deriveAccess) is separated from the Directory API
// IO (createMembershipLookup) so the mapping is unit-testable without mocking
// google-auth-library.
import { JWT } from "google-auth-library";

import {
  DIVISIONS,
  ROLES,
  type Division,
  type Role,
} from "../access/divisions";

/** Roles and divisions one Workspace group grants. */
export type GroupAccess = {
  roles: Role[];
  divisions: Division[];
};

/**
 * Group naming convention (prefix defaults to "cms-"):
 * - `<prefix>admins@<domain>`     grants role admin
 * - `<prefix>approvers@<domain>`  grants role approver
 * - `<prefix><division>@<domain>` grants role editor plus that division
 * Returns group email -> access; 9 groups for the current 7 divisions.
 */
export const buildGroupMap = (
  prefix: string,
  domain: string,
  divisions: readonly { value: Division }[],
): Map<string, GroupAccess> => {
  const map = new Map<string, GroupAccess>();
  map.set(`${prefix}admins@${domain}`, { roles: ["admin"], divisions: [] });
  map.set(`${prefix}approvers@${domain}`, {
    roles: ["approver"],
    divisions: [],
  });
  for (const { value } of divisions) {
    map.set(`${prefix}${value}@${domain}`, {
      roles: ["editor"],
      divisions: [value],
    });
  }
  return map;
};

/**
 * Explicit mapping override via the GOOGLE_GROUP_MAP env var: a JSON object of
 * full group email -> { roles?, divisions? }. When set it REPLACES the naming
 * convention entirely, so operators can point at any existing Workspace groups
 * without renaming them (docs/dev/go-live.md, Google SSO setup). Fails fast at
 * config time on anything malformed rather than at someone's login:
 * - keys must look like group emails
 * - roles/divisions must be from the known sets (see ../access/divisions.ts)
 * - every entry must grant at least one role or division
 * - at least one group must grant admin, or the deployment could never
 *   bootstrap or keep an administrator
 * Sign-in still requires at least one ROLE overall (resolveGoogleUser), so a
 * divisions-only membership never lets anyone in by itself.
 */
export const parseGroupMap = (json: string): Map<string, GroupAccess> => {
  const fail = (reason: string): never => {
    throw new Error(
      `GOOGLE_GROUP_MAP is invalid: ${reason} (see apps/cms/.env.example and docs/dev/go-live.md).`,
    );
  };
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    fail("not valid JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    fail("must be a JSON object of group email to { roles, divisions }");
  }
  const validRoles = new Set<string>(ROLES.map((r) => r.value));
  const validDivisions = new Set<string>(DIVISIONS.map((d) => d.value));
  const map = new Map<string, GroupAccess>();
  for (const [groupKey, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    if (!/^[^@\s]+@[^@\s]+$/.test(groupKey)) {
      fail(`"${groupKey}" is not a group email address`);
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      fail(
        `entry for ${groupKey} must be an object with roles and/or divisions arrays`,
      );
    }
    const entry = value as { roles?: unknown; divisions?: unknown };
    const roles = entry.roles ?? [];
    const divisions = entry.divisions ?? [];
    if (!Array.isArray(roles) || !Array.isArray(divisions)) {
      fail(`entry for ${groupKey}: roles and divisions must be arrays`);
    }
    for (const role of roles as unknown[]) {
      if (typeof role !== "string" || !validRoles.has(role)) {
        fail(
          `entry for ${groupKey}: unknown role "${String(role)}" (known: ${[...validRoles].join(", ")})`,
        );
      }
    }
    for (const division of divisions as unknown[]) {
      if (typeof division !== "string" || !validDivisions.has(division)) {
        fail(
          `entry for ${groupKey}: unknown division "${String(division)}" (known: ${[...validDivisions].join(", ")})`,
        );
      }
    }
    if (
      (roles as unknown[]).length === 0 &&
      (divisions as unknown[]).length === 0
    ) {
      fail(
        `entry for ${groupKey} grants nothing; give it roles and/or divisions or remove it`,
      );
    }
    map.set(groupKey, {
      roles: [...new Set(roles as Role[])],
      divisions: [...new Set(divisions as Division[])],
    });
  }
  if (map.size === 0) {
    fail("maps no groups at all");
  }
  if (![...map.values()].some((access) => access.roles.includes("admin"))) {
    fail(
      "no group grants the admin role, which would leave the deployment without any administrator",
    );
  }
  return map;
};

/** Union (deduplicated, insertion-ordered) of the access every held group grants. */
export const deriveAccess = (
  memberships: readonly GroupAccess[],
): GroupAccess => {
  const roles = new Set<Role>();
  const divisions = new Set<Division>();
  for (const membership of memberships) {
    for (const role of membership.roles) roles.add(role);
    for (const division of membership.divisions) divisions.add(division);
  }
  return { roles: [...roles], divisions: [...divisions] };
};

/**
 * "group-not-found" is a 404 from hasMember: the group does not exist, which
 * is a misconfiguration (wrong GOOGLE_GROUP_PREFIX or a group nobody created),
 * not a membership answer. Callers treat it as not-a-member but log it.
 */
export type MembershipResult = "member" | "not-member" | "group-not-found";

export type MembershipLookup = (
  groupKey: string,
  memberKey: string,
) => Promise<MembershipResult>;

const DIRECTORY_SCOPE =
  "https://www.googleapis.com/auth/admin.directory.group.readonly";

/**
 * Directory API membership client. The service account authenticates as
 * ITSELF (plain JWT, no domain-wide delegation, no sub/impersonation claim)
 * and is authorized by holding the Workspace "Groups Reader" admin role,
 * assigned directly in the Admin console. hasMember resolves same-domain
 * nested groups; the Cloud Identity transitive-membership APIs are
 * deliberately not used (Enterprise-edition-gated).
 *
 * Any response other than 2xx or 404 throws, so a Directory API outage fails
 * the login closed instead of falling back to stale or guessed roles.
 */
export const createMembershipLookup = (credentials: {
  clientEmail: string;
  privateKey: string;
}): MembershipLookup => {
  const client = new JWT({
    email: credentials.clientEmail,
    key: credentials.privateKey,
    scopes: [DIRECTORY_SCOPE],
  });
  return async (groupKey, memberKey) => {
    const url = `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(
      groupKey,
    )}/hasMember/${encodeURIComponent(memberKey)}`;
    const response = await client.request<{ isMember?: boolean }>({
      url,
      // Surface 404 (nonexistent group) as a result instead of a throw; every
      // other non-2xx status throws via gaxios and the login fails closed.
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 404,
    });
    if (response.status === 404) return "group-not-found";
    return response.data?.isMember === true ? "member" : "not-member";
  };
};
