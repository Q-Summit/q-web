import type { CollectionBeforeChangeHook } from "payload";
import { describe, expect, it } from "vitest";

import { stampAuditTrail } from "../src/lib/audit";

type HookArgs = Parameters<CollectionBeforeChangeHook>[0];

function stamp(
  user: unknown,
  data: Record<string, unknown>,
  originalDoc?: unknown,
) {
  return stampAuditTrail({
    data,
    originalDoc,
    req: { user },
  } as unknown as HookArgs);
}

const editor = { email: "editor@q-summit.de", roles: ["editor"] };
const head = { email: "head@q-summit.de", roles: ["approver"] };

describe("stampAuditTrail", () => {
  it("stamps lastEdited* on a draft propose without touching lastPublished*", () => {
    const result = stamp(
      editor,
      { _status: "draft", title: "wip" },
      { _status: "published" },
    );
    expect(result?.lastEditedBy).toBe("editor@q-summit.de");
    expect(typeof result?.lastEditedAt).toBe("string");
    expect(result?.lastPublishedBy).toBeUndefined();
    expect(result?.lastPublishedAt).toBeUndefined();
  });

  it("stamps both edited and published when publishing", () => {
    const result = stamp(head, { _status: "published" }, { _status: "draft" });
    expect(result?.lastEditedBy).toBe("head@q-summit.de");
    expect(result?.lastPublishedBy).toBe("head@q-summit.de");
    expect(typeof result?.lastPublishedAt).toBe("string");
  });

  it("stamps lastPublished* when a Head edits a live doc without _status", () => {
    const result = stamp(head, { title: "tweak" }, { _status: "published" });
    expect(result?.lastPublishedBy).toBe("head@q-summit.de");
    expect(result?.lastEditedBy).toBe("head@q-summit.de");
  });

  it("no-ops when there is no authenticated user", () => {
    const data = { _status: "draft" };
    expect(stamp(null, data)).toEqual(data);
  });

  it("discards client-spoofed audit stamps on draft propose", () => {
    const result = stamp(
      editor,
      {
        _status: "draft",
        lastEditedBy: "evil@example.com",
        lastPublishedBy: "evil@example.com",
        lastPublishedAt: "2020-01-01T00:00:00.000Z",
      },
      { _status: "draft" },
    );
    expect(result?.lastEditedBy).toBe("editor@q-summit.de");
    expect(result?.lastPublishedBy).toBeUndefined();
    expect(result?.lastPublishedAt).toBeUndefined();
  });

  it("overwrites spoofed publisher when actually publishing", () => {
    const result = stamp(
      head,
      {
        _status: "published",
        lastPublishedBy: "evil@example.com",
      },
      { _status: "draft" },
    );
    expect(result?.lastPublishedBy).toBe("head@q-summit.de");
    expect(result?.lastEditedBy).toBe("head@q-summit.de");
  });
});
