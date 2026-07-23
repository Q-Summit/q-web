"use client";

import { usePathname } from "next/navigation";
import React from "react";
// Payload's Link wraps next/link and drives the admin route-transition
// indicator, so shortcuts behave like every built-in nav item.
import { Link, useAuth } from "@payloadcms/ui";

type NavUser = { roles?: string[] | null };

/**
 * Top of the left nav -- same visual language as Payload’s built-in groups
 * (no card, no “You: Role”). Links only.
 */
export const DocsLink: React.FC = () => {
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  const roles = (user as NavUser | null)?.roles ?? [];
  const canReview = roles.includes("approver") || roles.includes("admin");

  const onDashboard = pathname === "/" || pathname === "";
  const onDocs = pathname === "/docs" || pathname.startsWith("/docs/");
  const onReviews = pathname === "/reviews" || pathname.startsWith("/reviews/");
  const onAudit = pathname === "/audit" || pathname.startsWith("/audit/");
  const onMediaUsage =
    pathname === "/media-usage" || pathname.startsWith("/media-usage/");

  // Payload's own nav classes, so these rows share its padding, hover and
  // focus underline, and touch sizing instead of approximating them.
  const linkClass = (active: boolean) =>
    active ? "nav__link active" : "nav__link";

  return (
    <nav aria-label="Shortcuts" className="qs-shortcuts">
      <p className="nav__label">Shortcuts</p>
      <Link
        href="/"
        className={linkClass(onDashboard)}
        aria-current={onDashboard ? "page" : undefined}
      >
        Dashboard
      </Link>
      {canReview && (
        <Link
          href="/reviews"
          className={linkClass(onReviews)}
          aria-current={onReviews ? "page" : undefined}
        >
          Review queue
        </Link>
      )}
      {canReview && (
        <Link
          href="/audit"
          className={linkClass(onAudit)}
          aria-current={onAudit ? "page" : undefined}
        >
          Publish audit
        </Link>
      )}
      {/* Deliberately not gated on canReview, unlike the two above: editors
          are the ones uploading images, so they are the ones who need to see
          where a file is used before replacing it. */}
      <Link
        href="/media-usage"
        className={linkClass(onMediaUsage)}
        aria-current={onMediaUsage ? "page" : undefined}
      >
        Media usage
      </Link>
      <Link
        href="/docs"
        className={linkClass(onDocs)}
        aria-current={onDocs ? "page" : undefined}
      >
        Editor guide
      </Link>
    </nav>
  );
};
