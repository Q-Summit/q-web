import type { Payload } from "payload";

import { DRAFT_COLLECTIONS, GLOBAL_LABELS } from "./content-entities";
import { LIVE_PREVIEW_GLOBALS } from "./live-preview-url";

/*
 * Shared draft-queue loader for the Review queue view (/reviews) and the
 * dashboard "drafts waiting" banner, so a count shown on the dashboard can
 * never disagree with the queue behind it. Legal drafts are Admin-only and
 * omitted on purpose. All lookups run overrideAccess: false as the viewer.
 */

export type QueueItem = {
  kind: "collection" | "global";
  label: string;
  href: string;
  /**
   * Deep link to the version-compare view of the latest draft, the screen
   * that answers "what exactly am I approving?". Null when the version
   * lookup fails (the plain edit href still works).
   */
  compareHref: string | null;
  updatedAt?: string | null;
  lastEditedBy?: string | null;
  title: string;
};

export async function loadReviewQueue(
  payload: Payload,
  user: unknown,
): Promise<QueueItem[]> {
  const items: QueueItem[] = [];

  const collectionJobs = DRAFT_COLLECTIONS.map(async (col) => {
    try {
      const result = await payload.find({
        collection: col.slug as "partners",
        draft: true,
        depth: 0,
        limit: 30,
        sort: "-updatedAt",
        overrideAccess: false,
        user: user as never,
        where: { _status: { equals: "draft" } },
      });
      await Promise.all(
        result.docs.map(async (doc) => {
          const rec = doc as unknown as Record<string, unknown>;
          const title = String(rec[col.titleField] ?? doc.id);
          let compareHref: string | null = null;
          try {
            const versions = await payload.findVersions({
              collection: col.slug as "partners",
              depth: 0,
              limit: 1,
              overrideAccess: false,
              sort: "-updatedAt",
              user: user as never,
              where: { parent: { equals: doc.id } },
            });
            const versionID = versions.docs[0]?.id;
            if (versionID != null) {
              compareHref = `/collections/${col.slug}/${doc.id}/versions/${versionID}`;
            }
          } catch {
            // Version lookup is best-effort; the edit link still works.
          }
          items.push({
            kind: "collection",
            label: col.label,
            title,
            href: `/collections/${col.slug}/${doc.id}`,
            compareHref,
            updatedAt: typeof rec.updatedAt === "string" ? rec.updatedAt : null,
            lastEditedBy:
              typeof rec.lastEditedBy === "string" ? rec.lastEditedBy : null,
          });
        }),
      );
    } catch (err) {
      payload.logger.error(
        `reviews queue: failed to load ${col.slug}: ${String(err)}`,
      );
    }
  });

  const globalSlugs = [...LIVE_PREVIEW_GLOBALS, "site-settings"];
  const globalJobs = globalSlugs.map(async (slug) => {
    try {
      const doc = await payload.findGlobal({
        slug: slug as "site-settings",
        draft: true,
        depth: 0,
        overrideAccess: false,
        user: user as never,
      });
      const status = (doc as { _status?: string })._status;
      if (status !== "draft") return;
      let compareHref: string | null = null;
      try {
        const versions = await payload.findGlobalVersions({
          slug: slug as "site-settings",
          depth: 0,
          limit: 1,
          overrideAccess: false,
          sort: "-updatedAt",
          user: user as never,
        });
        const versionID = versions.docs[0]?.id;
        if (versionID != null) {
          compareHref = `/globals/${slug}/versions/${versionID}`;
        }
      } catch {
        // Best-effort, see above.
      }
      items.push({
        kind: "global",
        label: "Website / site-wide",
        title: GLOBAL_LABELS[slug] ?? slug,
        href: `/globals/${slug}`,
        compareHref,
        updatedAt:
          typeof (doc as { updatedAt?: string }).updatedAt === "string"
            ? (doc as { updatedAt: string }).updatedAt
            : null,
        lastEditedBy:
          typeof (doc as { lastEditedBy?: string }).lastEditedBy === "string"
            ? (doc as { lastEditedBy: string }).lastEditedBy
            : null,
      });
    } catch (err) {
      payload.logger.error(
        `reviews queue: failed to load global ${slug}: ${String(err)}`,
      );
    }
  });

  await Promise.all([...collectionJobs, ...globalJobs]);

  items.sort((a, b) =>
    String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")),
  );
  return items;
}
