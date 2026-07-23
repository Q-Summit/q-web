import React from "react";
import Link from "next/link";
import type { PayloadRequest } from "payload";

import { findMediaReferences, type MediaRef } from "../lib/media-usage";

type Props = {
  id?: string | number;
  req?: PayloadRequest;
};

/**
 * "Used on" panel on a media document: every entry that points at this file,
 * so an editor can tell whether replacing or deleting it is safe.
 *
 * Server component. Payload rebuilds server form state on every change, so
 * this is memoized per request -- without it, typing in `alt` fired thirteen
 * queries per debounce tick.
 */
export const MediaReferences = async ({ id, req }: Props) => {
  if (id == null || id === "" || !req?.payload) return null;

  const cache = (
    (req.context.mediaUsage ??= new Map()) as Map<string, Promise<MediaRef[]>>
  ).get(String(id));

  const pending =
    cache ??
    (() => {
      const promise = findMediaReferences(req.payload, id);
      (req.context.mediaUsage as Map<string, Promise<MediaRef[]>>).set(
        String(id),
        promise,
      );
      return promise;
    })();

  const refs = await pending;

  return (
    <div className="qs-usage field-type">
      <p className="qs-usage__title">Used on</p>
      {refs.length === 0 ? (
        <p className="qs-meta">
          No live or draft entry points at this file. Older saved versions may
          still use it, so deleting it can break restoring one.
        </p>
      ) : (
        <>
          <ul className="qs-usage__list">
            {refs.map((ref) => (
              <li key={`${ref.href}-${ref.title}`}>
                <Link href={ref.href} className="qs-link--strong">
                  {ref.title}
                </Link>
                <span className="qs-meta"> {ref.label}</span>
              </li>
            ))}
          </ul>
          <p className="qs-meta">
            Replacing this file changes it everywhere in this list.
          </p>
        </>
      )}
    </div>
  );
};
