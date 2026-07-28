import type { GlobalConfig } from "payload";

import { adminOnly, hasRole, requireAdminToPublishGlobal } from "../access";
import { reviewWorkflowGlobal } from "./base";

const VERBATIM_NOTE =
  "Legally reviewed German text. Paste raw HTML exactly as provided by counsel, " +
  "byte-for-byte; do not reformat, translate, or reword.";

// Mirrors legal.json (imprint, privacy-policy, terms-and-conditions) 1:1.
// Raw HTML textareas, never rich text, so nothing here can silently
// reformat legally reviewed copy (AGENTS.md: legal text stays byte-for-byte).
// Admin (IT) only: hidden from other roles, update+publish gated to admins.
export const Legal: GlobalConfig = reviewWorkflowGlobal({
  slug: "legal",
  label: "Legal (Imprint / Privacy / Terms)",
  admin: {
    group: "System",
    description:
      "Verbatim legal HTML for /imprint, /privacy-policy, and /terms-and-conditions. " +
      "Never edit without counsel sign-off. Prefer Propose for review so another Admin can check.",
    hidden: ({ user }) => !hasRole(user, "admin"),
  },
  access: {
    // Anonymous site build: published only. Logged-in non-admins: published
    // only. Admins: drafts + published.
    read: ({ req }) => {
      if (!req.user) return { _status: { equals: "published" } };
      if (hasRole(req.user, "admin")) return true;
      return { _status: { equals: "published" } };
    },
    // Draft imprint/privacy/terms text sits under counsel review; the version
    // history must not be a way around the admin-only read above. `hidden`
    // only removes the nav entry, it is not access control.
    readVersions: adminOnly,
    update: adminOnly,
  },
  publishGateHook: requireAdminToPublishGlobal,
  fields: [
    {
      name: "imprint",
      type: "textarea",
      required: true,
      admin: {
        description: `${VERBATIM_NOTE} Shown at /imprint/.`,
        rows: 12,
      },
    },
    {
      name: "privacyPolicy",
      type: "textarea",
      required: true,
      admin: {
        description: `${VERBATIM_NOTE} Shown at /privacy-policy/.`,
        rows: 12,
      },
    },
    {
      name: "termsAndConditions",
      type: "textarea",
      required: true,
      admin: {
        description: `${VERBATIM_NOTE} Shown at /terms-and-conditions/.`,
        rows: 12,
      },
    },
  ],
});
