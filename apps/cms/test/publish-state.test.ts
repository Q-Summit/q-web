import { describe, expect, it, vi } from "vitest";

import {
  liveStatus,
  readPriorLiveStatus,
  stashPriorLiveStatus,
} from "../src/lib/publish-state";

describe("liveStatus per-request memo", () => {
  it("reads the row once per request per doc (gate + deploy stash share it)", async () => {
    const findOne = vi.fn().mockResolvedValue({ _status: "published" });
    const req = { context: {}, payload: { db: { findOne } } };

    expect(await liveStatus({ req, collection: "team", id: 1 })).toBe(
      "published",
    );
    expect(await liveStatus({ req, collection: "team", id: 1 })).toBe(
      "published",
    );
    // The publish gate ran first; the deploy stash reuses its answer.
    await stashPriorLiveStatus({ req, collection: "team", id: 1 });
    expect(readPriorLiveStatus(req, { collection: "team", id: 1 })).toBe(
      "published",
    );
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it("keeps distinct docs distinct and skips the memo without a context", async () => {
    const findOne = vi
      .fn()
      .mockResolvedValueOnce({ _status: "published" })
      .mockResolvedValueOnce({ _status: "draft" });
    const req = { context: {}, payload: { db: { findOne } } };

    expect(await liveStatus({ req, collection: "team", id: 1 })).toBe(
      "published",
    );
    expect(await liveStatus({ req, collection: "team", id: 2 })).toBe("draft");
    expect(findOne).toHaveBeenCalledTimes(2);

    // No req.context (Local API edge): every call queries, nothing cached.
    const bare = { payload: { db: { findOne } } };
    await liveStatus({ req: bare, collection: "team", id: 1 });
    await liveStatus({ req: bare, collection: "team", id: 1 });
    expect(findOne).toHaveBeenCalledTimes(4);
  });
});
