"use client";

import React from "react";
import Link from "next/link";
import { useAuth, useDocumentInfo } from "@payloadcms/ui";

type BannerUser = {
  roles?: string[] | null;
};

/**
 * Inline hint in the document-controls row (before Preview / Publish).
 * One clause plus one link: the row's job is the primary action, and the
 * Review queue, Publish audit and Editor guide already live in the sidebar.
 */
export const WorkflowBanner: React.FC = () => {
  const { user } = useAuth();
  const { collectionSlug, docPermissions, globalSlug, id } = useDocumentInfo();
  const roles = (user as BannerUser | null)?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const isHead = roles.includes("approver") || isAdmin;
  const isEditorOnly = roles.includes("editor") && !isHead;
  // On existing documents Payload resolves per-doc permissions; false means
  // every field renders disabled (e.g. another division's content), so the
  // propose/publish instructions would point at buttons that do not exist.
  const readOnly = Boolean(docPermissions) && !docPermissions?.update;

  // Version history of this document; compare lives there.
  const versionsHref =
    collectionSlug && id != null
      ? `/collections/${collectionSlug}/${id}/versions`
      : globalSlug
        ? `/globals/${globalSlug}/versions`
        : null;

  // Legal is Admin-only for update, not division scoped, so pointing a Head at
  // "another team" would send them to their peers instead of IT.
  const tip = readOnly
    ? globalSlug === "legal"
      ? "Legal text is Admin only. Ask IT."
      : "View only. This belongs to another division."
    : isEditorOnly
      ? "Drafts are safe. A Head publishes."
      : "You can publish this.";

  return (
    <p className="qs-hint">
      {/* A <span> rather than a <p>: nested paragraphs are invalid HTML, and a
          flex child is turned into a block box, so the ellipsis still applies. */}
      <span className="qs-hint__text">{tip}</span>
      {versionsHref && !readOnly ? (
        <Link
          href={versionsHref}
          title="Version history: compare this draft against the live version."
        >
          Version history
        </Link>
      ) : null}
    </p>
  );
};
