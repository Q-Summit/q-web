"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@payloadcms/ui";

type GuideUser = {
  roles?: string[] | null;
  divisions?: string[] | null;
};

function roleKind(
  user: GuideUser | null | undefined,
): "admin" | "head" | "editor" | "guest" {
  const roles = user?.roles ?? [];
  if (roles.includes("admin")) return "admin";
  if (roles.includes("approver")) return "head";
  if (roles.includes("editor")) return "editor";
  return "guest";
}

/**
 * Dashboard primer: role greeting + three steps + link to the full guide.
 * Keep short; the /docs view is the reference.
 */
export const EditorGuide: React.FC = () => {
  const { user } = useAuth();
  const kind = roleKind(user as GuideUser | null);
  const divisions =
    ((user as GuideUser | null)?.divisions ?? []).join(", ") || "none";

  return (
    <div className="qs-card qs-card--flush">
      <div>
        <h2>Start here</h2>
        <p className="qs-muted">
          {kind === "admin" && (
            <>
              You are an <strong>Admin</strong>. You can propose drafts or
              publish anywhere. Prefer <strong>Propose for review</strong> when
              someone else should check first.
            </>
          )}
          {kind === "head" && (
            <>
              You are a <strong>Head</strong>. Editors send you drafts: open
              them, use Live Preview, then <strong>Publish to live site</strong>{" "}
              when ready. You can also propose your own drafts for another Head
              to review.
            </>
          )}
          {kind === "editor" && (
            <>
              You are an <strong>Editor</strong>
              {divisions !== "none" ? (
                <>
                  {" "}
                  for <strong>{divisions}</strong>
                </>
              ) : null}
              . Edit freely, then click <strong>Propose for review</strong>. You
              cannot publish: a Head or Admin does that after review. Drafts
              never change the live website.
            </>
          )}
          {kind === "guest" && (
            <>Your account has no editing role yet. Ask your division Head.</>
          )}
        </p>
      </div>

      <div className="qs-steps">
        <section>
          <h3 className="qs-card__sub">1. Pick the right place</h3>
          <p className="qs-muted">
            <strong>Website pages</strong> = text for a URL (Home · /).{" "}
            <strong>Lists & people</strong> = speakers, partners, jobs…{" "}
            <strong>Site-wide</strong> = nav & footer.
          </p>
        </section>
        <section>
          <h3 className="qs-card__sub">2. Edit (and preview)</h3>
          <p className="qs-muted">
            On Website pages, open the <em>eye</em> icon for Live Preview.
            Change list items under Lists & people; page entries only hold
            headings and intros.
          </p>
        </section>
        <section>
          <h3 className="qs-card__sub">3. Propose, then publish</h3>
          <p className="qs-muted">
            Always <strong>Propose for review</strong> first, then ping a Head;
            they review and click <strong>Publish to live site</strong>.
          </p>
        </section>
      </div>

      <div className="qs-inline">
        {(kind === "head" || kind === "admin") && (
          <Link href="/reviews" className="qs-link--strong">
            Open the Review queue →
          </Link>
        )}
        <Link href="/docs" className="qs-link--strong">
          Open the full Editor guide →
        </Link>
        <span className="qs-meta">
          Also always under <strong>Shortcuts</strong> in the left sidebar.
        </span>
      </div>
    </div>
  );
};
