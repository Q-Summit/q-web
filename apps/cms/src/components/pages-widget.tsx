import type { Payload, TypedUser } from "payload";

import { Link, Pill } from "@payloadcms/ui";
import React from "react";

import { GLOBAL_LABELS } from "../lib/content-entities";
import { formatWhen, whoLabel } from "../lib/format-when";
import { LIVE_PREVIEW_GLOBALS, PATH_BY_GLOBAL } from "../lib/live-preview-url";

/*
 * First block on the dashboard: every public page, its address, and whether it
 * has unpublished changes.
 *
 * Pages are what editors come here for, so they lead. Reads are scoped to the
 * signed-in user (overrideAccess: false), so a division only sees the pages it
 * owns, and the table is simply shorter for them.
 */

type PageRow = {
  slug: string;
  label: string;
  path: string;
  status: string;
  editedBy: string | null;
  editedAt: string | null;
};

/** Strip the " · /path" suffix GLOBAL_LABELS carries; the path has its own column. */
function pageName(slug: string): string {
  const label = GLOBAL_LABELS[slug] ?? slug;
  const [name] = label.split("·");
  return name.trim() || slug;
}

export async function PagesWidget(props: {
  payload: Payload;
  user?: TypedUser;
}) {
  const { payload, user } = props;
  if (!user) return null;

  const rows = (
    await Promise.all(
      LIVE_PREVIEW_GLOBALS.map(async (slug): Promise<PageRow | null> => {
        try {
          const doc = (await payload.findGlobal({
            slug: slug as "page-home",
            depth: 0,
            draft: true,
            overrideAccess: false,
            user,
          })) as unknown as Record<string, unknown>;
          if (!doc) return null;
          return {
            slug,
            label: pageName(slug),
            path: PATH_BY_GLOBAL[slug] ?? "",
            status: typeof doc._status === "string" ? doc._status : "draft",
            editedBy:
              typeof doc.lastEditedBy === "string" ? doc.lastEditedBy : null,
            editedAt:
              typeof doc.lastEditedAt === "string" ? doc.lastEditedAt : null,
          };
        } catch {
          // A page this user cannot read is simply not their page; the
          // per-entity failure must not take the whole dashboard down.
          return null;
        }
      }),
    )
  ).filter((row): row is PageRow => row !== null);

  if (rows.length === 0) return null;

  return (
    <div className="qs-card">
      <h2 className="qs-card__title">Website pages</h2>
      <p className="qs-card__sub">
        The pages you can edit. Open one to change its copy and see it on the
        real layout.
      </p>
      <div className="table">
        <table cellPadding={0} cellSpacing={0}>
          <thead>
            <tr>
              <th scope="col" className="qs-col--nowrap">
                Page
              </th>
              <th scope="col" className="qs-col--nowrap">
                Address
              </th>
              <th scope="col" className="qs-col--nowrap qs-col--tight">
                State
              </th>
              <th scope="col" className="qs-col--nowrap">
                Last edited
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.slug}>
                <td className="qs-col--nowrap">
                  <Link
                    href={`/globals/${row.slug}`}
                    className="qs-link--strong"
                  >
                    {row.label}
                  </Link>
                </td>
                <td className="qs-col--nowrap">
                  <span className="qs-muted">{row.path}</span>
                </td>
                <td className="qs-col--nowrap qs-col--tight">
                  {row.status === "published" ? (
                    <span className="qs-muted">Published</span>
                  ) : (
                    <Pill pillStyle="warning">Draft</Pill>
                  )}
                </td>
                <td className="qs-col--nowrap">
                  {row.editedAt ? (
                    <span className="qs-meta">
                      {formatWhen(row.editedAt)}
                      {row.editedBy ? ` · ${whoLabel(row.editedBy)}` : ""}
                    </span>
                  ) : (
                    <span className="qs-muted">not yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
