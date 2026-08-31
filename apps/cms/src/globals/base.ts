import type {
  Access,
  Field,
  GlobalBeforeChangeHook,
  GlobalConfig,
} from "payload";

import {
  type Division,
  divisionScoped,
  draftVersionsGlobal,
  readOwnDraftVersions,
  readOwnDrafts,
  requireApproverToPublishGlobal,
  requireApproverToRestoreGlobal,
  reviewWorkflowDocumentViews,
  reviewWorkflowEditComponents,
} from "../access";
import { auditFields, stampAuditTrailGlobal } from "../lib/audit";
import { livePreviewUrlForGlobal } from "../lib/live-preview-url";
import {
  capturePriorLiveStatusGlobal,
  capturePriorLiveStatusGlobalRestore,
  triggerDeployAfterGlobalChange,
} from "../lib/trigger-deploy";

/*
 * Common shape every drafts-enabled global shares, whether it is a single
 * page's copy or something site-wide: the head/admin publish gate, audit
 * stamping, bounded draft history, and the review-workflow banner/Versions
 * tab. Access and the publish gate hook stay caller-supplied: page globals,
 * SiteSettings, and Legal each scope reads/writes differently, and Legal
 * requires an admin to publish, not just a Head.
 *
 * pageGlobal() below is the common case (page-* globals); SiteSettings.ts
 * and Legal.ts call this directly because neither has a single page path to
 * build a label/preview from.
 */
export function reviewWorkflowGlobal(opts: {
  slug: string;
  label: string;
  admin: {
    group: string;
    description: string;
    /** Live Preview URL resolver; omit for globals with no single page. */
    preview?: () => string | null;
    /** Exclude the global from the admin nav for some users (Legal: non-admins). */
    hidden?: NonNullable<GlobalConfig["admin"]>["hidden"];
  };
  access: {
    read: Access;
    update: Access;
    /**
     * Version-history reads. REQUIRED, not defaulted: Payload falls back to
     * "any logged-in user" when it is unset, which leaks unpublished drafts
     * (Legal's counsel-reviewed text most sensitively) through
     * GET /api/globals/<slug>/versions. It also must not silently default to
     * `read`, because a `readOwnDrafts`-style Where narrows on `_status`, and
     * on version documents the fields live under `version.*`, so the same
     * clause would not mean what it says. Pass `readOwnDraftVersions(...)`.
     */
    readVersions: Access;
  };
  /** Defaults to requireApproverToPublishGlobal (Head/admin may publish). */
  publishGateHook?: GlobalBeforeChangeHook;
  fields: Field[];
}): GlobalConfig {
  return {
    slug: opts.slug,
    label: opts.label,
    admin: {
      group: opts.admin.group,
      description: opts.admin.description,
      ...(opts.admin.preview ? { preview: opts.admin.preview } : {}),
      ...(opts.admin.hidden ? { hidden: opts.admin.hidden } : {}),
      components: {
        // Globals have no components.edit; the banner slot lives under elements.
        elements: { ...reviewWorkflowEditComponents },
        views: { edit: { ...reviewWorkflowDocumentViews } },
      },
    },
    access: {
      ...opts.access,
      readVersions: opts.access.readVersions,
    },
    hooks: {
      // beforeOperation is the ONLY hook a global version restore runs before
      // writing, so the restore gate and prior-live capture for deploy live
      // here rather than alongside the publish gate below.
      beforeOperation: [
        requireApproverToRestoreGlobal,
        capturePriorLiveStatusGlobalRestore,
      ],
      beforeChange: [
        opts.publishGateHook ?? requireApproverToPublishGlobal,
        stampAuditTrailGlobal,
        capturePriorLiveStatusGlobal,
      ],
      // afterChange also runs on global version restore (beforeChange does not).
      afterChange: [triggerDeployAfterGlobalChange],
    },
    versions: draftVersionsGlobal,
    fields: [...opts.fields, ...auditFields],
  };
}

/*
 * Common shape every page-* global shares: published-only anonymous reads,
 * division-scoped updates, the head/admin publish gate, and bounded draft
 * history. Keeps the 12 page globals from repeating this boilerplate
 * (docs/architecture/08-concepts.md).
 */
export function pageGlobal(opts: {
  slug: string;
  /** Short name shown in the nav, e.g. "Home". */
  label: string;
  /** Public path with trailing slash, e.g. "/" or "/whyq/". */
  path: string;
  /** Who owns the copy (shown in the admin description). */
  ownedBy: string;
  /** Divisions that own this page's copy; drives both read (drafts) and update. */
  divisions: Division[];
  fields: Field[];
}): GlobalConfig {
  return reviewWorkflowGlobal({
    slug: opts.slug,
    label: `${opts.label}  ·  ${opts.path}`,
    admin: {
      group: "Website pages",
      description:
        `Copy for ${opts.path} on the live site. Owned by ${opts.ownedBy}. ` +
        "Use Live Preview (eye icon) to see drafts on the real layout.",
      preview: () => livePreviewUrlForGlobal(opts.slug) ?? null,
    },
    access: {
      read: readOwnDrafts(...opts.divisions),
      readVersions: readOwnDraftVersions(...opts.divisions),
      update: divisionScoped(...opts.divisions),
    },
    fields: opts.fields,
  });
}
