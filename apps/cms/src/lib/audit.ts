import type {
  CollectionBeforeChangeHook,
  Field,
  GlobalBeforeChangeHook,
} from "payload";

import { willWriteLeavePublished } from "./publish-state";

/** Keys stamped by hooks; also stripped on content-sync ingest. */
export const AUDIT_FIELD_NAMES = [
  "lastEditedBy",
  "lastEditedAt",
  "lastPublishedBy",
  "lastPublishedAt",
] as const;

export type AuditFieldName = (typeof AUDIT_FIELD_NAMES)[number];

const auditFieldAccess = {
  // Hooks stamp these; clients must not create/update via API.
  create: () => false,
  update: () => false,
  read: () => true,
};

/**
 * Sidebar audit trail on draft-enabled content: who last proposed/edited and
 * who last published to the live site. Hooks stamp these; the UI is read-only.
 *
 * Person identity is stored as email text (not a Users relationship) so Heads
 * and editors can always see who touched a doc even when Users read is
 * self-scoped for non-admins.
 */
export const auditFields: Field[] = [
  {
    // One collapsed sidebar block rather than five loose read-only fields.
    // On Partners the audit trail was four read-only inputs plus a history
    // list stacked above four editable ones, so the sidebar read as mostly
    // machine output. Unnamed collapsible: no column, no migration.
    type: "collapsible",
    label: "Change history",
    admin: { position: "sidebar", initCollapsed: true },
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "lastEditedBy",
            type: "text",
            label: "Last edited by",
            access: auditFieldAccess,
            admin: {
              readOnly: true,
              width: "50%",
            },
          },
          {
            name: "lastEditedAt",
            type: "date",
            label: "Last edited at",
            access: auditFieldAccess,
            admin: {
              readOnly: true,
              date: { pickerAppearance: "dayAndTime" },
              width: "50%",
            },
          },
        ],
      },
      {
        type: "row",
        fields: [
          {
            name: "lastPublishedBy",
            type: "text",
            label: "Last published by",
            access: auditFieldAccess,
            admin: {
              readOnly: true,
              width: "50%",
            },
          },
          {
            name: "lastPublishedAt",
            type: "date",
            label: "Last published at",
            access: auditFieldAccess,
            admin: {
              readOnly: true,
              date: { pickerAppearance: "dayAndTime" },
              width: "50%",
            },
          },
        ],
      },
      {
        name: "publishHistory",
        type: "ui",
        admin: {
          components: {
            Field: "/components/publish-history#PublishHistoryField",
          },
        },
      },
    ],
  },
];

function userEmail(user: unknown): string | undefined {
  if (!user || typeof user !== "object") return undefined;
  const email = (user as { email?: string }).email;
  return typeof email === "string" && email.length > 0 ? email : undefined;
}

type AuditData = Partial<Record<AuditFieldName, string | null | undefined>>;

function stripClientAuditFields(data: AuditData): void {
  for (const key of AUDIT_FIELD_NAMES) {
    delete data[key];
  }
}

function applyAuditStamp<T>(args: {
  data: T;
  originalDoc: unknown;
  req: { user: unknown };
}): T {
  const email = userEmail(args.req.user);
  if (!email || !args.data || typeof args.data !== "object") return args.data;

  const data = args.data as AuditData;
  // Defense in depth: drop any client-supplied stamps before writing ours.
  stripClientAuditFields(data);

  const now = new Date().toISOString();
  data.lastEditedBy = email;
  data.lastEditedAt = now;

  if (willWriteLeavePublished(args.data, args.originalDoc)) {
    data.lastPublishedBy = email;
    data.lastPublishedAt = now;
  }

  return args.data;
}

/**
 * Stamp lastEdited* on every save; stamp lastPublished* when the write leaves
 * the document live. Runs after the publish gate so failed publishes never stamp.
 */
export const stampAuditTrail: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  req,
}) => applyAuditStamp({ data, originalDoc, req });

/** Same stamps for globals (page-* / site-settings / legal). */
export const stampAuditTrailGlobal: GlobalBeforeChangeHook = ({
  data,
  originalDoc,
  req,
}) => applyAuditStamp({ data, originalDoc, req });
