import type { Field } from "payload";

// The board divisions that get scoped editor accounts
// (docs/architecture/08-concepts.md, Authorization).
export const DIVISIONS = [
  { label: "Chair", value: "chair" },
  { label: "PR", value: "pr" },
  { label: "Partner", value: "partner" },
  { label: "Finance", value: "finance" },
  { label: "Operations", value: "operations" },
  { label: "Concept", value: "concept" },
  { label: "IT", value: "it" },
] as const;

export type Division = (typeof DIVISIONS)[number]["value"];

export const ROLES = [
  // Editors propose drafts only. Heads (role value still `approver` for
  // Google groups / existing DB rows) review and may publish. Admins (IT)
  // manage accounts, Legal, and can also publish.
  { label: "Editor", value: "editor" },
  { label: "Head", value: "approver" },
  { label: "Admin", value: "admin" },
] as const;

export type Role = (typeof ROLES)[number]["value"];

// Shape of the auth fields below on the users collection. Access helpers
// read req.user through this type so they do not depend on generated
// payload-types (which change whenever any collection changes).
export type ScopedUser = {
  divisions?: string[] | null;
  roles?: string[] | null;
};

export const hasRole = (user: unknown, role: Role): boolean =>
  Boolean(((user ?? {}) as ScopedUser).roles?.includes(role));

export const inDivision = (
  user: unknown,
  divisions: readonly Division[],
): boolean => {
  const own = ((user ?? {}) as ScopedUser).divisions ?? [];
  return own.some((d) => (divisions as readonly string[]).includes(d));
};

// Field defs for the users collection. Only admins may change who belongs
// to which division or who can approve.
export const divisionsField: Field = {
  name: "divisions",
  type: "select",
  hasMany: true,
  options: [...DIVISIONS],
  access: {
    update: ({ req }) => hasRole(req.user, "admin"),
  },
  admin: {
    description: "Divisions whose content this account may edit.",
  },
};

export const rolesField: Field = {
  name: "roles",
  type: "select",
  hasMany: true,
  required: true,
  options: [...ROLES],
  access: {
    update: ({ req }) => hasRole(req.user, "admin"),
  },
  admin: {
    description:
      "Editors propose drafts only. Heads review and publish. Admins manage users and Legal.",
  },
};
