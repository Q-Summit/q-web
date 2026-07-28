// Access-control scaffold implementing docs/architecture/08-concepts.md:
// per-division scoping, drafts for everyone, publishing gated to heads + admins.
// Collections and globals compose these helpers; keep new rules here, not
// inline or duplicated between the two.
import { APIError } from "payload";
import type {
  Access,
  CollectionBeforeChangeHook,
  CollectionConfig,
  GlobalBeforeChangeHook,
  GlobalConfig,
} from "payload";

// willWriteLeavePublished / willWriteUnpublish are still re-exported below for
// lib/audit.ts and the tests, but the gate itself no longer uses them: it reads
// the live row instead of comparing against originalDoc.
import { isDraftWrite, liveStatus } from "../lib/publish-state";
import { hasRole, inDivision, type Division } from "./divisions";

export {
  DIVISIONS,
  ROLES,
  divisionsField,
  hasRole,
  rolesField,
} from "./divisions";
export type { Division, Role, ScopedUser } from "./divisions";
export {
  CONTENT_SYNC_CONTEXT,
  isDraftWrite,
  liveStatus,
  willWriteLeavePublished,
  willWriteUnpublish,
} from "../lib/publish-state";

/** Public read access (the static site build fetches anonymously). */
export const anyone: Access = () => true;

/** Any logged-in editor account. */
export const authenticated: Access = ({ req }) => Boolean(req.user);

/** Admins only (IT; account management, schema-level settings). */
export const adminOnly: Access = ({ req }) => hasRole(req.user, "admin");

/**
 * Role value is still `approver` (Google groups / DB). User-facing name is
 * "Head": division leads who may publish after review.
 */
export const isHead = (user: unknown): boolean =>
  hasRole(user, "approver") || hasRole(user, "admin");

export const isAdmin = (user: unknown): boolean => hasRole(user, "admin");

/**
 * Write access for a content area:
 * - Heads + admins: always (so they can review/publish across divisions)
 * - Editors: only in the named division(s), and never when the write would
 *   publish (`data._status === "published"`). That hides the Admin UI Publish
 *   button (Payload probes update with `_status: "published"`) while still
 *   allowing Propose / Save draft.
 */
export const divisionScoped =
  (...divisions: Division[]): Access =>
  ({ req, data }) => {
    if (!req.user) return false;
    if (isHead(req.user)) return true;
    if (!inDivision(req.user, divisions)) return false;
    if ((data as { _status?: string } | undefined)?._status === "published") {
      return false;
    }
    return true;
  };

/**
 * Delete access: Heads/admins may delete anything in scope. Editors may only
 * delete never-published drafts in their division, not live rows (delete is
 * not probed with `_status: published`, so reusing `divisionScoped` alone
 * left a hole).
 */
export const divisionScopedDelete =
  (...divisions: Division[]): Access =>
  ({ req }) => {
    if (!req.user) return false;
    if (isHead(req.user)) return true;
    if (!inDivision(req.user, divisions)) return false;
    return { _status: { equals: "draft" } };
  };

/**
 * Per-division draft visibility for drafts-enabled collections/globals:
 * anonymous readers (the static-site build) AND editors outside the owning
 * division(s) see published documents only; the owning division's editors,
 * plus heads and admins (who review and publish across divisions), also
 * see drafts. Mirrors the `divisionScoped` write helper so read and write
 * scopes line up. Pass the same divisions used for `update`.
 */
export const readOwnDrafts =
  (...divisions: Division[]): Access =>
  ({ req }) => {
    if (!req.user) return { _status: { equals: "published" } };
    if (isHead(req.user) || inDivision(req.user, divisions)) return true;
    return { _status: { equals: "published" } };
  };

/**
 * Version-history reads for a drafts-enabled collection/global.
 *
 * Deliberately boolean rather than reusing `readOwnDrafts`: that helper narrows
 * with `{ _status: { equals: "published" } }`, and on the versions collection
 * the document fields live under `version.*`, so the same Where would not mean
 * what it says. Version history is an editorial tool, so the rule is simply
 * "the people who own this content, plus heads and admins". Everyone else,
 * including anonymous build requests, gets nothing.
 *
 * Leaving `readVersions` unset is NOT equivalent: Payload then falls back to
 * "any authenticated user", which exposes every division's unpublished drafts.
 */
export const readOwnDraftVersions =
  (...divisions: Division[]): Access =>
  ({ req }) => {
    if (!req.user) return false;
    return isHead(req.user) || inDivision(req.user, divisions);
  };

/**
 * Shared core for the approval gate: editors can save drafts (propose), but
 * only heads (or admins) may put a document/global live OR change one that is
 * already live.
 *
 * We decide from the RESULTING status, using both the incoming `data` and the
 * existing `originalDoc`, not `data._status` alone. A plain update that omits
 * `_status` still writes the published version, so keying off `data._status`
 * by itself let a non-head edit a live document through a direct REST /
 * GraphQL / Local API call (the admin UI always sends `_status`, which hid the
 * hole). The rule: block a non-head whenever the write would leave the doc
 * published (publishing a draft, re-publishing, or editing the live version),
 * unless they are explicitly saving a draft (`_status: "draft"`).
 *
 * The gate is symmetric: taking a live document DOWN is restricted to the same
 * people who may put one up. Gating only the "leaves it published" direction
 * let any division editor unpublish live content through three paths that
 * never send `_status: "published"`: the list-view bulk Unpublish button, a
 * bare `PATCH /api/<collection>/<id>` with `{"_status":"draft"}`, and
 * `POST /api/<collection>/versions/<id>` (restoreVersion, whose access check
 * runs `access.update` with `data` undefined so `divisionScoped` passes, and
 * which does run these beforeChange hooks).
 *
 * The unpublish branch must NOT compare against `originalDoc`. Payload builds
 * that from `getLatestCollectionVersion` / `getLatestGlobalVersion` with no
 * `published` flag, so it is the LATEST version, and a pending draft is the
 * latest version. Once an editor has proposed a draft on a live document, an
 * `originalDoc`-based rule reads `_status: "draft"` and silently stops
 * protecting the document, which is the state the normal review workflow
 * creates. So the live status is read from the main row instead
 * (`liveStatus()` in lib/publish-state.ts), and the gate fails closed when it
 * cannot be read.
 *
 * Collection and global beforeChange hooks have different argument shapes, so
 * this is wrapped by thin, correctly-typed hooks below.
 */
async function assertPublishAllowed(args: {
  data: unknown;
  originalDoc: unknown;
  req: { user: unknown };
  collection?: string;
  global?: string;
  id?: unknown;
  /** When set, only that role check may publish (Legal is admin-only). */
  allow?: (user: unknown) => boolean;
}): Promise<void> {
  const allowed = args.allow ?? isHead;
  if (allowed(args.req.user)) return;

  const incoming = (args.data as { _status?: string } | null | undefined)
    ?._status;

  // Explicitly putting something live is always a Head decision.
  if (incoming === "published") {
    throw new APIError(
      args.allow
        ? "Only admins can publish Legal. Propose a draft or ask IT."
        : "Only Heads and Admins can publish. Click \u201cPropose for review\u201d and ask a Head to publish.",
      403,
    );
  }

  // A genuine draft write only ever adds a version row; the live document is
  // untouched, so a non-head may do it freely. Everything that reaches past
  // this point writes the MAIN row.
  if (isDraftWrite(args.req)) return;

  // One question decides the rest: is the row this write lands on live?
  //
  // Asking `originalDoc` cannot answer it. Payload builds that from
  // getLatestCollectionVersion / getLatestGlobalVersion with no `published`
  // flag, so it is the latest VERSION, and drizzle stamps every version
  // `latest: true` -- drafts included. On a published document with a pending
  // draft (what "Propose for review" and `make propose` both create)
  // `originalDoc._status` reads "draft", and any rule keyed off it stops
  // protecting the live document. That is not only the unpublish case: a plain
  // `PATCH {"name":"..."}` with no `_status` and no `?draft=true` writes the
  // live row too, and only a live-row lookup can see it coming.
  const live = await liveStatus({
    req: args.req,
    collection: args.collection,
    global: args.global,
    id: args.id,
  });

  // "unknown" means the lookup failed; treat that as protected rather than
  // letting an unreadable row open the gate.
  if (live !== "published" && live !== "unknown") return;

  throw new APIError(
    incoming === "draft"
      ? args.allow
        ? "Only admins can unpublish Legal. Ask IT."
        : "Only Heads and Admins can unpublish live content. Save a draft instead, or ask a Head to take the page down."
      : args.allow
        ? "Only admins can change live Legal text. Propose a draft or ask IT."
        : "Only Heads and Admins can change live content. Click \u201cPropose for review\u201d so a Head can publish your changes.",
    403,
  );
}

/** Approval gate for collections; attach as a beforeChange hook. */
export const requireApproverToPublish: CollectionBeforeChangeHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  await assertPublishAllowed({
    data,
    originalDoc,
    req,
    collection: collection?.slug,
    id: (originalDoc as { id?: unknown } | undefined)?.id,
  });
  return data;
};

/** Approval gate for globals (same rule, `GlobalBeforeChangeHook` signature). */
export const requireApproverToPublishGlobal: GlobalBeforeChangeHook = async ({
  data,
  global,
  originalDoc,
  req,
}) => {
  await assertPublishAllowed({
    data,
    originalDoc,
    req,
    global: global?.slug,
  });
  return data;
};

/**
 * Restore gate for GLOBALS. Attach as a `beforeOperation` hook.
 *
 * Globals need their own gate because `payload/dist/globals/operations/restoreVersion.js`
 * runs only `beforeOperation`, `afterRead` and `afterChange` -- there is NO
 * `beforeChange` in that path, it writes straight through
 * `payload.db.updateGlobal(...)`. So `requireApproverToPublishGlobal` simply
 * never executes for a version restore, and the Versions tab "Restore this
 * version" button (rendered for anyone with update permission) let a division
 * editor push an old version of a page global live, or take the live one down,
 * with no Head involved and no audit stamp.
 *
 * Collections do not need this: their restoreVersion DOES run beforeChange.
 *
 * Restoring is inherently a publish-or-unpublish decision on a live global, so
 * it is Head/Admin only rather than status-dependent.
 */
export const requireApproverToRestoreGlobal = (async (args: {
  args: unknown;
  operation?: string;
  req: { user?: unknown };
}) => {
  if (args.operation === "restoreVersion" && !isHead(args.req?.user)) {
    throw new APIError(
      "Only Heads and Admins can restore a previous version of a page. Ask a Head to do it.",
      403,
    );
  }
  return args.args;
}) as unknown as NonNullable<
  NonNullable<GlobalConfig["hooks"]>["beforeOperation"]
>[number];

/** Legal (and similar): only admins may publish or edit the live version. */
export const requireAdminToPublishGlobal: GlobalBeforeChangeHook = async ({
  data,
  global,
  originalDoc,
  req,
}) => {
  await assertPublishAllowed({
    data,
    originalDoc,
    req,
    global: global?.slug,
    allow: isAdmin,
  });
  return data;
};

/**
 * Shared versions config: drafts before publish, bounded history.
 *
 * validate: true runs field validation on every draft save, not only at
 * publish. Without it an editor can propose a draft missing required fields
 * or carrying a malformed slug/URL, and the errors surface for the FIRST
 * time when a Head clicks Publish, bouncing the draft back. There is no
 * autosave configured, so validation only fires on explicit saves.
 */
export const draftVersions: NonNullable<CollectionConfig["versions"]> = {
  drafts: { validate: true },
  maxPerDoc: 50,
};

/** Globals use `max` instead of collections' `maxPerDoc` for the same idea. */
export const draftVersionsGlobal: NonNullable<GlobalConfig["versions"]> = {
  drafts: { validate: true },
  max: 50,
};

/** Shared edit-view banner path for collections/globals with drafts. */
// No `as const`: Payload's admin.components.edit wants a mutable
// CustomComponent[], and a readonly tuple fails to spread into it.
export const reviewWorkflowEditComponents = {
  beforeDocumentControls: ["/components/workflow-banner#WorkflowBanner"],
};

/**
 * Custom Versions tab: shows Edited by / Published by (audit stamps), not
 * just Updated At / Version ID / Status.
 */
export const reviewWorkflowDocumentViews = {
  versions: {
    Component: "/components/versions-with-authors#VersionsWithAuthors",
  },
};
