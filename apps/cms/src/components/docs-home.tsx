import type { AdminViewServerProps } from "payload";

import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, Link, SetStepNav } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import React from "react";

/*
 * Always-reachable docs home at /docs (sidebar: Nav → Editor guide).
 * Task-first language for non-developers. Keep aligned with docs/editors/README.md.
 */

function Row({ task, how }: { task: string; how: React.ReactNode }) {
  return (
    <>
      <dt>{task}</dt>
      <dd>{how}</dd>
    </>
  );
}

export function DocsHome({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  if (!initPageResult.req.user) redirect("/login");

  const roles =
    (initPageResult.req.user as { roles?: string[] | null }).roles ?? [];
  const isAdmin = roles.includes("admin");
  const isHead = roles.includes("approver") || isAdmin;
  const roleLabel = isAdmin ? "Admin" : isHead ? "Head" : "Editor";

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      {/* Inside the template on purpose: SetStepNav needs the StepNavProvider
          DefaultTemplate mounts, and the breadcrumb it restores carries the
          only link back to the dashboard this page needs. */}
      <SetStepNav nav={[{ label: "Editor guide" }]} />
      <Gutter className="qs-page">
        <h1 className="qs-page__title">Editor guide</h1>
        <p className="qs-page__lede">
          You are signed in as{" "}
          {roleLabel === "Admin" || roleLabel === "Editor" ? "an" : "a"}{" "}
          <strong>{roleLabel}</strong>. This page is the how-to for changing the
          website. Come back anytime via the <strong>Shortcuts</strong> at the
          top of the left sidebar.
        </p>

        <div className="qs-card">
          <h2 className="qs-card__title">The one rule</h2>
          <p>
            <strong>Editors propose. Heads and Admins publish.</strong> Nothing
            reaches the live site until someone with publish rights clicks{" "}
            <strong>Publish to live site</strong>. So edit boldly: a draft
            cannot break the live site.
          </p>
          <dl className="qs-defs">
            <dt>Editor</dt>
            <dd>
              Change content in your division →{" "}
              <strong>Propose for review</strong>. You never publish.
            </dd>
            <dt>Head</dt>
            <dd>
              Review drafts → <strong>Publish to live site</strong> when
              approved. You may also propose if you want a second pair of eyes.
            </dd>
            <dt>Admin (IT)</dt>
            <dd>
              Same publish rights as Heads, plus Users and Legal. Prefer
              proposing when someone else should check.
            </dd>
          </dl>
        </div>

        <div className="qs-card">
          <h2 className="qs-card__title">The flow, once</h2>
          <ol>
            <li>
              <strong>Find it:</strong> Website pages hold the text of one
              public page; Lists & people for people/companies; Site-wide for
              nav/footer.
            </li>
            <li>
              <strong>Edit:</strong> On Website pages, open{" "}
              <strong>Live Preview</strong> (eye icon) to see the real layout
              while you type.
            </li>
            <li>
              <strong>Propose for review:</strong> Saves a draft. Live site
              unchanged.
            </li>
            <li>
              <strong>Head publishes:</strong> Ping your division’s Head (the
              person who leads Partner / PR / Concept / Chair / etc.) with what
              changed; they review and click{" "}
              <strong>Publish to live site</strong>. Any Head or Admin can cover
              if yours is away.
            </li>
          </ol>
        </div>

        <div className="qs-card">
          <h2 className="qs-card__title">I want to…</h2>
          <dl className="qs-defs">
            <Row
              task="Change text on a page"
              how={
                <>
                  <strong>Website pages</strong> → the entry named after the URL
                  (e.g. <em>Home · /</em>). Open Live Preview and edit
                  headlines, intros, CTAs.
                </>
              }
            />
            <Row
              task="Add or edit a person or company"
              how={
                <>
                  <strong>Lists & people</strong>: Speakers, Team, Partners,
                  Jobs, FAQs, Testimonials. Page entries only hold headings; the
                  list holds the actual cards.
                </>
              }
            />
            <Row
              task="Hand over to the next board"
              how={
                <>
                  In <strong>Past Teams</strong>, add one year + group photo for
                  the retiring board. In <strong>Team</strong>, add new members
                  and remove retired ones. Propose both; a Head publishes.
                </>
              }
            />
            <Row
              task="Change nav, footer, or social links"
              how={
                <>
                  <strong>Site-wide → Navigation, footer & AI identity</strong>.
                  This affects every page, so propose carefully.
                </>
              }
            />
            <Row
              task="Upload a photo or logo"
              how={
                <>
                  From the image field you are editing, or via{" "}
                  <strong>Media library</strong>. Prefer sharp originals up to 5
                  MB (not tiny thumbnails). Replacing or deleting an existing
                  file needs an Admin.
                </>
              }
            />
            <Row
              task="Remove something from the live site"
              how={
                <>
                  Deleting from a list only removes never-published drafts. For
                  anything already live, ask your Head (or an Admin) to delete
                  it; the site rebuilds without it.
                </>
              }
            />
            <Row
              task="Fix search / WhatsApp preview text"
              how={
                <>
                  On each Website page: <strong>Title</strong> and{" "}
                  <strong>Meta Description</strong>. Keep them factual and
                  short.
                </>
              }
            />
            <Row
              task="Tell AI tools who Q-Summit is"
              how={
                <>
                  <strong>Site-wide → Navigation, footer & AI identity</strong>,
                  section <strong>AI assistants (/llms.txt)</strong> (summary,
                  pitch, key facts).
                </>
              }
            />
            {isAdmin && (
              <Row
                task="Edit Legal / Users"
                how={
                  <>
                    <strong>System</strong> in the sidebar. Legal is verbatim
                    HTML from counsel: paste exactly what they signed off, never
                    reworded.
                  </>
                }
              />
            )}
          </dl>
        </div>

        <div className="qs-card">
          <h2 className="qs-card__title">
            “Why is my change not on the live site?”
          </h2>
          <ol>
            <li>
              <strong>Draft:</strong> you proposed it. Only people in this admin
              see it. Ping your Head.
            </li>
            <li>
              <strong>Changed:</strong> the item is already live and your newer
              draft is waiting for review. The live site keeps the previous
              version until a Head publishes.
            </li>
            <li>
              <strong>Published:</strong> a Head/Admin approved it. The live
              site is regenerated after a publish, which takes a few minutes.
              Today a maintainer starts that, so allow some lead time.
            </li>
            <li>
              <strong>Live:</strong> refresh the public page. Still wrong after
              ~10 minutes? Tell your Head. A failed build never replaces the
              working site.
            </li>
          </ol>
        </div>

        {isHead && (
          <div className="qs-card">
            <h2 className="qs-card__title">Audit trail</h2>
            <p>
              Every page and list item keeps{" "}
              <strong>last edited / last published</strong> in the sidebar, plus
              a <strong>History</strong> list of each version (who drafted or
              published). Site-wide:{" "}
              <Link className="qs-link--strong" href="/audit">
                Publish audit
              </Link>
              . The clock icon still restores old content.
            </p>
          </div>
        )}

        {isHead && (
          <div className="qs-card">
            <h2 className="qs-card__title">For Heads: reviewing</h2>
            <p>
              The <Link href="/reviews">Review queue</Link> lists every waiting
              proposal; start with its <strong>What changed</strong> link, which
              opens the draft side by side with the live version. Happy? Click{" "}
              <strong>Publish to live site</strong>. Not ready? Tell the
              proposer what to fix; their next save updates the same draft. In
              list views the same drafts show as status <strong>Draft</strong>{" "}
              or <strong>Changed</strong>.
            </p>
          </div>
        )}

        <div className="qs-card">
          <h2 className="qs-card__title">Stuck?</h2>
          <p>
            Missing access, sign-in trouble, or a broken live page: tell your
            division’s Head, who routes it to the maintainers. Access follows
            your Google Workspace group.
          </p>
        </div>
      </Gutter>
    </DefaultTemplate>
  );
}
