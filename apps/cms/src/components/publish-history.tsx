"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pill, useConfig, useDocumentInfo } from "@payloadcms/ui";

import { formatWhen, whoLabel } from "../lib/format-when";

type VersionRow = {
  id: string | number;
  updatedAt?: string;
  createdAt?: string;
  version?: {
    _status?: string;
    lastEditedBy?: string | null;
    lastEditedAt?: string | null;
    lastPublishedBy?: string | null;
    lastPublishedAt?: string | null;
  };
};

/**
 * Document sidebar history. Loads once per doc / versionCount change.
 * Do NOT depend on lastUpdateTime -- that updates constantly and caused
 * refetch loops (infinite “Loading…”).
 */
export const PublishHistoryField: React.FC = () => {
  const { id, collectionSlug, globalSlug, versionCount } = useDocumentInfo();
  const { config } = useConfig();
  const api = config.routes?.api ?? "/api";

  const [rows, setRows] = useState<VersionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishedOnly, setPublishedOnly] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (!collectionSlug && !globalSlug) return;
    if (collectionSlug && (id == null || id === "")) {
      setRows([]);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    // Only show spinner on the first load so refetches don't flash forever.
    if (!hasLoadedOnce.current) setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        // Ten fills the capped list without a scroll marathon; the Versions
        // tab is the paginated home for anything older.
        limit: "10",
        sort: "-updatedAt",
        depth: "0",
      });
      if (collectionSlug && id != null) {
        params.set("where[parent][equals]", String(id));
      }

      const path = collectionSlug
        ? `${api}/${collectionSlug}/versions?${params}`
        : `${api}/globals/${globalSlug}/versions?${params}`;

      const res = await fetch(path, {
        credentials: "include",
        signal: ac.signal,
      });
      if (!res.ok) {
        setError(`Could not load history (${res.status}).`);
        setRows([]);
        return;
      }
      const json = (await res.json()) as { docs?: VersionRow[] };
      if (!ac.signal.aborted) {
        setRows(Array.isArray(json.docs) ? json.docs : []);
        hasLoadedOnce.current = true;
      }
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      setError("Could not load history.");
      setRows([]);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [api, collectionSlug, globalSlug, id]);

  useEffect(() => {
    hasLoadedOnce.current = false;
    void load();
    return () => abortRef.current?.abort();
  }, [load, versionCount]);

  const visible = publishedOnly
    ? rows.filter((r) => r.version?._status === "published")
    : rows;

  // Payload's own paginated history, for anything past the ten rows below.
  const versionsHref = collectionSlug
    ? id != null
      ? `/collections/${collectionSlug}/${id}/versions`
      : null
    : globalSlug
      ? `/globals/${globalSlug}/versions`
      : null;

  return (
    <div className="field-type qs-history">
      <div className="qs-history__bar">
        <h3 className="qs-card__sub">History</h3>
        <button
          type="button"
          aria-pressed={publishedOnly}
          onClick={() => setPublishedOnly((v) => !v)}
          // aria-pressed alone changes nothing visually on Payload's .btn, so
          // the on state also swaps to the filled primary style.
          className={`btn btn--size-small btn--no-margin ${
            publishedOnly ? "btn--style-primary" : "btn--style-subtle"
          }`}
        >
          Published only
        </button>
      </div>

      {loading && <p className="qs-meta">Loading…</p>}
      {error && <p className="qs-danger">{error}</p>}
      {!loading && !error && visible.length === 0 && (
        <p className="qs-empty">
          Empty until someone proposes or publishes this item.
        </p>
      )}

      {!loading && visible.length > 0 && (
        <ul className="qs-history__list">
          {visible.map((row) => {
            const published = row.version?._status === "published";
            const who = published
              ? row.version?.lastPublishedBy || row.version?.lastEditedBy
              : row.version?.lastEditedBy;
            const when = published
              ? row.version?.lastPublishedAt || row.updatedAt || row.createdAt
              : row.version?.lastEditedAt || row.updatedAt || row.createdAt;

            return (
              <li key={String(row.id)} className="qs-history__item">
                <div className="qs-history__row">
                  <Pill
                    size="small"
                    pillStyle={published ? "success" : "light-gray"}
                  >
                    {published ? "Published" : "Draft"}
                  </Pill>
                  <span className="qs-meta">{formatWhen(when)}</span>
                </div>
                <div className="qs-break">{whoLabel(who)}</div>
              </li>
            );
          })}
        </ul>
      )}

      {versionsHref && (
        <p className="qs-history__summary">
          <Link href={versionsHref}>See all versions</Link>
        </p>
      )}
    </div>
  );
};
