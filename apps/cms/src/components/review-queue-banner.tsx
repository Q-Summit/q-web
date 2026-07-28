import type { Payload, TypedUser } from "payload";

import { Link } from "@payloadcms/ui";
import React from "react";

import { isHead } from "../access";
import { loadReviewQueue } from "../lib/review-queue";

/*
 * Dashboard signal for Heads/Admins: how many proposals are waiting, without
 * having to open /reviews to find out. Renders nothing for editors and
 * nothing when the queue is empty (an empty state here would just be noise).
 * Uses the same loader as /reviews so the two can never disagree.
 */
export async function ReviewQueueBanner(props: {
  payload: Payload;
  user?: TypedUser;
}) {
  const { payload, user } = props;
  if (!user || !isHead(user)) return null;

  const queue = await loadReviewQueue(payload, user);
  if (queue.length === 0) return null;

  const newest = queue[0];

  return (
    <div className="qs-card">
      <div className="qs-inline">
        <h2 className="qs-card__title qs-flush">
          {queue.length === 1
            ? "1 proposal is waiting for review"
            : `${queue.length} proposals are waiting for review`}
        </h2>
        {newest ? (
          <span className="qs-muted">newest: {newest.title}</span>
        ) : null}
        <Link className="qs-link--strong" href="/reviews">
          Open the Review queue →
        </Link>
      </div>
    </div>
  );
}
