import { afterEach, describe, expect, it, vi } from "vitest";

import { DEPLOY_PRIOR_LIVE_STATUS } from "../src/lib/publish-state";
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
      doc: { _status: "draft" },
      req: {
        user: approver,
        payloadAPI: "REST",
        query: { draft: "true" },
        context: { [DEPLOY_PRIOR_LIVE_STATUS]: "published" },
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();

    await maybeSchedulePublishDeploy({
      doc: { _status: "published" },
      req: {
        user: approver,
        context: { contentSync: true, [DEPLOY_PRIOR_LIVE_STATUS]: "draft" },
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips editors", async () => {
    hookUrl();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await maybeSchedulePublishDeploy({
      doc: { _status: "published" },
      req: {
        user: editor,
        payloadAPI: "REST",
        context: { [DEPLOY_PRIOR_LIVE_STATUS]: "draft" },
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
    const req = (prior: string, next: string) => ({
      user: approver,
      payloadAPI: "REST" as const,
      context: { [DEPLOY_PRIOR_LIVE_STATUS]: prior },
      payload: { logger: { info: () => {} } },
    });

    await maybeSchedulePublishDeploy({
      doc: { _status: "published" },
      req: req("draft", "published"),
    });
    await maybeSchedulePublishDeploy({
      doc: { _status: "draft" },
      // previousDoc would be draft (pending); stash says live was published
      req: req("published", "draft"),
    });
    await maybeSchedulePublishDeploy({
      doc: { _status: "published" },
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
