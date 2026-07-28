import type {
  CollectionSlug,
  DocumentViewServerProps,
  GlobalSlug,
  PaginatedDocs,
  Where,
} from "payload";

import { Gutter, Pill, SetDocumentStepNav } from "@payloadcms/ui";
import { formatAdminURL, hasDraftsEnabled, isNumber } from "payload/shared";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatWhen, whoLabel } from "../lib/format-when";

type VersionDoc = {
  id: string | number;
  updatedAt?: string;
  version?: {
    _status?: string;
    lastEditedBy?: string | null;
    lastPublishedBy?: string | null;
  };
};

type VersionsPage = PaginatedDocs<VersionDoc>;

async function loadVersions(args: {
  collectionSlug?: CollectionSlug;
  globalSlug?: GlobalSlug;
  parentID?: number | string;
  limit: number;
  page: number;
  sort: string;
  where?: Where;
  req: DocumentViewServerProps["initPageResult"]["req"];
  user: DocumentViewServerProps["initPageResult"]["req"]["user"];
}): Promise<VersionsPage | null> {
  const {
    collectionSlug,
    globalSlug,
    parentID,
    limit,
    page,
    sort,
    where,
    req,
    user,
  } = args;
  try {
    if (collectionSlug) {
      return (await req.payload.findVersions({
        collection: collectionSlug,
        depth: 0,
        limit,
        overrideAccess: false,
        page,
        req,
        sort,
        user,
        where:
          where ??
          (parentID != null ? { parent: { equals: parentID } } : undefined),
      })) as VersionsPage;
    }
    if (globalSlug) {
      return (await req.payload.findGlobalVersions({
        slug: globalSlug,
        depth: 0,
        limit,
        overrideAccess: false,
        page,
        req,
        sort,
        user,
        where,
      })) as VersionsPage;
    }
  } catch (err) {
    req.payload.logger.error(
      `versions-with-authors: failed to load versions: ${String(err)}`,
    );
  }
  return null;
}

/**
 * Replaces Payload's default Versions list so each row shows who edited and
 * who published. Audit stamps live on version.version.lastEditedBy /
 * lastPublishedBy (see lib/audit.ts). Older pre-stamp rows show "-".
 */
export async function VersionsWithAuthors(props: DocumentViewServerProps) {
  const {
    hasPublishedDoc,
    initPageResult: {
      collectionConfig,
      docID: id,
      globalConfig,
      req,
      req: {
        i18n,
        payload: { config },
        user,
      },
    },
    routeSegments: segments,
    searchParams: { limit, page, sort } = {},
  } = props;

  const entityConfig = collectionConfig || globalConfig;
  if (!entityConfig) {
    return notFound();
  }

  const draftsEnabled = hasDraftsEnabled(entityConfig);
  const collectionSlug = collectionConfig?.slug;
  const globalSlug = globalConfig?.slug;
  const isTrashed = segments[2] === "trash";

  const {
    routes: { admin: adminRoute },
  } = config;

  const defaultLimit = collectionSlug
    ? (collectionConfig?.admin?.pagination?.defaultLimit ?? 10)
    : 10;
  const limitToUse = isNumber(limit) ? Number(limit) : defaultLimit;
  const pageToUse = isNumber(page) && Number(page) > 0 ? Number(page) : 1;
  const sortBy = typeof sort === "string" ? sort : "-updatedAt";

  const versionsData = await loadVersions({
    collectionSlug,
    globalSlug,
    parentID: id,
    limit: limitToUse,
    page: pageToUse,
    sort: sortBy,
    req,
    user,
  });

  if (!versionsData) {
    return (
      <>
        <SetDocumentStepNav
          collectionSlug={collectionSlug}
          globalSlug={globalSlug}
          id={id}
          isTrashed={isTrashed}
          pluralLabel={globalConfig?.label}
          useAsTitle={collectionConfig?.admin?.useAsTitle || globalSlug}
          view={i18n.t("version:versions")}
        />
        <main className="versions">
          <Gutter className="versions__wrap qs-page">
            <p className="qs-danger">
              Could not load versions. Refresh or check that you can read this
              document’s history.
            </p>
          </Gutter>
        </main>
      </>
    );
  }

  let currentlyPublishedId: string | number | null = null;
  let latestDraftId: string | number | null = null;

  if (draftsEnabled) {
    const parentClause: Where[] =
      collectionSlug && id != null ? [{ parent: { equals: id } }] : [];
    const [publishedLatest, draftLatest] = await Promise.all([
      hasPublishedDoc
        ? loadVersions({
            collectionSlug,
            globalSlug,
            limit: 1,
            page: 1,
            sort: "-updatedAt",
            where: {
              and: [
                ...parentClause,
                { "version._status": { equals: "published" } },
              ],
            },
            req,
            user,
          })
        : Promise.resolve(null),
      loadVersions({
        collectionSlug,
        globalSlug,
        limit: 1,
        page: 1,
        sort: "-updatedAt",
        where: {
          and: [...parentClause, { "version._status": { equals: "draft" } }],
        },
        req,
        user,
      }),
    ]);
    currentlyPublishedId = publishedLatest?.docs?.[0]?.id ?? null;
    latestDraftId = draftLatest?.docs?.[0]?.id ?? null;
  }

  const pluralLabel =
    typeof collectionConfig?.labels?.plural === "function"
      ? collectionConfig.labels.plural({ i18n, t: i18n.t })
      : (collectionConfig?.labels?.plural ?? globalConfig?.label);

  const versionHref = (versionId: string | number) => {
    const trashed = isTrashed ? "trash/" : "";
    if (collectionSlug && id != null) {
      return formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}/${trashed}${id}/versions/${versionId}`,
      });
    }
    if (globalSlug) {
      return formatAdminURL({
        adminRoute,
        path: `/globals/${globalSlug}/versions/${versionId}`,
      });
    }
    return "#";
  };

  const listHref = (nextPage: number) => {
    const q = new URLSearchParams();
    q.set("page", String(nextPage));
    q.set("limit", String(limitToUse));
    if (sortBy !== "-updatedAt") q.set("sort", sortBy);
    if (collectionSlug && id != null) {
      return formatAdminURL({
        adminRoute,
        path: `/collections/${collectionSlug}/${isTrashed ? "trash/" : ""}${id}/versions?${q}`,
      });
    }
    if (globalSlug) {
      return formatAdminURL({
        adminRoute,
        path: `/globals/${globalSlug}/versions?${q}`,
      });
    }
    return "#";
  };

  const statusLabel = (doc: VersionDoc) => {
    const published = doc.version?._status === "published";
    if (published && doc.id === currentlyPublishedId)
      return "Currently Published";
    if (published) return "Previously Published";
    if (doc.id === latestDraftId) return "Draft";
    return published ? "Published" : "Draft";
  };

  const hasPrev = pageToUse > 1;
  const hasNext = Boolean(versionsData.hasNextPage);
  const from = versionsData.pagingCounter ?? (pageToUse - 1) * limitToUse + 1;
  const to = from + versionsData.docs.length - 1;

  return (
    <>
      <SetDocumentStepNav
        collectionSlug={collectionSlug}
        globalSlug={globalSlug}
        id={id}
        isTrashed={isTrashed}
        pluralLabel={pluralLabel}
        useAsTitle={collectionConfig?.admin?.useAsTitle || globalSlug}
        view={i18n.t("version:versions")}
      />
      <main className="versions">
        <Gutter className="versions__wrap qs-page">
          <p className="qs-page__lede">
            Each save records who edited. Publish records who pushed it live.
            Rows without a name are from before audit stamping started.
          </p>
          <div className="table">
            <table cellPadding={0} cellSpacing={0}>
              <thead>
                <tr>
                  <th className="qs-col--nowrap qs-col--tight" scope="col">
                    Updated At
                  </th>
                  <th className="qs-col--tight" scope="col">
                    Status
                  </th>
                  <th scope="col">Edited by</th>
                  <th scope="col">Published by</th>
                  <th className="qs-col--tight" scope="col">
                    Version ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {versionsData.docs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="qs-empty">
                      No versions yet.
                    </td>
                  </tr>
                )}
                {versionsData.docs.map((doc) => {
                  const published = doc.version?._status === "published";
                  const isCurrent = doc.id === currentlyPublishedId;
                  return (
                    <tr key={String(doc.id)} className="row">
                      <td className="qs-col--nowrap qs-col--tight">
                        <Link href={versionHref(doc.id)} prefetch={false}>
                          {formatWhen(doc.updatedAt)}
                        </Link>
                      </td>
                      <td className="qs-col--tight">
                        {/* Same mapping Payload's own Versions cell uses:
                            currently published reads success, everything else light. */}
                        <Pill
                          size="small"
                          pillStyle={isCurrent ? "success" : "light"}
                        >
                          {statusLabel(doc)}
                        </Pill>
                      </td>
                      <td className="qs-col--wrap">
                        {whoLabel(doc.version?.lastEditedBy)}
                      </td>
                      <td className="qs-col--wrap">
                        {published
                          ? whoLabel(doc.version?.lastPublishedBy)
                          : "-"}
                      </td>
                      <td className="qs-col--tight">{doc.id}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Payload's own pager frame. Order matters: .versions__page-info
              carries the margin-left:auto that pushes the count to the end. */}
          <div className="versions__page-controls">
            <nav className="qs-inline" aria-label="Versions pagination">
              {hasPrev ? (
                <Link href={listHref(pageToUse - 1)} prefetch={false}>
                  Previous
                </Link>
              ) : (
                <span aria-disabled="true" className="qs-disabled">
                  Previous
                </span>
              )}
              {hasNext ? (
                <Link href={listHref(pageToUse + 1)} prefetch={false}>
                  Next
                </Link>
              ) : (
                <span aria-disabled="true" className="qs-disabled">
                  Next
                </span>
              )}
            </nav>
            <div className="versions__page-info">
              {versionsData.docs.length === 0
                ? "0 of 0"
                : `${from}-${to} of ${versionsData.totalDocs}`}
            </div>
          </div>
        </Gutter>
      </main>
    </>
  );
}
