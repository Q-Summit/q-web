// Workers Builds deploy hook after a Head/Admin live-site change.
// https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/
// content-sync MUST NEVER import this module (see content-sync.test.ts).
import { after } from "next/server";
import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  GlobalAfterChangeHook,
  GlobalBeforeChangeHook,
  GlobalBeforeOperationHook,
} from "payload";

import { isHead } from "../access";
import {
  CONTENT_SYNC_CONTEXT,
  isDraftWrite,
  liveStatus,
  readPriorLiveStatus,
  stashPriorLiveStatus,
} from "./publish-state";

export const PUBLISH_DEPLOY_FETCH_TIMEOUT_MS = 5_000;

type Logger = {
  info?: (msg: string) => void;
  error?: (msg: string) => void;
  debug?: (msg: string) => void;
};

function statusOf(doc: unknown): string | undefined {
  const status = (doc as { _status?: unknown } | null | undefined)?._status;
  return typeof status === "string" ? status : undefined;
}

function payloadLogger(req: unknown): Logger | null {
  return (
    (req as { payload?: { logger?: Logger } } | null)?.payload?.logger ?? null
  );
}

/** was live / is live / unknown prior → rebuild (Heads only). */
export function shouldTriggerDeploy(args: {
  previousStatus?: string | null;
  nextStatus?: string | null;
  user: unknown;
}): boolean {
  if (!isHead(args.user)) return false;
  const wasLive =
    args.previousStatus === "published" || args.previousStatus === "unknown";
  const isLive = args.nextStatus === "published";
  return wasLive || isLive;
}

export function schedulePublishDeploy(logger?: Logger | null): void {
  const url = process.env.CLOUDFLARE_DEPLOY_HOOK_URL?.trim();
  if (!url) {
    const msg =
      "publish-deploy: CLOUDFLARE_DEPLOY_HOOK_URL unset; skip rebuild";
    if (process.env.VERCEL_ENV === "production") {
      logger?.error?.(msg);
    } else {
      logger?.debug?.(msg);
    }
    return;
  }

  const work = (async () => {
    try {
      const res = await fetch(url, {
        method: "POST",
        signal: AbortSignal.timeout(PUBLISH_DEPLOY_FETCH_TIMEOUT_MS),
      });
      if (res.ok) {
        logger?.info?.(
          `publish-deploy: Workers Builds hook ok (HTTP ${res.status})`,
        );
        return;
      }
      const body = await res.text().catch(() => "");
      logger?.error?.(
        `publish-deploy: hook HTTP ${res.status}` +
          (body ? ` body=${body.slice(0, 200)}` : ""),
      );
    } catch (err) {
      logger?.error?.(
        `publish-deploy: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  })();

  try {
    after(() => work);
  } catch {
    void work;
  }
}

/** afterChange: skip draft-only writes; use stashed live-row status. */
export async function maybeSchedulePublishDeploy(args: {
  doc: unknown;
  req: unknown;
}): Promise<void> {
  // Content-sync never deploys, unconditionally (module header contract).
  const ctx = (args.req as { context?: Record<string, unknown> } | null)
    ?.context;
  if (ctx?.[CONTENT_SYNC_CONTEXT] === true) return;

  // `?draft=true` alone does not mean the live row was untouched: the admin
  // list view's bulk Publish (PublishMany) PATCHes with `?draft=true` AND
  // `_status: "published"`, and that write goes live. Trust the query flag
  // only when the resulting doc is not published; otherwise 28 bulk-published
  // docs fire zero rebuilds while a single-doc Publish (no draft param)
  // rebuilds fine.
  if (isDraftWrite(args.req) && statusOf(args.doc) !== "published") return;

  const user = (args.req as { user?: unknown } | null)?.user;
  const nextStatus = statusOf(args.doc);
  const previousStatus = readPriorLiveStatus(args.req) ?? "unknown";

  if (!shouldTriggerDeploy({ previousStatus, nextStatus, user })) return;
  schedulePublishDeploy(payloadLogger(args.req));
}

/** beforeDelete: rebuild when removing a live list item. */
export async function maybeSchedulePublishDeployOnDelete(args: {
  req: unknown;
  collection: string;
  id: unknown;
}): Promise<void> {
  const user = (args.req as { user?: unknown } | null)?.user;
  if (!isHead(user)) return;

  const live = await liveStatus({
    req: args.req,
    collection: args.collection,
    id: args.id,
  });
  if (live !== "published" && live !== "unknown") return;
  schedulePublishDeploy(payloadLogger(args.req));
}

export const capturePriorLiveStatusCollection: CollectionBeforeChangeHook =
  async ({ req, collection, originalDoc, data }) => {
    const id =
      (originalDoc as { id?: unknown } | undefined)?.id ??
      (data as { id?: unknown } | undefined)?.id;
    await stashPriorLiveStatus({ req, collection: collection.slug, id });
    return data;
  };

export const capturePriorLiveStatusGlobal: GlobalBeforeChangeHook = async ({
  req,
  global,
  data,
}) => {
  await stashPriorLiveStatus({ req, global: global.slug });
  return data;
};

export const capturePriorLiveStatusGlobalRestore: GlobalBeforeOperationHook =
  async ({ req, operation, global }) => {
    if (operation !== "restoreVersion") return;
    await stashPriorLiveStatus({
      req,
      global: (global as { slug: string }).slug,
    });
  };

export const triggerDeployAfterCollectionChange: CollectionAfterChangeHook =
  async ({ doc, req }) => {
    await maybeSchedulePublishDeploy({ doc, req });
    return doc;
  };

export const triggerDeployAfterGlobalChange: GlobalAfterChangeHook = async ({
  doc,
  req,
}) => {
  await maybeSchedulePublishDeploy({ doc, req });
  return doc;
};

export const triggerDeployBeforeCollectionDelete: CollectionBeforeDeleteHook =
  async ({ req, id, collection }) => {
    await maybeSchedulePublishDeployOnDelete({
      req,
      collection: collection.slug,
      id,
    });
  };
