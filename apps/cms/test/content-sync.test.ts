import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { contentSyncEndpoint } from "../src/endpoints/content-sync";
import {
  CONTENT_SYNC_ACTOR_HEADER,
  verifyContentSyncToken,
  normalizeContentSyncUserEmail,
  contentSyncAuditEmail,
} from "../src/content-sync/auth";
import { forceDraftData } from "../src/content-sync/force-draft";
import { serializeDoc } from "../src/content-sync/serialize";
import {
  isDeniedSlug,
  isSyncCollection,
  SYNC_COLLECTIONS,
  SYNC_DENY,
  SYNC_GLOBALS,
} from "../src/content-sync/keys";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Vitest (Vite) provides import.meta.glob at runtime but ships no ambient type
// as a direct cms dependency, so declare the one member this file uses. Vite
// still statically transforms the literal import.meta.glob(...) calls below.
declare global {
  interface ImportMeta {
    glob: (
      pattern: string,
      options: { eager: true },
    ) => Record<string, Record<string, unknown>>;
  }
}

describe("forceDraftData", () => {
  it("always sets _status to draft even when package asks for published", () => {
    const out = forceDraftData({ title: "x", _status: "published", id: 99 });
    expect(out._status).toBe("draft");
    expect(out.title).toBe("x");
    expect(out).not.toHaveProperty("id");
  });

  it("strips server-owned audit stamps so packages cannot spoof publishers", () => {
    const out = forceDraftData({
      title: "x",
      lastEditedBy: "evil@example.com",
      lastEditedAt: "2020-01-01T00:00:00.000Z",
      lastPublishedBy: "evil@example.com",
      lastPublishedAt: "2020-01-01T00:00:00.000Z",
    });
    expect(out).not.toHaveProperty("lastEditedBy");
    expect(out).not.toHaveProperty("lastEditedAt");
    expect(out).not.toHaveProperty("lastPublishedBy");
    expect(out).not.toHaveProperty("lastPublishedAt");
    expect(out._status).toBe("draft");
  });
});

describe("whyq audience anchorId survives the export -> propose round-trip", () => {
  // Regression: the audience anchor used to be a user field literally named
  // "id", which collides with Payload's own array-row id and lands in the
  // STRIP_KEYS set of both serializeDoc (export) and forceDraftData (apply),
  // so the anchor was silently dropped on every package round-trip. The field
  // is now "anchorId"; row "id" is still stripped, the anchor survives.
  it("keeps anchorId while stripping the row id at every level", () => {
    const doc = {
      id: 5,
      title: "Why Q?",
      heading: "Why Q-Summit?",
      intro: "Intro copy.",
      audiences: [
        {
          id: "row-one",
          anchorId: "attendees",
          heading: "For attendees",
          intro: "Section intro.",
          items: [
            { id: "item-row-one", title: "Perk", description: "Detail." },
          ],
          imageFile: {
            id: 42,
            filename: "whyq-attendees-800.webp",
            alt: "Attendees",
            url: "https://example.test/media/whyq-attendees-800.webp",
            mimeType: "image/webp",
            filesize: 12345,
          },
          imageAlt: "Attendees on stage",
          imageLeft: false,
        },
      ],
      _status: "published",
    };

    // Export side: doc -> package JSON.
    const serialized = serializeDoc(doc);
    const serializedAudience = (
      serialized.audiences as Record<string, unknown>[]
    )[0]!;
    expect(serializedAudience).not.toHaveProperty("id");
    expect(serializedAudience.anchorId).toBe("attendees");
    const serializedItem = (
      serializedAudience.items as Record<string, unknown>[]
    )[0]!;
    expect(serializedItem).not.toHaveProperty("id");
    // Upload relation collapses to a filename ref, no numeric row id.
    expect(serializedAudience.imageFile).toEqual({
      filename: "whyq-attendees-800.webp",
      alt: "Attendees",
    });

    // Apply side: package JSON -> draft data for updateGlobal.
    const applied = forceDraftData(serialized);
    expect(applied).not.toHaveProperty("id");
    expect(applied._status).toBe("draft");
    const appliedAudience = (
      applied.audiences as Record<string, unknown>[]
    )[0]!;
    expect(appliedAudience).not.toHaveProperty("id");
    expect(appliedAudience.anchorId).toBe("attendees");
    const appliedItem = (
      appliedAudience.items as Record<string, unknown>[]
    )[0]!;
    expect(appliedItem).not.toHaveProperty("id");
    expect(appliedItem.anchorId).toBeUndefined();
    expect(appliedItem.title).toBe("Perk");
  });
});

describe("Lexical link url survives the export -> propose round-trip", () => {
  // Regression: `url` sits in the media system-field strip sets of
  // serializeDoc (export), forceDraftData (apply), and pull's stripDoc, and
  // the old walkers stripped it at EVERY depth. A rich text link node keeps
  // its href in `fields.url`, so every package round-trip silently dropped
  // link URLs and the proposed draft failed link validation ("The following
  // fields are invalid: url"). Media objects are collapsed to filename refs
  // before the strip runs, so a nested `url` is always content.
  const answer = {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "text", text: "abide by the " },
            {
              type: "link",
              id: "lexical-node-id",
              fields: {
                url: "https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md",
                newTab: true,
                linkType: "custom",
              },
              children: [{ type: "text", text: "MLH Code of Conduct." }],
            },
          ],
        },
      ],
    },
  };

  function linkFields(doc: Record<string, unknown>): Record<string, unknown> {
    const root = (doc.answer as Record<string, unknown>).root as Record<
      string,
      unknown
    >;
    const paragraph = (root.children as Record<string, unknown>[])[0]!;
    const link = (paragraph.children as Record<string, unknown>[])[1]!;
    return link.fields as Record<string, unknown>;
  }

  it("keeps fields.url on export while stripping doc-level system fields", () => {
    const serialized = serializeDoc({
      id: 19,
      question: "What is the Code of Conduct?",
      answer,
      url: "https://example.test/should-be-stripped",
      _status: "published",
    });
    expect(serialized).not.toHaveProperty("id");
    expect(serialized).not.toHaveProperty("url");
    expect(linkFields(serialized).url).toBe(
      "https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md",
    );
  });

  it("keeps fields.url on apply so proposed drafts pass link validation", () => {
    const applied = forceDraftData({
      question: "What is the Code of Conduct?",
      answer,
      url: "https://example.test/should-be-stripped",
    });
    expect(applied._status).toBe("draft");
    expect(applied).not.toHaveProperty("url");
    expect(linkFields(applied).url).toBe(
      "https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md",
    );
  });
});

describe('no collection or global declares a user field named "id"', () => {
  // A user field literally named "id" collides with Payload's own array-row
  // primary key and lands in the content-sync STRIP_KEYS set, so it is
  // silently dropped on every round-trip (this is exactly what happened to the
  // whyq audience anchor). Walk the RAW authored field trees for every
  // collection and global. We deliberately do NOT use the sanitized/built
  // config here: buildConfig auto-appends an `id` field to every array/block
  // row, which would mask the very thing we are guarding against.
  type RawField = {
    name?: string;
    fields?: RawField[];
    tabs?: { fields?: RawField[] }[];
    blocks?: { fields?: RawField[] }[];
  };

  function offendingPaths(
    fields: RawField[] | undefined,
    prefix: string,
  ): string[] {
    const hits: string[] = [];
    for (const field of fields ?? []) {
      const here = field.name ? `${prefix}.${field.name}` : prefix;
      if (field.name === "id") hits.push(here);
      hits.push(...offendingPaths(field.fields, here));
      for (const tab of field.tabs ?? [])
        hits.push(...offendingPaths(tab.fields, here));
      for (const block of field.blocks ?? [])
        hits.push(...offendingPaths(block.fields, here));
    }
    return hits;
  }

  // Eagerly import every source module under collections/ and globals/, then
  // keep the exported values that look like a collection/global config
  // (a string slug plus a fields array). New files are covered automatically.
  const modules = {
    ...import.meta.glob("../src/collections/*.ts", { eager: true }),
    ...import.meta.glob("../src/globals/*.ts", { eager: true }),
  } as Record<string, Record<string, unknown>>;

  const configs: { slug: string; fields: RawField[] }[] = [];
  for (const mod of Object.values(modules)) {
    for (const value of Object.values(mod)) {
      if (
        value &&
        typeof value === "object" &&
        typeof (value as { slug?: unknown }).slug === "string" &&
        Array.isArray((value as { fields?: unknown }).fields)
      ) {
        configs.push(value as { slug: string; fields: RawField[] });
      }
    }
  }

  it("discovers every registered collection and global", () => {
    // Guard against the glob silently matching nothing (which would make the
    // assertion below vacuously pass). 9 collections + 14 globals = 23.
    expect(configs.length).toBe(23);
  });

  it('has no field literally named "id" anywhere in the field trees', () => {
    const offenders = configs.flatMap((c) => offendingPaths(c.fields, c.slug));
    expect(offenders).toEqual([]);
  });
});

describe("no-op proposals are skipped, not re-drafted", () => {
  function payloadWith(existingDoc: Record<string, unknown> | null) {
    const updates: unknown[] = [];
    return {
      updates,
      payload: {
        find: async () => ({ docs: existingDoc ? [existingDoc] : [] }),
        findGlobal: async () => null,
        create: async () => ({ id: 1 }),
        update: async (args: unknown) => {
          updates.push(args);
          return { id: 1 };
        },
        updateGlobal: async () => {
          throw new Error("unexpected updateGlobal");
        },
      },
    };
  }

  const pkg = {
    package: { version: 1 },
    collections: {
      faqs: [
        {
          question: "Hello?",
          page: "home",
          answer: { root: { children: [] } },
          order: 2,
        },
      ],
    },
  };

  it("skips a doc whose package content matches the current draft state", async () => {
    const { applyContentPackage } =
      await import("../src/content-sync/apply-package");
    const { updates, payload } = payloadWith({
      id: 9,
      question: "Hello?",
      page: "home",
      // Row ids and key order must not defeat the comparison.
      answer: { root: { children: [] } },
      order: 2,
      _status: "published",
      updatedAt: "2026-07-01T00:00:00.000Z",
    });
    const result = await applyContentPackage({
      payload: payload as never,
      user: { id: 7, roles: ["editor"], divisions: ["pr"] },
      pkg,
    });
    expect(result.errors).toEqual([]);
    expect(result.skipped).toEqual(["faqs:Hello?+home (unchanged)"]);
    expect(result.updated).toEqual([]);
    expect(updates).toHaveLength(0);
  });

  it("still updates when any package value differs", async () => {
    const { applyContentPackage } =
      await import("../src/content-sync/apply-package");
    const { updates, payload } = payloadWith({
      id: 9,
      question: "Hello?",
      page: "home",
      answer: { root: { children: [] } },
      order: 5,
      _status: "published",
    });
    const result = await applyContentPackage({
      payload: payload as never,
      user: { id: 7, roles: ["editor"], divisions: ["pr"] },
      pkg,
    });
    expect(result.errors).toEqual([]);
    expect(result.updated).toEqual(["faqs:Hello?+home"]);
    expect(updates).toHaveLength(1);
  });
});

describe("allowlist", () => {
  it("allows speakers and denies users/legal", () => {
    expect(isSyncCollection("speakers")).toBe(true);
    expect(isDeniedSlug("users")).toBe(true);
    expect(isDeniedSlug("legal")).toBe(true);
  });

  it("stays in parity with scripts/content/sync-scope.mjs", async () => {
    const scope = await import("../../../scripts/content/sync-scope.mjs");
    const { MAX_DOCS } = await import("../src/content-sync/apply-package");
    expect(scope.SYNC_COLLECTIONS).toEqual([...SYNC_COLLECTIONS]);
    expect(scope.SYNC_GLOBALS).toEqual([...SYNC_GLOBALS]);
    expect(scope.SYNC_DENY).toEqual([...SYNC_DENY]);
    expect(scope.MAX_PACKAGE_DOCS).toBe(MAX_DOCS);
  });
});

describe("normalizeContentSyncUserEmail", () => {
  it("forces @q-summit.com for lookup and accepts bare usernames", () => {
    expect(normalizeContentSyncUserEmail("lukas.strickler")).toBe(
      "lukas.strickler@q-summit.com",
    );
    expect(normalizeContentSyncUserEmail("Lukas.Strickler@q-summit.com")).toBe(
      "lukas.strickler@q-summit.com",
    );
    // Client may send the audit-domain form; lookup still uses Workspace.
    expect(
      normalizeContentSyncUserEmail("lukas.strickler@agent.q-summit.com"),
    ).toBe("lukas.strickler@q-summit.com");
  });

  it("rejects other domains, empty values, and the example local-part dev", () => {
    expect(() => normalizeContentSyncUserEmail("sync@example.com")).toThrow(
      /q-summit\.com/,
    );
    expect(() => normalizeContentSyncUserEmail("")).toThrow(/must be/);
    expect(() => normalizeContentSyncUserEmail("-bad")).toThrow(/invalid/);
    expect(() => normalizeContentSyncUserEmail("dev")).toThrow(
      /example value "dev"/,
    );
    expect(() => normalizeContentSyncUserEmail("dev@q-summit.com")).toThrow(
      /example value "dev"/,
    );
  });
});

describe("contentSyncAuditEmail", () => {
  it("maps Workspace email to @agent.q-summit.com for changelog", () => {
    expect(contentSyncAuditEmail("lukas.strickler@q-summit.com")).toBe(
      "lukas.strickler@agent.q-summit.com",
    );
  });
});

describe("loadSyncUser", () => {
  it("returns null when the Workspace user does not exist (endpoint must 400)", async () => {
    const { loadSyncUser } = await import("../src/content-sync/auth");
    const payload = {
      find: async () => ({ docs: [] }),
    };
    await expect(
      loadSyncUser(payload as never, "ghost.user@q-summit.com"),
    ).resolves.toBeNull();
  });

  it("rejects a user with no CMS roles", async () => {
    const { loadSyncUser } = await import("../src/content-sync/auth");
    const payload = {
      find: async () => ({
        docs: [
          { id: 1, email: "norole@q-summit.com", roles: [], divisions: [] },
        ],
      }),
    };
    await expect(
      loadSyncUser(payload as never, "norole@q-summit.com"),
    ).rejects.toThrow(/no CMS roles/);
  });

  it("loads a real user but stamps audit email on the agent domain", async () => {
    const { loadSyncUser } = await import("../src/content-sync/auth");
    const payload = {
      find: async () => ({
        docs: [
          {
            id: 9,
            email: "lukas.strickler@q-summit.com",
            roles: ["editor"],
            divisions: ["pr"],
          },
        ],
      }),
    };
    const user = await loadSyncUser(payload as never, "lukas.strickler");
    expect(user).toEqual({
      id: 9,
      email: "lukas.strickler@agent.q-summit.com",
      roles: ["editor"],
      divisions: ["pr"],
    });
  });

  // Any real Workspace person may be the actor, admins included: propose is
  // drafts-only by construction (forceDraftData + draft: true), so the role
  // never gated publishing. The role decides which drafts they may write,
  // matching what they can already edit in the admin UI.
  for (const role of ["approver", "admin"]) {
    it(`accepts a ${role} as the actor, keeping their real roles and divisions`, async () => {
      const { loadSyncUser } = await import("../src/content-sync/auth");
      const payload = {
        find: async () => ({
          docs: [
            {
              id: 4,
              email: "head.person@q-summit.com",
              roles: ["editor", role],
              divisions: ["pr"],
            },
          ],
        }),
      };
      const user = await loadSyncUser(payload as never, "head.person");
      expect(user).toEqual({
        id: 4,
        // Agent domain, so the changelog shows "(agent)" instead of passing
        // the propose off as a manual edit by this person.
        email: "head.person@agent.q-summit.com",
        roles: ["editor", role],
        divisions: ["pr"],
      });
    });
  }

  it("accepts an admin with no content divisions", async () => {
    const { loadSyncUser } = await import("../src/content-sync/auth");
    const payload = {
      find: async () => ({
        docs: [
          {
            id: 7,
            email: "it.person@q-summit.com",
            roles: ["admin"],
            divisions: [],
          },
        ],
      }),
    };
    const user = await loadSyncUser(payload as never, "it.person");
    expect(user?.email).toBe("it.person@agent.q-summit.com");
    expect(user?.roles).toEqual(["admin"]);
  });
});

describe("verifyContentSyncToken", () => {
  it("accepts matching bearer and rejects mismatches", () => {
    const prev = process.env.CONTENT_SYNC_TOKEN;
    process.env.CONTENT_SYNC_TOKEN = "test-token-value-32chars-long!!";
    try {
      expect(
        verifyContentSyncToken("Bearer test-token-value-32chars-long!!"),
      ).toBe(true);
      expect(verifyContentSyncToken("Bearer wrong")).toBe(false);
      expect(verifyContentSyncToken(null)).toBe(false);
      expect(verifyContentSyncToken("test-token-value-32chars-long!!")).toBe(
        false,
      );
    } finally {
      if (prev === undefined) delete process.env.CONTENT_SYNC_TOKEN;
      else process.env.CONTENT_SYNC_TOKEN = prev;
    }
  });
});

// Source-pattern guardrails (not behavioral): these grep the endpoint text so a
// refactor cannot silently drop the version gate or the apply-error mapping.
// The runtime behavior they describe is exercised by the "contentSyncEndpoint
// handler" block below; keep these as cheap regressions on the source shape.
describe("package.version gate (source guardrail)", () => {
  it("keeps the version-1-only check literal in the endpoint source", () => {
    const endpointSrc = fs.readFileSync(
      path.join(dirname, "../src/endpoints/content-sync.ts"),
      "utf-8",
    );
    expect(endpointSrc).toMatch(/package\.version !== 1/);
    expect(endpointSrc).toMatch(/unsupported package\.version/);
  });
});

describe("content-sync endpoint deploy boundary (source guardrail)", () => {
  it("does not import deploy helpers or site deploy tooling", () => {
    const endpointPath = path.join(dirname, "../src/endpoints/content-sync.ts");
    const applyPath = path.join(
      dirname,
      "../src/content-sync/apply-package.ts",
    );
    const endpointSrc = fs.readFileSync(endpointPath, "utf-8");
    const applySrc = fs.readFileSync(applyPath, "utf-8");

    expect(endpointSrc).not.toMatch(/from ["'].*trigger-deploy/);
    expect(endpointSrc).not.toMatch(/from ["']wrangler["']/);
    expect(endpointSrc).not.toMatch(/DEPLOY_HOOK|deployHook|CLOUDFLARE_DEPLOY/);
    expect(applySrc).not.toMatch(/from ["'].*trigger-deploy/);
    expect(applySrc).not.toMatch(/from ["']wrangler["']/);
  });

  it("keeps the apply-errors -> 422 / clean -> 200 mapping literal in source", () => {
    const endpointSrc = fs.readFileSync(
      path.join(dirname, "../src/endpoints/content-sync.ts"),
      "utf-8",
    );
    expect(endpointSrc).toMatch(/result\.errors\.length > 0 \? 422 : 200/);
  });
});

// Behavioral coverage: drive contentSyncEndpoint.handler with a stub req and
// assert the real HTTP status the handler returns. No DB; payload.find is
// mocked to the sync-user lookup loadSyncUser expects (see loadSyncUser tests).
describe("contentSyncEndpoint handler", () => {
  const TOKEN = "test-token-value-32chars-long!!";
  // Editor Workspace row loadSyncUser accepts: email exactly the normalized
  // actor at q-summit.com, a CMS role, so the endpoint reaches applyContentPackage.
  const editorUserDoc = {
    id: 9,
    email: "lukas.strickler@q-summit.com",
    roles: ["editor"],
    divisions: ["pr"],
  };

  // Minimal Payload stub: logger.info is fire-and-forget; find answers the
  // users lookup. Override find for cases that must fail before the lookup.
  function makeMockPayload(overrides: Record<string, unknown> = {}) {
    return {
      logger: { info: () => {} },
      find: async () => ({ docs: [editorUserDoc] }),
      findGlobal: async () => null,
      create: async () => ({ id: 1 }),
      update: async () => ({ id: 1 }),
      updateGlobal: async () => ({ id: 1 }),
      ...overrides,
    };
  }

  // Stub req shaped like the slice of PayloadRequest the handler touches:
  // headers.get, arrayBuffer, url, payload.
  function makeMockReq(opts: {
    authorization?: string | null;
    actor?: string | null;
    body?: unknown;
    rawBody?: ArrayBuffer;
    url?: string;
    payload?: unknown;
  }) {
    const headers: Record<string, string | null> = {};
    if (opts.authorization !== undefined)
      headers.authorization = opts.authorization;
    if (opts.actor !== undefined)
      headers[CONTENT_SYNC_ACTOR_HEADER] = opts.actor;

    const rawBody =
      opts.rawBody ??
      (opts.body === undefined
        ? new ArrayBuffer(0)
        : (new TextEncoder().encode(JSON.stringify(opts.body))
            .buffer as ArrayBuffer));

    return {
      headers: {
        get: (name: string) => {
          const key = name.toLowerCase();
          return key in headers ? headers[key] : null;
        },
      },
      arrayBuffer: async () => rawBody,
      url: opts.url ?? "http://localhost/api/content-sync",
      payload: opts.payload ?? makeMockPayload(),
    };
  }

  async function callHandler(req: unknown): Promise<Response> {
    // Endpoint.handler is typed for PayloadRequest; the stub covers the used slice.
    return (await contentSyncEndpoint.handler!(req as never)) as Response;
  }

  let prevToken: string | undefined;
  beforeEach(() => {
    prevToken = process.env.CONTENT_SYNC_TOKEN;
    process.env.CONTENT_SYNC_TOKEN = TOKEN;
  });
  afterEach(() => {
    if (prevToken === undefined) delete process.env.CONTENT_SYNC_TOKEN;
    else process.env.CONTENT_SYNC_TOKEN = prevToken;
  });

  it("401 when the Bearer token is missing", async () => {
    const res = await callHandler(
      makeMockReq({
        actor: "lukas.strickler",
        body: { package: { version: 1 } },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("401 when the Bearer token is wrong", async () => {
    const res = await callHandler(
      makeMockReq({
        authorization: "Bearer wrong",
        actor: "lukas.strickler",
        body: { package: { version: 1 } },
      }),
    );
    expect(res.status).toBe(401);
  });

  it("400 when the actor header is missing", async () => {
    const res = await callHandler(
      makeMockReq({
        authorization: `Bearer ${TOKEN}`,
        body: { package: { version: 1 } },
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(new RegExp(CONTENT_SYNC_ACTOR_HEADER));
  });

  it('400 when the actor is the example value "dev"', async () => {
    const res = await callHandler(
      makeMockReq({
        authorization: `Bearer ${TOKEN}`,
        actor: "dev",
        body: { package: { version: 1 } },
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/example value/);
  });

  it("413 when the body exceeds the 5 MiB cap", async () => {
    const res = await callHandler(
      makeMockReq({
        authorization: `Bearer ${TOKEN}`,
        actor: "lukas.strickler",
        rawBody: new ArrayBuffer(5 * 1024 * 1024 + 1),
      }),
    );
    expect(res.status).toBe(413);
  });

  it("400 when the body is not valid JSON", async () => {
    const res = await callHandler(
      makeMockReq({
        authorization: `Bearer ${TOKEN}`,
        actor: "lukas.strickler",
        rawBody: new TextEncoder().encode("not json{").buffer as ArrayBuffer,
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/invalid JSON/i);
  });

  it("400 when package.version is not 1", async () => {
    const res = await callHandler(
      makeMockReq({
        authorization: `Bearer ${TOKEN}`,
        actor: "lukas.strickler",
        body: { package: { version: 2 } },
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/unsupported package\.version/i);
  });

  it("422 when applyContentPackage reports errors (denied slug)", async () => {
    const res = await callHandler(
      makeMockReq({
        authorization: `Bearer ${TOKEN}`,
        actor: "lukas.strickler",
        // "users" is denied; applyContentPackage errors before any write.
        body: {
          package: { version: 1 },
          collections: { users: [{ email: "x@example.com" }] },
        },
      }),
    );
    expect(res.status).toBe(422);
    const payload = (await res.json()) as { errors: string[] };
    expect(
      payload.errors.some((e) => e.includes('denied collection "users"')),
    ).toBe(true);
  });

  it("200 when applyContentPackage reports no errors (empty package)", async () => {
    const res = await callHandler(
      makeMockReq({
        authorization: `Bearer ${TOKEN}`,
        actor: "lukas.strickler",
        body: { package: { version: 1 } },
      }),
    );
    expect(res.status).toBe(200);
    const payload = (await res.json()) as { errors: string[]; actor: string };
    expect(payload.errors).toEqual([]);
    expect(payload.actor).toBe("lukas.strickler@agent.q-summit.com");
  });
});

describe("applyContentPackage", () => {
  it("aborts before writes when users or legal is present", async () => {
    const { applyContentPackage } =
      await import("../src/content-sync/apply-package");
    const calls: string[] = [];
    const payload = {
      find: async () => {
        calls.push("find");
        return { docs: [] };
      },
      create: async () => {
        calls.push("create");
      },
      update: async () => {
        calls.push("update");
      },
      updateGlobal: async () => {
        calls.push("updateGlobal");
      },
    };

    const denied = await applyContentPackage({
      payload: payload as never,
      user: { id: 1, roles: ["editor"], divisions: ["pr"] },
      pkg: {
        package: { version: 1 },
        collections: {
          users: [{ email: "x@example.com" }],
          faqs: [{ question: "Q", page: "home", answer: {} }],
        },
      },
    });
    expect(
      denied.errors.some((e) => e.includes('denied collection "users"')),
    ).toBe(true);
    expect(calls).toEqual([]);

    const unknown = await applyContentPackage({
      payload: payload as never,
      user: { id: 1, roles: ["editor"], divisions: ["pr"] },
      pkg: {
        package: { version: 1 },
        collections: { "not-a-real-collection": [{ name: "x" }] },
      },
    });
    expect(unknown.errors.some((e) => e.includes("non-allowlisted"))).toBe(
      true,
    );
    expect(calls).toEqual([]);
  });

  it("always writes drafts with overrideAccess false", async () => {
    const { applyContentPackage } =
      await import("../src/content-sync/apply-package");
    const writes: Array<Record<string, unknown>> = [];
    const payload = {
      find: async () => ({ docs: [] }),
      create: async (args: Record<string, unknown>) => {
        writes.push(args);
        return { id: 1 };
      },
      update: async () => {
        throw new Error("unexpected update");
      },
      updateGlobal: async () => {
        throw new Error("unexpected updateGlobal");
      },
    };

    const result = await applyContentPackage({
      payload: payload as never,
      user: { id: 7, roles: ["editor"], divisions: ["pr"] },
      pkg: {
        package: { version: 1 },
        collections: {
          faqs: [
            {
              question: "Hello?",
              page: "home",
              answer: { root: { children: [] } },
            },
          ],
        },
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.created).toEqual(["faqs:Hello?+home"]);
    expect(writes).toHaveLength(1);
    expect(writes[0].draft).toBe(true);
    expect(writes[0].overrideAccess).toBe(false);
    expect(writes[0].data).toMatchObject({
      _status: "draft",
      question: "Hello?",
    });
  });
});

describe("team and past-teams upsert keys", () => {
  // Captures the `where` clause applyContentPackage builds for the existing-doc
  // lookup, so we can assert the identity query per doc without a real DB.
  function findCapturingPayload(
    finds: Array<{ collection: string; where: unknown }>,
  ) {
    return {
      find: async (args: { collection: string; where?: unknown }) => {
        finds.push({ collection: args.collection, where: args.where });
        return { docs: [] };
      },
      create: async () => ({ id: 1 }),
      update: async () => {
        throw new Error("unexpected update");
      },
      updateGlobal: async () => {
        throw new Error("unexpected updateGlobal");
      },
    };
  }

  it("matches a named team doc on (name AND year)", async () => {
    const { applyContentPackage } =
      await import("../src/content-sync/apply-package");
    const finds: Array<{ collection: string; where: unknown }> = [];
    const result = await applyContentPackage({
      payload: findCapturingPayload(finds) as never,
      user: { id: 1, roles: ["editor"], divisions: ["chair"] },
      dryRun: true,
      pkg: {
        package: { version: 1 },
        collections: { team: [{ name: "Alice", year: "26/27" }] },
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.created).toEqual(["team:Alice+26/27"]);
    const teamFind = finds.find((f) => f.collection === "team");
    expect(teamFind?.where).toEqual({
      and: [{ name: { equals: "Alice" } }, { year: { equals: "26/27" } }],
    });
  });

  it("matches a past-teams year photo on year alone", async () => {
    const { applyContentPackage } =
      await import("../src/content-sync/apply-package");
    const finds: Array<{ collection: string; where: unknown }> = [];
    const result = await applyContentPackage({
      payload: findCapturingPayload(finds) as never,
      user: { id: 1, roles: ["editor"], divisions: ["chair"] },
      dryRun: true,
      pkg: {
        package: { version: 1 },
        collections: { "past-teams": [{ year: "25/26" }] },
      },
    });

    expect(result.errors).toEqual([]);
    expect(result.created).toEqual(["past-teams:25/26"]);
    const pastTeamsFind = finds.find((f) => f.collection === "past-teams");
    expect(pastTeamsFind?.where).toEqual({ year: { equals: "25/26" } });
  });

  it("errors when a team doc is missing a key field (nameless docs moved to past-teams)", async () => {
    const { applyContentPackage } =
      await import("../src/content-sync/apply-package");
    const finds: Array<{ collection: string; where: unknown }> = [];
    const result = await applyContentPackage({
      payload: findCapturingPayload(finds) as never,
      user: { id: 1, roles: ["editor"], divisions: ["chair"] },
      dryRun: true,
      pkg: {
        package: { version: 1 },
        collections: { team: [{ name: "Bob" }] },
      },
    });

    expect(
      result.errors.some((e) => e.includes("missing upsert key fields")),
    ).toBe(true);
    expect(result.created).toEqual([]);
    // A doc that cannot be keyed is never looked up.
    expect(finds.some((f) => f.collection === "team")).toBe(false);
  });

  it("aborts before writes when package exceeds MAX_DOCS", async () => {
    const { applyContentPackage, MAX_DOCS } =
      await import("../src/content-sync/apply-package");
    const calls: string[] = [];
    const payload = {
      find: async () => {
        calls.push("find");
        return { docs: [] };
      },
      create: async () => {
        calls.push("create");
      },
      update: async () => {
        calls.push("update");
      },
      updateGlobal: async () => {
        calls.push("updateGlobal");
      },
    };

    const faqs = Array.from({ length: MAX_DOCS + 1 }, (_, i) => ({
      question: `Q${i}?`,
      page: "home" as const,
      answer: { root: { children: [] } },
    }));
    const result = await applyContentPackage({
      payload: payload as never,
      user: { id: 1, roles: ["editor"], divisions: ["pr"] },
      pkg: {
        package: { version: 1 },
        collections: { faqs },
      },
    });

    expect(result.errors.some((e) => e.includes("exceeds max docs"))).toBe(
      true,
    );
    expect(calls).toEqual([]);
  });

  it("skips a doc when media filename is missing (no URL fetch)", async () => {
    const { applyContentPackage } =
      await import("../src/content-sync/apply-package");
    const creates: unknown[] = [];
    const payload = {
      find: async (args: { collection: string }) => {
        if (args.collection === "media") return { docs: [] };
        return { docs: [] };
      },
      create: async (args: unknown) => {
        creates.push(args);
        return { id: 1 };
      },
      update: async () => {
        throw new Error("unexpected update");
      },
      updateGlobal: async () => {
        throw new Error("unexpected updateGlobal");
      },
    };

    const result = await applyContentPackage({
      payload: payload as never,
      user: { id: 1, roles: ["editor"], divisions: ["partner"] },
      pkg: {
        package: { version: 1 },
        collections: {
          partners: [
            {
              name: "Acme",
              logo: { filename: "acme.svg" },
            },
          ],
        },
      },
    });

    expect(result.skipped.some((s) => s.includes("Acme"))).toBe(true);
    expect(
      result.errors.some((e) => e.includes("missing media filename")),
    ).toBe(true);
    expect(creates).toEqual([]);
  });

  it("writes a global as a draft with overrideAccess false", async () => {
    const { applyContentPackage } =
      await import("../src/content-sync/apply-package");
    const writes: Array<Record<string, unknown>> = [];
    const payload = {
      find: async () => ({ docs: [] }),
      findGlobal: async () => ({ title: "old" }),
      create: async () => {
        throw new Error("unexpected create");
      },
      update: async () => {
        throw new Error("unexpected update");
      },
      updateGlobal: async (args: Record<string, unknown>) => {
        writes.push(args);
        return args.data;
      },
    };

    const result = await applyContentPackage({
      payload: payload as never,
      user: { id: 1, roles: ["editor"], divisions: ["pr"] },
      pkg: {
        package: { version: 1 },
        globals: {
          "page-home": { heroTitle: "Hello" },
        },
      },
    });

    expect(result.errors).toEqual([]);
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      slug: "page-home",
      draft: true,
      overrideAccess: false,
    });
    expect((writes[0].data as { _status?: string })._status).toBe("draft");
  });
});
