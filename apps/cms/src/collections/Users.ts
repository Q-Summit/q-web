import type { CollectionConfig } from "payload";

import { adminOnly, divisionsField, rolesField } from "../access";
import { hasRole } from "../access/divisions";

// Editor accounts: one personal account per member, scoped to a division;
// no shared logins (docs/architecture/08-concepts.md).
//
// Auth model: production is Google-only. The local email/password strategy is
// disabled there and sign-in goes through the payload-oauth2 Google strategy
// (src/auth/google.ts); Workspace groups are the source of truth for
// roles/divisions and re-sync on every login, and offboarding happens by
// removing group memberships (next login is rejected). An already-issued
// cookie stays valid up to tokenExpiration below; roles are read from the
// user doc per request, so an admin edits or deletes the doc for immediate
// revocation (docs/dev/go-live.md, Google SSO setup).
//
// Local keeps the password strategy in the schema (disableLocalStrategy only
// in production) so drizzle schema-push does not try to drop hash/salt and
// hang on an interactive prompt. When Google env is set locally, the login
// UI hides the password form via LoginWithGoogle (Google-only surface).
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    // 1 hour caps the offboarding window for a group-removed user who still
    // holds a session cookie (Payload default is 2 hours).
    tokenExpiration: 3600,
    // Payload's default is `{ sameSite: "Lax", secure: false }`, so without
    // this the admin JWT is sent over plaintext http:// too. That cookie is
    // the credential that can publish to the live site (and, for an admin,
    // edit roles and divisions), so it must never leave TLS. Conditional on
    // NODE_ENV because local dev runs on http://localhost:3000, where a
    // Secure cookie would never be stored.
    cookies: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    },
    ...(process.env.NODE_ENV === "production"
      ? { disableLocalStrategy: true as const }
      : {}),
  },
  admin: {
    useAsTitle: "email",
    group: "System",
    description:
      "CMS accounts. Roles and divisions normally come from Google Workspace groups on login; " +
      "prefer changing group membership over editing users here.",
    hidden: ({ user }) => !hasRole(user, "admin"),
  },
  access: {
    // Account directory (emails, roles, divisions) is admin-only. Any other
    // logged-in editor is scoped to their own record via a query constraint,
    // so a division editor cannot enumerate every account. Admins pass
    // unconstrained; the login flow itself reads the authenticating user
    // through the auth strategy, not this collection `read`, so self-scoping
    // does not break sign-in.
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (hasRole(user, "admin")) return true;
      return { id: { equals: user.id } };
    },
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    divisionsField,
    rolesField,
    // Provider-subject field payload-oauth2 would otherwise add itself, but
    // only while the plugin is enabled (production). Declared here with the
    // plugin's exact shape so the users schema is identical whether Google
    // login is on or off and dev-generated migrations match production.
    // Unused for identity (useEmailAsIdentity: true keys on email).
    {
      name: "sub",
      type: "text",
      index: true,
      access: {
        read: () => true,
        create: () => true,
        update: () => false,
      },
    },
  ],
};
