/**
 * CMS REST fetch helpers, caches, and stable ordering.
 */
import { CMS_URL } from "./source";

/* --- CMS fetch helpers --- */

interface CmsListResponse<T> {
  docs: T[];
  hasNextPage: boolean;
}

/**
 * Collections the live site cannot sensibly render empty. A published, healthy
 * CMS always has rows here, so zero means something went wrong upstream --
 * an accidental bulk unpublish, a half-finished migration, a wrong CMS_URL
 * pointing at a fresh database -- and the correct response is a red build, not
 * a deploy of a site with a blank partner wall and an empty speaker grid.
 *
 * Deliberately SHORT. The floor is for "the CMS is not the database you think
 * it is" (wrong CMS_URL, half-run migration, accidental bulk unpublish), not
 * for editorial judgement. It previously also covered speakers and faqs, which
 * are legitimately empty early in a new edition -- before any speaker is
 * announced -- so the floor would have turned a normal editorial state into a
 * total deploy outage. Partners and team are the two that are never empty for
 * a live Q-Summit site.
 *
 * Only enforced in CMS mode. JSON/fixture builds are free to be sparse, and a
 * genuinely empty list (no open jobs, no speakers yet) belongs to a collection
 * that is NOT on this list and renders its own zero state.
 */
const REQUIRED_NONEMPTY_COLLECTIONS = new Set(["partners", "team"]);

// One in-flight/committed fetch per collection per build, so pages that
// call the same getter more than once do not refetch.
const cmsCollectionCache = new Map<string, Promise<unknown[]>>();

export async function fetchPublishedDocs<T>(collection: string): Promise<T[]> {
  const cached = cmsCollectionCache.get(collection);
  if (cached) return cached as Promise<T[]>;

  const promise = (async () => {
    const docs: T[] = [];
    let page = 1;
    for (;;) {
      const url = new URL(`/api/${collection}`, CMS_URL);
      url.searchParams.set("limit", "200");
      url.searchParams.set("depth", "1");
      url.searchParams.set("page", String(page));
      // Belt-and-suspenders: readOwnDrafts access already hides drafts from
      // anonymous requests, but state the intent explicitly.
      url.searchParams.set("where[_status][equals]", "published");

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          `[content:cms] GET ${url.pathname}${url.search} failed: ${res.status} ${res.statusText}`,
        );
      }
      const body = (await res.json()) as CmsListResponse<T>;
      docs.push(...body.docs);
      if (!body.hasNextPage) break;
      page += 1;
    }
    if (docs.length === 0 && REQUIRED_NONEMPTY_COLLECTIONS.has(collection)) {
      throw new Error(
        `[content:cms] "${collection}" returned zero published documents from ${CMS_URL}. ` +
          "The live site cannot render that section empty, so this fails the build rather than " +
          "deploying a blank page. Check that the collection is published and that CMS_URL points " +
          "at the right database.",
      );
    }
    return docs;
  })();

  cmsCollectionCache.set(collection, promise);
  return promise;
}

// One in-flight/committed fetch per global per build (globals are
// singletons, so no pagination is needed, unlike fetchPublishedDocs above).
const cmsGlobalCache = new Map<string, Promise<unknown>>();

export async function fetchGlobal<T>(slug: string): Promise<T> {
  if (!import.meta.env.DEV) {
    const cached = cmsGlobalCache.get(slug);
    if (cached) return cached as Promise<T>;
  }

  const promise = (async () => {
    const url = new URL(`/api/globals/${slug}`, CMS_URL);
    url.searchParams.set("depth", "1");
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `[content:cms] GET ${url.pathname}${url.search} failed: ${res.status} ${res.statusText}`,
      );
    }
    return (await res.json()) as T;
  })();

  if (!import.meta.env.DEV) cmsGlobalCache.set(slug, promise);
  return promise;
}

/**
 * Same as fetchGlobal, but a 404 (unknown slug, CMS not yet migrated)
 * returns null instead of failing the build. Other HTTP errors still throw.
 */
export async function fetchGlobalOptional<T>(slug: string): Promise<T | null> {
  const cacheKey = `optional:${slug}`;
  if (!import.meta.env.DEV) {
    const cached = cmsGlobalCache.get(cacheKey);
    if (cached) return cached as Promise<T | null>;
  }

  const promise = (async () => {
    const url = new URL(`/api/globals/${slug}`, CMS_URL);
    url.searchParams.set("depth", "1");
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(
        `[content:cms] GET ${url.pathname}${url.search} failed: ${res.status} ${res.statusText}`,
      );
    }
    return (await res.json()) as T;
  })();

  if (!import.meta.env.DEV) cmsGlobalCache.set(cacheKey, promise);
  return promise;
}

// Memoizes the mapped (not just raw-fetched) result of a cmsGet* function,
// so a getter called from more than one page (e.g. getSpeakers from both
// index.astro and speaker.astro) resolves each media file and logs each
// warning exactly once per build.
const cmsDerivedCache = new Map<string, Promise<unknown>>();

export function memoizeCms<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (import.meta.env.DEV) return load();
  const cached = cmsDerivedCache.get(key);
  if (cached) return cached as Promise<T>;
  const promise = load();
  cmsDerivedCache.set(key, promise);
  promise.catch(() => {
    cmsDerivedCache.delete(key);
  });
  return promise;
}

/**
 * Deterministic ordering for CMS docs: the `order` field (seeded as source
 * JSON array index times 10, leaving gaps for editor inserts) first, then a
 * stable id/slug tiebreak so docs
 * sharing an order value never depend on DB row order. Without this, jobs,
 * speakers, and team docs came back in whatever order Postgres happened to
 * store them, which is what made index/job-listings/our-team differ from
 * JSON-mode byte-for-byte (see docs/architecture/08-concepts.md).
 */
export function stableOrderCompare(
  a: { order?: number | null; id?: number | string; slug?: string },
  b: { order?: number | null; id?: number | string; slug?: string },
): number {
  const orderA = a.order ?? 0;
  const orderB = b.order ?? 0;
  if (orderA !== orderB) return orderA - orderB;
  const keyA = String(a.slug ?? a.id ?? "");
  const keyB = String(b.slug ?? b.id ?? "");
  return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
}
