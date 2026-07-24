import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  Field,
} from "payload";

import {
  type Division,
  divisionScoped,
  divisionScopedDelete,
  draftVersions,
  readOwnDraftVersions,
  readOwnDrafts,
  requireApproverToPublish,
  reviewWorkflowDocumentViews,
  reviewWorkflowEditComponents,
} from "../access";
import { auditFields, stampAuditTrail } from "../lib/audit";
import { previewUrlForCollection } from "../lib/live-preview-url";
import {
  capturePriorLiveStatusCollection,
  triggerDeployAfterCollectionChange,
  triggerDeployBeforeCollectionDelete,
} from "../lib/trigger-deploy";

// Appended to every draft list. `updatedAt` earns its place (it is how an
// editor finds "the thing I touched this morning"); the two audit-email
// columns do not, and are opt-in per collection via `showAuditColumns`.
// Three read-only stamp columns on a five-column list pushed the actual
// content off the right edge on a laptop.
const ALWAYS_LIST_COLUMNS = ["_status", "updatedAt"] as const;
const AUDIT_LIST_COLUMNS = ["lastEditedBy", "lastPublishedBy"] as const;

/**
 * Shared shape for draft list collections (Partners, Jobs, …): division
 * access, publish gate, audit stamps, Versions tab with authors, and list
 * columns. Mirrors `pageGlobal` so new list collections cannot omit audit.
 */
export function draftCollection(opts: {
  slug: string;
  /** Divisions that own this list; drives read (drafts), create, update, delete. */
  divisions: Division[];
  useAsTitle: string;
  /** Content columns; `_status` and `updatedAt` are appended when missing. */
  defaultColumns: string[];
  /**
   * Also show `lastEditedBy` / `lastPublishedBy` as list columns. Off by
   * default: they are two wide email columns that only matter while chasing a
   * specific change, and the Change history sidebar block carries the same
   * information on the document itself.
   */
  showAuditColumns?: boolean;
  /**
   * Extra fields the admin list search matches besides `useAsTitle`, e.g.
   * company on Speakers. Omit when the title is the only searchable text.
   */
  listSearchableFields?: string[];
  description: string;
  fields: Field[];
  defaultSort?: CollectionConfig["defaultSort"];
  labels?: CollectionConfig["labels"];
  adminGroup?: string;
  /**
   * Extra beforeChange hooks run before the publish gate and audit stamp,
   * e.g. enforceUniqueKey for a compound content-sync upsert key. Omit for
   * collections with no extra invariant to check.
   */
  beforeChangeHooks?: CollectionBeforeChangeHook[];
}): CollectionConfig {
  const columns = [...opts.defaultColumns];
  const appended = opts.showAuditColumns
    ? [...ALWAYS_LIST_COLUMNS, ...AUDIT_LIST_COLUMNS]
    : ALWAYS_LIST_COLUMNS;
  for (const col of appended) {
    if (!columns.includes(col)) columns.push(col);
  }

  return {
    slug: opts.slug,
    ...(opts.labels ? { labels: opts.labels } : {}),
    ...(opts.defaultSort !== undefined
      ? { defaultSort: opts.defaultSort }
      : {}),
    admin: {
      useAsTitle: opts.useAsTitle,
      defaultColumns: columns,
      ...(opts.listSearchableFields
        ? { listSearchableFields: opts.listSearchableFields }
        : {}),
      group: opts.adminGroup ?? "Lists & people",
      description: opts.description,
      // Payload's default is 10 rows. Every list here is a hand-curated set an
      // editor scans as a whole (the committed fixture already ships 19 FAQs),
      // so paging at 10 hid content behind a pager for no reason.
      pagination: { defaultLimit: 100, limits: [25, 50, 100, 250] },
      // Preview button on the document, pointing at the page this entry shows
      // up on. Live Preview stays globals-only; a list document has no
      // per-document draft route to iframe.
      preview: (doc) =>
        previewUrlForCollection(opts.slug, doc as Record<string, unknown>),
      components: {
        edit: { ...reviewWorkflowEditComponents },
        views: { edit: { ...reviewWorkflowDocumentViews } },
      },
    },
    access: {
      read: readOwnDrafts(...opts.divisions),
      // Payload defaults readVersions to "any logged-in user" when it is left
      // unset, which hands every editor the unpublished drafts of every other
      // division through GET /api/<collection>/versions.
      readVersions: readOwnDraftVersions(...opts.divisions),
      create: divisionScoped(...opts.divisions),
      update: divisionScoped(...opts.divisions),
      delete: divisionScopedDelete(...opts.divisions),
    },
    hooks: {
      beforeChange: [
        ...(opts.beforeChangeHooks ?? []),
        requireApproverToPublish,
        stampAuditTrail,
        capturePriorLiveStatusCollection,
      ],
      afterChange: [triggerDeployAfterCollectionChange],
      beforeDelete: [triggerDeployBeforeCollectionDelete],
    },
    versions: draftVersions,
    fields: [...opts.fields, ...auditFields],
  };
}
