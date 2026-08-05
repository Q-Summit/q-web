/**
 * Whether a write leaves the document/global live (published).
 * Shared by the publish gate and audit stamps so both use the same rule:
 * publishing a draft, re-publishing, or editing an already-live doc without
 * an explicit `_status: "draft"`.
 */
export function willWriteLeavePublished(
  data: unknown,
  originalDoc: unknown,
): boolean {
  const incoming = (data as { _status?: string } | null | undefined)?._status;
  const current = (originalDoc as { _status?: string } | null | undefined)
    ?._status;
  return (
    incoming === "published" ||
    (incoming !== "draft" && current === "published")
  );
}

/**
 * Whether a write takes a currently-live document/global DOWN (published to
 * draft). The mirror image of `willWriteLeavePublished`, and just as gated:
 * removing a live page is the same editorial act as putting one up.
 *
 * Note this shape is ambiguous on its own. Saving a draft of a live document
 * (the normal "Propose for review" flow) produces exactly the same `data` /
 * `originalDoc` pair as unpublishing it, because Payload's beforeChange hook
 * is not told whether the caller passed `draft: true`. The caller must
 * disambiguate with `isDraftWrite` below before treating this as an unpublish.
 */
export function willWriteUnpublish(
  data: unknown,
  originalDoc: unknown,
): boolean {
  const incoming = (data as { _status?: string } | null | undefined)?._status;
  const current = (originalDoc as { _status?: string } | null | undefined)
    ?._status;
  return incoming === "draft" && current === "published";
}

/**
 * `req.context` key set by content-sync writes. The Local API carries no
 * query string, so a proposed draft over a live document is indistinguishable
 * from an unpublish without this marker (see `isDraftWrite`).
 */
export const CONTENT_SYNC_CONTEXT = "contentSync" as const;

/**
 * Draft-only write (version row; live untouched)?
 * - REST admin: `?draft=true` (Save draft / Propose). Unpublish has no draft flag.
 * - Local API / content-sync: `context.contentSync` (no query string).
 * Query-string `draft` is trusted only for REST: GraphQL takes `draft` as a
 * field arg, so `?draft=true` on `/api/graphql` must not open the gate.
 *
 * Caveat: the admin list view's bulk Publish (PublishMany) sends `?draft=true`
 * WITH `_status: "published"`, and that write does go live. This predicate
 * cannot see the body, so a caller deciding "did the live row change" must
 * also check the resulting doc's `_status` (see trigger-deploy). The publish
 * gate is unaffected: it 403s on incoming `_status: "published"` before
 * consulting this.
 */
export function isDraftWrite(req: unknown): boolean {
  const r = req as
    | {
        query?: { draft?: unknown };
        context?: Record<string, unknown>;
        payloadAPI?: unknown;
      }
    | null
    | undefined;
  if (r?.context?.[CONTENT_SYNC_CONTEXT] === true) return true;
  if (r?.payloadAPI !== "REST") return false;
  const draft = r?.query?.draft;
  return draft === true || draft === "true";
}

/**
 * Live-row `_status` via the main table (not `originalDoc` / latest version).
 * Pending drafts make the latest version read `"draft"` while live stays
 * `"published"`: see access gate + deploy stash.
 */
export async function liveStatus(args: {
  req: unknown;
  collection?: string;
  global?: string;
  id?: unknown;
}): Promise<string | null> {
  const req = args.req as
    | {
        context?: Record<string, unknown>;
        payload?: { db?: Record<string, (o: unknown) => Promise<unknown>> };
      }
    | undefined;

  // Per-request memo via the deploy stash map: the publish gate and the
  // deploy stash both need the same pre-write row status, and every caller
  // runs before the write, so within one request the answer cannot change.
  // Without this a bulk op costs two serialized queries per doc on one Neon
  // connection.
  const memoKey =
    args.global ||
    (args.collection && args.id !== undefined && args.id !== null)
      ? deployStashKey(args)
      : null;
  if (memoKey && req?.context) {
    const map = req.context[DEPLOY_PRIOR_LIVE_STATUS];
    if (map && typeof map === "object" && memoKey in map) {
      return (map as Record<string, string | null>)[memoKey] ?? null;
    }
  }

  const status = await liveStatusUncached(args);
  if (memoKey && req && req.context) {
    const map = (req.context[DEPLOY_PRIOR_LIVE_STATUS] ??= {}) as Record<
      string,
      string | null
    >;
    map[memoKey] = status;
  }
  return status;
}

async function liveStatusUncached(args: {
  req: unknown;
  collection?: string;
  global?: string;
  id?: unknown;
}): Promise<string | null> {
  const req = args.req as
    | { payload?: { db?: Record<string, (o: unknown) => Promise<unknown>> } }
    | undefined;
  const db = req?.payload?.db;
  // No adapter reachable is the same situation as a failed read: unknown, and
  // therefore protected. Returning null here would have opened the gate.
  if (!db) return "unknown";

  try {
    let row: unknown;
    if (args.global) {
      row = await db.findGlobal?.({ slug: args.global, req });
    } else if (args.collection && args.id !== undefined && args.id !== null) {
      row = await db.findOne?.({
        collection: args.collection,
        where: { id: { equals: args.id } },
        req,
      });
    }
    const status = (row as { _status?: unknown } | null | undefined)?._status;
    return typeof status === "string" ? status : null;
  } catch {
    // Fail CLOSED at the call site: an unreadable live row must not be read as
    // "not published", because that is the answer that skips the gate.
    return "unknown";
  }
}

/**
 * `req.context` marker set by the collection restoreVersion beforeOperation
 * hook (server-set; REST carries no client context). Restore is the one
 * operation where `data._status: "published"` arrives together with
 * `?draft=true` on a write that leaves the MAIN row untouched: Payload
 * downgrades the restored version to draft only after beforeChange runs, so
 * without this marker the gate and the audit stamp both misread "Restore as
 * draft" as a publish.
 */
export const COLLECTION_RESTORE_CONTEXT = "collectionRestoreVersion" as const;

/**
 * A collection "Restore as draft": version-only, live row untouched. NOT true
 * for global restores (Payload writes the live global row even with
 * `?draft=true`; those are gated separately by requireApproverToRestoreGlobal).
 */
export function isVersionOnlyRestore(req: unknown): boolean {
  const ctx = (req as { context?: Record<string, unknown> } | null)?.context;
  return ctx?.[COLLECTION_RESTORE_CONTEXT] === true && isDraftWrite(req);
}

/** Stash live-row status before write for deploy afterChange (previousDoc ≠ live). */
export const DEPLOY_PRIOR_LIVE_STATUS = "deployPriorLiveStatus" as const;

/**
 * `req.context` marker set by the global restoreVersion beforeOperation hook.
 * Payload's global restore writes the LIVE global row even with `?draft=true`
 * ("Restore as draft" forces `_status: "draft"` and still calls
 * `db.updateGlobal`), so the deploy trigger must not read that request's
 * draft flag as "live row untouched".
 */
export const DEPLOY_GLOBAL_RESTORE = "deployGlobalRestore" as const;

/**
 * The stash is a per-document map, not a scalar. Bulk operations run every
 * selected doc's hook chain concurrently on ONE shared `req`, so a scalar
 * slot lets doc B's beforeChange overwrite doc A's prior status before doc
 * A's afterChange reads it; a mixed bulk Unpublish could then read "draft"
 * for a live row and skip the rebuild.
 */
function deployStashKey(args: {
  collection?: string;
  global?: string;
  id?: unknown;
}): string {
  return args.global
    ? `global:${args.global}`
    : `${args.collection ?? "?"}:${String(args.id)}`;
}

export async function stashPriorLiveStatus(args: {
  req: unknown;
  collection?: string;
  global?: string;
  id?: unknown;
}): Promise<void> {
  const req = args.req as { context?: Record<string, unknown> } | null;
  if (!req) return;
  if (!req.context) req.context = {};
  const map = (req.context[DEPLOY_PRIOR_LIVE_STATUS] ??= {}) as Record<
    string,
    string | null
  >;
  map[deployStashKey(args)] = await liveStatus(args);
}

export function readPriorLiveStatus(
  req: unknown,
  key: { collection?: string; global?: string; id?: unknown },
): string | undefined {
  const ctx = (req as { context?: Record<string, unknown> } | null)?.context;
  const map = ctx?.[DEPLOY_PRIOR_LIVE_STATUS];
  if (!map || typeof map !== "object") return undefined;
  const value = (map as Record<string, unknown>)[deployStashKey(key)];
  return typeof value === "string" ? value : undefined;
}
