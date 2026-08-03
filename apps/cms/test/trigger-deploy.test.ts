import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEPLOY_GLOBAL_RESTORE,
  DEPLOY_PRIOR_LIVE_STATUS,
} from "../src/lib/publish-state";
import {
  maybeSchedulePublishDeploy,
  maybeSchedulePublishDeployOnDelete,
  schedulePublishDeploy,
  shouldTriggerDeploy,
} from "../src/lib/trigger-deploy";

const editor = { roles: ["editor"] };
const approver = { roles: ["approver"] };
const admin = { roles: ["admin"] };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  delete process.env.CLOUDFLARE_DEPLOY_HOOK_URL;
  delete process.env.VERCEL_ENV;
});

describe("shouldTriggerDeploy", () => {
  it("gates on head + live prior/next", () => {
    expect(
      shouldTriggerDeploy({
        previousStatus: "draft",
        nextStatus: "published",
        user: editor,
      }),
    ).toBe(false);
    expect(
      shouldTriggerDeploy({
        previousStatus: "draft",
        nextStatus: "published",
        user: approver,
      }),
    ).toBe(true);
    expect(
      shouldTriggerDeploy({
        previousStatus: "published",
        nextStatus: "draft",
        user: admin,
      }),
    ).toBe(true);
    expect(
      shouldTriggerDeploy({
        previousStatus: "unknown",
        nextStatus: "draft",
        user: approver,
      }),
    ).toBe(true);
    expect(
      shouldTriggerDeploy({
        previousStatus: "draft",
        nextStatus: "draft",
        user: approver,
      }),
    ).toBe(false);
  });
});

describe("schedulePublishDeploy", () => {
  it("no-ops when CLOUDFLARE_DEPLOY_HOOK_URL is unset", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    schedulePublishDeploy(null);
    await Promise.resolve();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("errors when hook URL unset on Vercel production", () => {
    process.env.VERCEL_ENV = "production";
    const error = vi.fn();
    schedulePublishDeploy({ error, debug: vi.fn() });
    expect(error).toHaveBeenCalledWith(
      expect.stringMatching(/CLOUDFLARE_DEPLOY_HOOK_URL unset/),
    );
  });

  it("POSTs the hook once", async () => {
    process.env.CLOUDFLARE_DEPLOY_HOOK_URL =
      "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/test";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    schedulePublishDeploy({ info: () => {} });
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/test",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("logs on non-OK without throwing", async () => {
    process.env.CLOUDFLARE_DEPLOY_HOOK_URL =
      "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/test";
    const error = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => "rate limited",
      }),
    );

    schedulePublishDeploy({ error });
    await vi.waitFor(() => {
      expect(error).toHaveBeenCalledWith(
        expect.stringMatching(/hook HTTP 429/),
      );
    });
  });
});

describe("maybeSchedulePublishDeploy", () => {
  function hookUrl() {
    process.env.CLOUDFLARE_DEPLOY_HOOK_URL =
      "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/test";
  }

  it("skips draft-only writes (Save draft / Propose / content-sync)", async () => {
    hookUrl();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "draft" },
      collection: "team",
      req: {
        user: approver,
        payloadAPI: "REST",
        query: { draft: "true" },
        context: { [DEPLOY_PRIOR_LIVE_STATUS]: { "team:1": "published" } },
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();

    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "published" },
      collection: "team",
      req: {
        user: approver,
        context: {
          contentSync: true,
          [DEPLOY_PRIOR_LIVE_STATUS]: { "team:1": "draft" },
        },
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fires on bulk Publish (REST ?draft=true with a published result)", async () => {
    // The list view's PublishMany PATCHes `?draft=true` + `_status:
    // "published"`; the query flag alone must not read as a draft-only write
    // or a 28-doc bulk publish rebuilds nothing.
    hookUrl();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "published" },
      collection: "team",
      req: {
        user: approver,
        payloadAPI: "REST",
        query: { draft: "true" },
        context: { [DEPLOY_PRIOR_LIVE_STATUS]: { "team:1": "published" } },
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fires on bulk Unpublish (no draft param, live row goes down)", async () => {
    // UnpublishMany PATCHes without a draft param and `_status: "draft"`;
    // taking live content down must rebuild or the site keeps serving it.
    hookUrl();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "draft" },
      collection: "team",
      req: {
        user: approver,
        payloadAPI: "REST",
        query: {},
        context: { [DEPLOY_PRIOR_LIVE_STATUS]: { "team:1": "published" } },
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps per-doc prior status in a concurrent bulk op (no shared-slot race)", async () => {
    // Bulk ops run every doc's hooks on ONE req; the stash must be per doc
    // or a live row can read a sibling's "draft" and skip the rebuild.
    hookUrl();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const req = {
      user: approver,
      payloadAPI: "REST" as const,
      query: {},
      context: {
        [DEPLOY_PRIOR_LIVE_STATUS]: { "team:1": "published", "team:2": "draft" },
      },
      payload: { logger: { info: () => {} } },
    };

    await maybeSchedulePublishDeploy({
      doc: { id: 2, _status: "draft" },
      collection: "team",
      req,
    });
    expect(fetchMock).not.toHaveBeenCalled();

    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "draft" },
      collection: "team",
      req,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fires when a global Restore as draft takes the live row down", async () => {
    // Global restoreVersion writes the LIVE global row even with ?draft=true;
    // the beforeOperation marker must override the draft-write skip.
    hookUrl();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await maybeSchedulePublishDeploy({
      doc: { _status: "draft" },
      global: "page-home",
      req: {
        user: approver,
        payloadAPI: "REST",
        query: { draft: "true" },
        context: {
          [DEPLOY_GLOBAL_RESTORE]: true,
          [DEPLOY_PRIOR_LIVE_STATUS]: { "global:page-home": "published" },
        },
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("dedupes to one hook POST per request (bulk publish of many docs)", async () => {
    hookUrl();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const req = {
      user: approver,
      payloadAPI: "REST" as const,
      query: { draft: "true" },
      context: {
        [DEPLOY_PRIOR_LIVE_STATUS]: { "team:1": "published", "team:2": "published" },
      },
      payload: { logger: { info: () => {} } },
    };

    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "published" },
      collection: "team",
      req,
    });
    await maybeSchedulePublishDeploy({
      doc: { id: 2, _status: "published" },
      collection: "team",
      req,
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it("skips a fresh draft create (admin Duplicate) but fires a live create", async () => {
    hookUrl();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await maybeSchedulePublishDeploy({
      doc: { id: 9, _status: "draft" },
      collection: "team",
      operation: "create",
      req: { user: approver, payloadAPI: "REST", query: {}, context: {} },
    });
    expect(fetchMock).not.toHaveBeenCalled();

    await maybeSchedulePublishDeploy({
      doc: { id: 9, _status: "published" },
      collection: "team",
      operation: "create",
      req: { user: approver, payloadAPI: "REST", query: {}, context: {} },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips editors", async () => {
    hookUrl();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "published" },
      collection: "team",
      req: {
        user: editor,
        payloadAPI: "REST",
        context: { [DEPLOY_PRIOR_LIVE_STATUS]: { "team:1": "draft" } },
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("schedules publish, unpublish-with-pending-draft, and live edit", async () => {
    hookUrl();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);
    const req = (prior: string, _next: string) => ({
      user: approver,
      payloadAPI: "REST" as const,
      context: { [DEPLOY_PRIOR_LIVE_STATUS]: { "team:1": prior } },
      payload: { logger: { info: () => {} } },
    });

    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "published" },
      collection: "team",
      req: req("draft", "published"),
    });
    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "draft" },
      collection: "team",
      // previousDoc would be draft (pending); stash says live was published
      req: req("published", "draft"),
    });
    await maybeSchedulePublishDeploy({
      doc: { id: 1, _status: "published" },
      collection: "team",
      req: req("published", "published"),
    });

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});

describe("maybeSchedulePublishDeployOnDelete", () => {
  it("schedules when live row is published; skips draft-only", async () => {
    process.env.CLOUDFLARE_DEPLOY_HOOK_URL =
      "https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/test";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    });
    vi.stubGlobal("fetch", fetchMock);

    await maybeSchedulePublishDeployOnDelete({
      collection: "faqs",
      id: 1,
      req: {
        user: approver,
        payload: {
          logger: { info: () => {} },
          db: { findOne: async () => ({ _status: "published" }) },
        },
      },
    });
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    fetchMock.mockClear();
    await maybeSchedulePublishDeployOnDelete({
      collection: "faqs",
      id: 2,
      req: {
        user: approver,
        payload: { db: { findOne: async () => ({ _status: "draft" }) } },
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("publish deploy hook wiring (source)", () => {
  it("base factories import trigger-deploy hooks", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const dirname = path.dirname(fileURLToPath(import.meta.url));
    const collectionBase = fs.readFileSync(
      path.join(dirname, "../src/collections/base.ts"),
      "utf-8",
    );
    const globalBase = fs.readFileSync(
      path.join(dirname, "../src/globals/base.ts"),
      "utf-8",
    );
    expect(collectionBase).toMatch(/from ["']\.\.\/lib\/trigger-deploy["']/);
    expect(collectionBase).toMatch(/capturePriorLiveStatusCollection/);
    expect(collectionBase).toMatch(/triggerDeployBeforeCollectionDelete/);
    expect(globalBase).toMatch(/capturePriorLiveStatusGlobalRestore/);
    expect(globalBase).toMatch(/triggerDeployAfterGlobalChange/);
  });
});
