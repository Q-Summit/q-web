import type { AdminViewServerProps, Payload } from "payload";

import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, Link, Pill, SetStepNav } from "@payloadcms/ui";
import { redirect } from "next/navigation";

import { isHead } from "../access";
import { DRAFT_COLLECTIONS, GLOBAL_LABELS } from "../lib/content-entities";
import { formatWhen, whoLabel } from "../lib/format-when";
import { LIVE_PREVIEW_GLOBALS } from "../lib/live-preview-url";

/*
 * Site-wide who published what, when for Heads/Admins.
 * Per-document history lives on each edit sidebar and Versions tab.
 */

type AuditEntry = {
  when: string;
  who: string;
  title: string;
  kind: string;
  href: string;
};

async function loadAudit(
  payload: Payload,
  user: unknown,
): Promise<AuditEntry[]> {
  const entries: AuditEntry[] = [];

  // Parallel + published-only keeps /audit from hanging the admin.
  const publishedWhere = {
    "version._status": { equals: "published" as const },
  };

  const collectionJobs = DRAFT_COLLECTIONS.map(async (col) => {
    try {
      const result = await payload.findVersions({
        collection: col.slug as "partners",
        depth: 0,
        limit: 5,
        sort: "-updatedAt",
        where: publishedWhere,
        overrideAccess: false,
        user: user as never,
      });
      for (const row of result.docs) {
        const ver = ((row as unknown as { version?: Record<string, unknown> })
          .version ?? {}) as Record<string, unknown>;
        const who = whoLabel(
          String(ver.lastPublishedBy || ver.lastEditedBy || "unknown"),
        );
        const when = String(
          ver.lastPublishedAt ||
            (row as { updatedAt?: string }).updatedAt ||
            "",
        );
        const parentId = (row as { parent?: number | string }).parent;
        const title = String(ver[col.titleField] ?? parentId ?? row.id);
        entries.push({
          when,
          who,
          title,
          kind: col.label,
          href:
            parentId != null
              ? `/collections/${col.slug}/${parentId}`
              : `/collections/${col.slug}`,
        });
      }
    } catch (err) {
      payload.logger.error(
        `publish audit: failed to load ${col.slug}: ${String(err)}`,
      );
    }
  });

  const globalJobs = [...LIVE_PREVIEW_GLOBALS, "site-settings", "legal"].map(
    async (slug) => {
      try {
        const result = await payload.findGlobalVersions({
          slug: slug as "site-settings",
          depth: 0,
          limit: 3,
          sort: "-updatedAt",
          where: publishedWhere,
          overrideAccess: false,
          user: user as never,
        });
        for (const row of result.docs) {
          const ver = ((row as unknown as { version?: Record<string, unknown> })
            .version ?? {}) as Record<string, unknown>;
          const who = whoLabel(
            String(ver.lastPublishedBy || ver.lastEditedBy || "unknown"),
          );
          const when = String(
            ver.lastPublishedAt ||
              (row as { updatedAt?: string }).updatedAt ||
              "",
          );
          entries.push({
            when,
            who,
            title: GLOBAL_LABELS[slug] ?? slug,
            kind: "Page / site-wide",
            href: `/globals/${slug}`,
          });
        }
      } catch (err) {
        payload.logger.error(
          `publish audit: failed to load global ${slug}: ${String(err)}`,
        );
      }
    },
  );

  await Promise.all([...collectionJobs, ...globalJobs]);
  entries.sort((a, b) => String(b.when).localeCompare(String(a.when)));
  return entries.slice(0, 40);
}

export async function AuditHome({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const user = initPageResult.req.user;
  if (!user) redirect("/login");
  if (!isHead(user)) redirect("/docs");

  const entries = await loadAudit(initPageResult.req.payload, user);
  const published = entries;

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
      <SetStepNav nav={[{ label: "Publish audit" }]} />
      <Gutter className="qs-page qs-page--wide">
        <h1 className="qs-page__title">Publish audit</h1>
        <p className="qs-page__lede">
          Recent publishes across pages and lists. Open a row for that
          document’s sidebar history and Versions tab.
        </p>

        <div className="qs-card">
          <h2 className="qs-card__title">Last {published.length} publishes</h2>
          {published.length === 0 ? (
            <p className="qs-empty">
              Nothing has been published yet. The next time a Head clicks{" "}
              <strong>Publish to live site</strong>, it appears here.
            </p>
          ) : (
            <div className="table">
              <table cellPadding={0} cellSpacing={0}>
                <thead>
                  <tr>
                    {/* Column classes must match between th and td: a column is
                        as wide as its widest cell, so a th left on Payload's
                        150px floor holds the whole column open. */}
                    <th scope="col" className="qs-col--nowrap qs-col--tight">
                      When
                    </th>
                    {/* nowrap so the column claims its natural width: with auto
                        table layout the wide What column otherwise absorbs the
                        slack and every address breaks across two lines. */}
                    <th scope="col" className="qs-col--nowrap">
                      Who
                    </th>
                    <th scope="col">What</th>
                    <th scope="col" className="qs-col--nowrap qs-col--tight">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {published.map((item, i) => (
                    <tr key={`${item.href}-${item.when}-${i}`}>
                      <td className="qs-col--nowrap qs-col--tight">
                        {formatWhen(item.when)}
                      </td>
                      <td className="qs-col--nowrap">{item.who}</td>
                      <td>
                        {/* JSX drops the newline between siblings, so the
                            title and the chip need an explicit gap. */}
                        <span className="qs-inline">
                          <strong>{item.title}</strong>
                          <Pill size="small" pillStyle="light-gray">
                            {item.kind}
                          </Pill>
                        </span>
                      </td>
                      <td className="qs-col--nowrap qs-col--tight">
                        <Link href={item.href} className="qs-link--strong">
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="qs-muted">
          Waiting on a draft? Use the <Link href="/reviews">Review queue</Link>.
        </p>
      </Gutter>
    </DefaultTemplate>
  );
}
