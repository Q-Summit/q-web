import type { CollectionBeforeChangeHook } from "payload";
import { ValidationError } from "payload";
import { describe, expect, it } from "vitest";

import { enforceUniqueKey } from "../src/lib/unique-key";

// enforceUniqueKey backs the compound content-sync upsert keys Payload has no
// native unique field for (speakers name+group, team name+year, faqs
// question+page; src/content-sync/keys.ts). Exercised directly against a
// mock `req.payload.find`, matching the style of access.test.ts and
// content-sync.test.ts's findCapturingPayload.
type HookArgs = Parameters<CollectionBeforeChangeHook>[0];

function payloadWith(docs: Record<string, unknown>[]) {
  const calls: Array<{
    collection?: string;
    where?: { and?: unknown[] };
    draft?: boolean;
    overrideAccess?: boolean;
  }> = [];
  return {
    calls,
    payload: {
      find: async (args: {
        collection: string;
        where?: unknown;
        draft?: boolean;
        overrideAccess?: boolean;
      }) => {
        calls.push(args as never);
        return { docs };
      },
    },
  };
}

describe("enforceUniqueKey", () => {
  const hook = enforceUniqueKey({
    slug: "speakers",
    fields: ["name", "group"],
    entityLabel: "speaker",
    titleField: "name",
  });

  it("passes on create when no doc shares the compound key", async () => {
    const { payload } = payloadWith([]);
    const data = { name: "Jane Doe", group: "current" };
    await expect(
      hook({
        data,
        originalDoc: undefined,
        req: { payload },
      } as unknown as HookArgs),
    ).resolves.toBe(data);
  });

  it("rejects create when a different doc already has the same compound key, inline on each key field", async () => {
    const { payload } = payloadWith([
      { id: 7, name: "Jane Doe", group: "current" },
    ]);
    const data = { name: "Jane Doe", group: "current" };
    // ValidationError (not a bare APIError) so the admin form pins the
    // message to the key fields, matching native `unique: true` collisions.
    const thrown = await hook({
      data,
      originalDoc: undefined,
      req: { payload },
    } as unknown as HookArgs).then(
      () => null,
      (err: unknown) => err as ValidationError,
    );
    expect(thrown).toBeInstanceOf(ValidationError);
    const errors: { message: string; path: string }[] =
      thrown?.data.errors ?? [];
    expect(errors.map((e) => e.path)).toEqual(["name", "group"]);
    for (const fieldError of errors) {
      expect(fieldError.message).toMatch(
        /speaker \("Jane Doe"\).*name "Jane Doe" \+ group "current"/s,
      );
    }
  });

  it("allows an update that only matches itself (own id excluded from the lookup)", async () => {
    const { payload, calls } = payloadWith([]); // no OTHER doc shares the key
    const data = { name: "Jane Doe", group: "current" };
    const originalDoc = { id: 7, name: "Jane Doe", group: "current" };
    await expect(
      hook({ data, originalDoc, req: { payload } } as unknown as HookArgs),
    ).resolves.toBe(data);
    expect(calls[0]?.where?.and).toContainEqual({ id: { not_equals: 7 } });
  });

  it("rejects an update that collides with a genuinely different doc", async () => {
    const { payload } = payloadWith([
      { id: 9, name: "Jane Doe", group: "current" },
    ]);
    const data = { name: "Jane Doe", group: "current" };
    const originalDoc = { id: 7, name: "Jane Doe", group: "current" };
    await expect(
      hook({ data, originalDoc, req: { payload } } as unknown as HookArgs),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("does not query when a key field is missing (required-field validation handles that instead)", async () => {
    const { payload, calls } = payloadWith([]);
    const data = { name: "Jane Doe" }; // group missing
    await expect(
      hook({
        data,
        originalDoc: undefined,
        req: { payload },
      } as unknown as HookArgs),
    ).resolves.toBe(data);
    expect(calls).toHaveLength(0);
  });

  it("looks up with draft:true and overrideAccess:true so duplicates are caught even in drafts", async () => {
    const { payload, calls } = payloadWith([]);
    const data = { name: "Jane Doe", group: "current" };
    await hook({
      data,
      originalDoc: undefined,
      req: { payload },
    } as unknown as HookArgs);
    expect(calls[0]?.collection).toBe("speakers");
    expect(calls[0]?.draft).toBe(true);
    expect(calls[0]?.overrideAccess).toBe(true);
  });

  it("falls back to a value read from originalDoc when data omits an unchanged key field", async () => {
    // Payload's beforeChange data can be a partial patch; a key field the
    // editor did not touch must still be read from the original document.
    const { payload, calls } = payloadWith([]);
    const data = { role: "Speaker" }; // name/group untouched by this save
    const originalDoc = { id: 7, name: "Jane Doe", group: "current" };
    await hook({ data, originalDoc, req: { payload } } as unknown as HookArgs);
    expect(calls[0]?.where?.and).toContainEqual({
      name: { equals: "Jane Doe" },
    });
    expect(calls[0]?.where?.and).toContainEqual({
      group: { equals: "current" },
    });
  });
});
