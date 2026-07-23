import type { AdminViewServerProps } from "payload";

import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, Link, SetStepNav } from "@payloadcms/ui";
import { redirect } from "next/navigation";

import { isHead } from "../access";
import { formatWhen, whoLabel } from "../lib/format-when";
import { loadReviewQueue } from "../lib/review-queue";

/*
 * Heads/Admins: one place to find proposed drafts waiting to publish.
 * Editors are redirected to the guide: they propose, they don't review.
 * Legal drafts are Admin-only and omitted here on purpose.
 */

export async function ReviewsHome({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const user = initPageResult.req.user;
  if (!user) redirect("/login");
  if (!isHead(user)) redirect("/docs");

  const queue = await loadReviewQueue(initPageResult.req.payload, user);

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
      {/* Replaces the hand-rolled back link: the template mounts the step nav
          provider, so the breadcrumb sits where every other view puts it. */}
      <SetStepNav nav={[{ label: "Review queue" }]} />
      <Gutter className="qs-page qs-page--wide">
        <h1 className="qs-page__title">Review queue</h1>
        <p className="qs-page__lede">
          Proposed drafts waiting for a <strong>Head</strong> or{" "}
          <strong>Admin</strong> to publish. Start with{" "}
          <strong>What changed</strong> to see the draft side by side with the
          live version, then <strong>Publish to live site</strong> when it is
          right. Not ready? Message the proposer with what to fix; the draft
          stays here and updates in place when they save again.
        </p>

        <div className="qs-card">
          <h2 className="qs-card__title">
            Drafts ready to review ({queue.length})
          </h2>
          {queue.length === 0 ? (
            <p className="qs-empty">No draft proposals right now.</p>
          ) : (
            /* Payload's .table wrapper supplies the scroll container, so the
               actions column stays reachable under body { overflow-x: hidden }. */
            <div className="table">
              <table cellPadding={0} cellSpacing={0}>
                <thead>
                  <tr>
                    {/* Column classes must match between th and td: a column
                        is as wide as its widest cell, so a th left on Payload's
                        150px floor holds the whole column open. Actions carries
                        two links and keeps the floor; the short columns opt out
                        so the table fits without scrolling. */}
                    <th scope="col">What</th>
                    <th scope="col" className="qs-col--tight">
                      Where
                    </th>
                    <th scope="col">Proposed by</th>
                    <th scope="col" className="qs-col--nowrap qs-col--tight">
                      Updated
                    </th>
                    <th scope="col" className="qs-col--nowrap">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.href}>
                      <td>
                        <strong>{item.title}</strong>
                      </td>
                      <td className="qs-col--tight">{item.label}</td>
                      <td className="qs-col--wrap">
                        {item.lastEditedBy ? whoLabel(item.lastEditedBy) : "-"}
                      </td>
                      <td className="qs-col--nowrap qs-col--tight">
                        {formatWhen(item.updatedAt)}
                      </td>
                      <td className="qs-col--nowrap">
                        <div className="qs-inline">
                          {item.compareHref ? (
                            <Link
                              href={item.compareHref}
                              className="qs-link--strong"
                            >
                              What changed →
                            </Link>
                          ) : null}
                          <Link href={item.href}>Open →</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="qs-muted">
          Full how-to: <Link href="/docs">Editor guide</Link>.
        </p>
      </Gutter>
    </DefaultTemplate>
  );
}
