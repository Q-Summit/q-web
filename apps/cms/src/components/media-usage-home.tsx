import type { AdminViewServerProps } from "payload";

import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, Link, SetStepNav } from "@payloadcms/ui";
import { redirect } from "next/navigation";

import { loadMediaUsage } from "../lib/media-usage";

/*
 * Library-wide answer to "where is this image used, and can I delete it?".
 * The per-file version of this lives on each media document as the "Used on"
 * panel; this is the overview an editor uses before a clear-out.
 *
 * Open to every logged-in editor, unlike /reviews and /audit: editors are the
 * ones uploading duplicates, so they are the ones who need to find them.
 */

export async function MediaUsageHome({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const user = initPageResult.req.user;
  if (!user) redirect("/login");

  const rows = await loadMediaUsage(
    initPageResult.req.payload,
    initPageResult.req,
  );
  const unreferenced = rows.filter((row) => row.refs.length === 0);

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <SetStepNav nav={[{ label: "Media usage" }]} />
      <Gutter className="qs-page qs-page--wide">
        <h1 className="qs-page__title">Media usage</h1>
        <p className="qs-page__lede">
          Every file in the library and the entries pointing at it.{" "}
          {unreferenced.length} of {rows.length}{" "}
          {unreferenced.length === 1 ? "file is" : "files are"} not used by any
          live or draft entry.
        </p>

        <div className="qs-card">
          <h2 className="qs-card__title">All files</h2>
          <p className="qs-card__sub">
            This checks published entries and pending drafts. Older saved
            versions of a document can still point at a file, so a file listed
            here as unused may still be needed to restore one.
          </p>
          {rows.length === 0 ? (
            <p className="qs-empty">
              The media library is empty. Upload a file under Media library.
            </p>
          ) : (
            <div className="table">
              <table cellPadding={0} cellSpacing={0}>
                <thead>
                  <tr>
                    <th scope="col" className="qs-col--nowrap">
                      File
                    </th>
                    <th scope="col">Used by</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="qs-col--nowrap">
                        <Link
                          href={`/collections/media/${row.id}`}
                          className="qs-link--strong"
                        >
                          {row.filename || row.alt || String(row.id)}
                        </Link>
                      </td>
                      <td>
                        {row.refs.length === 0 ? (
                          <span className="qs-muted">
                            No live or draft entry
                          </span>
                        ) : (
                          row.refs.map((ref, index) => (
                            <span key={`${ref.href}-${ref.title}`}>
                              {index > 0 ? ", " : ""}
                              <Link href={ref.href}>{ref.title}</Link>
                              <span className="qs-meta"> ({ref.label})</span>
                            </span>
                          ))
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Gutter>
    </DefaultTemplate>
  );
}
