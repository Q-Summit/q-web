import type {
  Access,
  CollectionBeforeChangeHook,
  Field,
  FieldAccess,
  GlobalBeforeChangeHook,
} from "payload";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  divisionScoped,
  divisionsField,
  isHead,
  readOwnDrafts,
  requireAdminToPublishGlobal,
  requireApproverToPublish,
  requireApproverToPublishGlobal,
  rolesField,
} from "../src/access";
import { hasRole, inDivision } from "../src/access/divisions";
import { draftCollection } from "../src/collections/base";
import { pageGlobal } from "../src/globals/base";
import { Legal } from "../src/globals/Legal";
import { SiteSettings } from "../src/globals/SiteSettings";

// The approver gate is a beforeChange hook. We call it directly with mock args
// (no database) to prove it decides on the RESULTING published state, using
// both the incoming data and the existing document. The regression this locks
// down: a direct REST/GraphQL/Local API update to an already-published doc that
// omits _status must NOT let a non-approver edit the live version.
type GateArgs = Parameters<CollectionBeforeChangeHook>[0];

const editor = { roles: ["editor"], divisions: ["pr"] };
const approver = { roles: ["approver"] };
const admin = { roles: ["admin"] };

/**
 * `req` extras that tell the gate a write is a DRAFT write rather than a write
 * to the live row. Payload does not pass its `draft` argument into
 * beforeChange, so the gate reads these instead (see lib/publish-state.ts).
 *   - `SAVE_DRAFT`  what the admin UI / REST send on "Save draft" (?draft=true)
 *   - `SYNC_DRAFT`  what content-sync sets, since the Local API has no query
 *   - `{}`          a bare write to the live row: bulk Unpublish, or a plain
 *                   PATCH {"_status":"draft"} with no ?draft=true
 */
const SAVE_DRAFT = { query: { draft: "true" } };
const SYNC_DRAFT = { context: { contentSync: true } };

/**
 * Fake req.payload.db so the gate can read the LIVE row.
 *
 * `live` is what the main table holds, which is NOT what Payload hands the
 * hook as `originalDoc` (that is the latest VERSION, and a pending draft is
 * the latest version). Modelling the two separately is the entire point: the
 * previous gate compared against originalDoc and so stopped firing exactly
 * when a document was published AND had a pending draft.
 */
function dbFor(live: string | null | "throw") {
  const row = live === null ? null : { _status: live };
  const fail = () => {
    throw new Error("db unavailable");
  };
  return {
    findOne: live === "throw" ? fail : async () => row,
    findGlobal: live === "throw" ? fail : async () => row,
  };
}

function gate(
  user: unknown,
  data: unknown,
  originalDoc: unknown,
  reqExtras: Record<string, unknown> = {},
  live: string | null | "throw" = "published",
) {
  return () =>
    requireApproverToPublish({
      collection: { slug: "partners" },
      data,
      originalDoc: { id: 1, ...(originalDoc as object | null) },
      req: {
        user,
        payloadAPI: "REST",
        payload: { db: dbFor(live) },
        ...reqExtras,
      },
    } as unknown as GateArgs);
}

type AccessArgs = Parameters<Access>[0];
type FieldAccessArgs = Parameters<FieldAccess>[0];

// The division read/write helpers are curried Access factories. Call the
// returned function with a mock req to see the decision for a given user.
function grants(fn: Access, user: unknown) {
  return fn({ req: { user } } as unknown as AccessArgs);
}

// Invoke a field's update-access rule directly with a mock req.
function fieldUpdate(field: Field, user: unknown) {
  const access = (field as { access?: { update?: FieldAccess } }).access;
  return access?.update?.({ req: { user } } as unknown as FieldAccessArgs);
}

// The published-only Where clause the read helpers return when a request may
// not see drafts (the anonymous site build, or an out-of-division editor).
const publishedOnly = { _status: { equals: "published" } };

describe("requireApproverToPublish", () => {
  it("blocks an editor publishing a draft", async () => {
    await expect(
      gate(editor, { _status: "published" }, undefined)(),
    ).rejects.toThrow(/Heads and Admins/i);
  });

  it("blocks an editor updating an already-published doc without _status (the bypass)", async () => {
    await expect(
      gate(editor, { title: "edited" }, { _status: "published" })(),
    ).rejects.toThrow(/Heads and Admins/i);
  });

  it("blocks an editor re-publishing a published doc", async () => {
    await expect(
      gate(editor, { _status: "published" }, { _status: "published" })(),
    ).rejects.toThrow(/Heads and Admins/i);
  });

  it("allows an editor saving a draft of a published doc", async () => {
    await expect(
      gate(
        editor,
        { _status: "draft", title: "wip" },
        { _status: "published" },
        SAVE_DRAFT,
      )(),
    ).resolves.toBeDefined();
  });

  it("blocks an editor bulk-publishing (?draft=true with _status published)", async () => {
    // PublishMany's request shape: the draft query flag must not soften the
    // publish 403.
    await expect(
      gate(
        editor,
        { _status: "published" },
        { _status: "draft" },
        SAVE_DRAFT,
      )(),
    ).rejects.toThrow(/Heads and Admins/i);
  });

  it("allows an editor's Restore as draft (server-set restore marker)", async () => {
    // Restore-as-draft carries the restored version's _status: "published"
    // through beforeChange but only writes a version row; with the marker it
    // is the same act as Propose for review.
    await expect(
      gate(
        editor,
        { _status: "published", title: "old copy" },
        { _status: "published" },
        {
          query: { draft: "true" },
          context: { collectionRestoreVersion: true },
        },
      )(),
    ).resolves.toBeDefined();
  });

  it("still blocks an editor's full restore (marker without draft flag)", async () => {
    // Restore with ?draft=false republishes the old version onto the live
    // row; the marker alone must not open the gate.
    await expect(
      gate(
        editor,
        { _status: "published", title: "old copy" },
        { _status: "published" },
        { query: {}, context: { collectionRestoreVersion: true } },
      )(),
    ).rejects.toThrow(/Heads and Admins/i);
  });

  // The unpublish direction. Same data/originalDoc shape as the draft save
  // above, so the ONLY thing separating them is the draft marker on req.
  it("blocks an editor unpublishing a live doc (bulk Unpublish / bare PATCH _status:draft)", async () => {
    await expect(
      gate(editor, { _status: "draft" }, { _status: "published" })(),
    ).rejects.toThrow(/unpublish live content/i);
  });

  it("blocks an editor restoring an old draft version onto a live doc", async () => {
    // restoreVersion runs the same beforeChange hooks with the restored
    // version's data, and its access check calls access.update with `data`
    // undefined, so divisionScoped alone lets it through.
    await expect(
      gate(
        editor,
        { _status: "draft", title: "old revision" },
        { _status: "published" },
      )(),
    ).rejects.toThrow(/unpublish live content/i);
  });

  it("allows content-sync to propose a draft over a live doc (make propose)", async () => {
    await expect(
      gate(
        editor,
        { _status: "draft", title: "proposed" },
        { _status: "published" },
        SYNC_DRAFT,
      )(),
    ).resolves.toBeDefined();
  });

  // THE REGRESSION THAT DEFEATED THE FIRST VERSION OF THIS GATE.
  // Payload hands beforeChange the LATEST VERSION as originalDoc, not the live
  // row (getLatestCollectionVersion with no `published` flag; drizzle stamps
  // every version `latest: true`). So on a published doc that has a pending
  // draft -- the state "Propose for review" and `make propose` both create --
  // originalDoc._status reads "draft" even though the document is live. The
  // old rule compared against that and silently allowed the unpublish.
  it("blocks an editor unpublishing a live doc that has a PENDING DRAFT (originalDoc reads draft)", async () => {
    await expect(
      gate(
        editor,
        { _status: "draft" },
        { _status: "draft" },
        {},
        "published",
      )(),
    ).rejects.toThrow(/unpublish live content/i);
  });

  it("blocks the same write when it arrives as a version restore", async () => {
    await expect(
      gate(
        editor,
        { _status: "draft", title: "old revision" },
        { _status: "draft" },
        {},
        "published",
      )(),
    ).rejects.toThrow(/unpublish live content/i);
  });

  // GraphQL takes its `draft` as a mutation argument, so a `?draft=true` query
  // string there does NOT mean the write is version-only: it would still hit
  // the live row. Only REST may be trusted with that marker.
  it("ignores ?draft=true on GraphQL, where it does not imply a version-only write", async () => {
    await expect(
      gate(
        editor,
        { _status: "draft" },
        { _status: "draft" },
        { payloadAPI: "GraphQL", query: { draft: "true" } },
        "published",
      )(),
    ).rejects.toThrow(/unpublish live content/i);
  });

  it("still allows a real draft save on a live doc that has a pending draft", async () => {
    await expect(
      gate(
        editor,
        { _status: "draft" },
        { _status: "draft" },
        SAVE_DRAFT,
        "published",
      )(),
    ).resolves.toBeDefined();
  });

  it("allows an editor to keep editing a doc that was never published", async () => {
    await expect(
      gate(editor, { _status: "draft" }, { _status: "draft" }, {}, "draft")(),
    ).resolves.toBeDefined();
  });

  // An unreadable live row must not be read as "not published".
  it("fails closed when the live row cannot be read", async () => {
    await expect(
      gate(editor, { _status: "draft" }, { _status: "draft" }, {}, "throw")(),
    ).rejects.toThrow(/unpublish live content/i);
  });

  it("allows a head to unpublish a live doc", async () => {
    await expect(
      gate(approver, { _status: "draft" }, { _status: "published" })(),
    ).resolves.toBeDefined();
  });

  it("allows an admin to unpublish a live doc", async () => {
    await expect(
      gate(admin, { _status: "draft" }, { _status: "published" })(),
    ).resolves.toBeDefined();
  });

  it("allows an editor creating a new draft", async () => {
    await expect(
      gate(editor, { _status: "draft" }, undefined, {}, null)(),
    ).resolves.toBeDefined();
  });

  it("allows an editor editing a doc that was never published", async () => {
    await expect(
      gate(editor, { title: "wip" }, { _status: "draft" }, {}, "draft")(),
    ).resolves.toBeDefined();
  });

  // The publish-side twin of the pending-draft hole. A bare PATCH with NO
  // _status and no ?draft=true writes the live row, and originalDoc reads
  // "draft" because the pending draft is the latest version -- so a rule keyed
  // off originalDoc waved this through. Two ordinary requests (propose, then
  // this) let an editor rewrite live copy with no Head involved.
  it("blocks an editor editing a LIVE doc that has a pending draft (no _status, no draft flag)", async () => {
    await expect(
      gate(editor, { title: "pwned" }, { _status: "draft" }, {}, "published")(),
    ).rejects.toThrow(/change live content/i);
  });

  it("blocks the same edit on a live doc with no pending draft", async () => {
    await expect(
      gate(
        editor,
        { title: "pwned" },
        { _status: "published" },
        {},
        "published",
      )(),
    ).rejects.toThrow(/change live content/i);
  });

  it("allows an approver publishing", async () => {
    await expect(
      gate(approver, { _status: "published" }, undefined)(),
    ).resolves.toBeDefined();
  });

  it("allows an approver editing a live doc without _status", async () => {
    await expect(
      gate(approver, { title: "edited" }, { _status: "published" })(),
    ).resolves.toBeDefined();
  });

  it("allows an admin publishing", async () => {
    await expect(
      gate(admin, { _status: "published" }, undefined)(),
    ).resolves.toBeDefined();
  });

  it("blocks an editor with a clear Heads/Admins message", async () => {
    await expect(
      gate(editor, { _status: "published" }, undefined)(),
    ).rejects.toThrow(/Heads and Admins/i);
  });
});

// The global-shaped publish gates share the same core rule as the collection
// hook above but carry the GlobalBeforeChangeHook signature (wired via
// globals/base.ts and globals/Legal.ts). requireApproverToPublishGlobal lets
// Heads/admins publish; requireAdminToPublishGlobal (Legal) narrows publish to
// admins only, with a Legal-specific message.
type GlobalGateArgs = Parameters<GlobalBeforeChangeHook>[0];

function gateGlobal(
  hook: GlobalBeforeChangeHook,
  user: unknown,
  data: unknown,
  originalDoc: unknown,
  reqExtras: Record<string, unknown> = {},
  live: string | null | "throw" = "published",
) {
  return () =>
    hook({
      data,
      global: { slug: "page-home" },
      originalDoc,
      req: {
        user,
        payloadAPI: "REST",
        payload: { db: dbFor(live) },
        ...reqExtras,
      },
    } as unknown as GlobalGateArgs);
}

describe("requireApproverToPublishGlobal", () => {
  it("blocks an editor publishing a global", async () => {
    await expect(
      gateGlobal(
        requireApproverToPublishGlobal,
        editor,
        { _status: "published" },
        undefined,
      )(),
    ).rejects.toThrow(/Heads and Admins/i);
  });

  it("allows an approver publishing a global", async () => {
    await expect(
      gateGlobal(
        requireApproverToPublishGlobal,
        approver,
        { _status: "published" },
        undefined,
      )(),
    ).resolves.toBeDefined();
  });

  it("allows an editor saving a draft of a global", async () => {
    await expect(
      gateGlobal(
        requireApproverToPublishGlobal,
        editor,
        { _status: "draft" },
        undefined,
        {},
        null,
      )(),
    ).resolves.toBeDefined();
  });

  // A page global going dark takes a whole route down on the next build.
  it("blocks an editor unpublishing a live global", async () => {
    await expect(
      gateGlobal(
        requireApproverToPublishGlobal,
        editor,
        { _status: "draft" },
        { _status: "published" },
      )(),
    ).rejects.toThrow(/unpublish live content/i);
  });

  it("allows an editor saving a draft of a live global via the admin UI", async () => {
    await expect(
      gateGlobal(
        requireApproverToPublishGlobal,
        editor,
        { _status: "draft" },
        { _status: "published" },
        SAVE_DRAFT,
      )(),
    ).resolves.toBeDefined();
  });
});

describe("requireAdminToPublishGlobal (Legal)", () => {
  it("rejects an approver (non-admin) publishing with the Legal-specific message", async () => {
    await expect(
      gateGlobal(
        requireAdminToPublishGlobal,
        approver,
        { _status: "published" },
        undefined,
      )(),
    ).rejects.toThrow(/Only admins can publish Legal/i);
  });

  it("also blocks an approver editing an already-live global without _status", async () => {
    await expect(
      gateGlobal(
        requireAdminToPublishGlobal,
        approver,
        { title: "edited" },
        { _status: "published" },
      )(),
    ).rejects.toThrow(/Only admins can change live Legal text/i);
  });

  it("allows an admin publishing", async () => {
    await expect(
      gateGlobal(
        requireAdminToPublishGlobal,
        admin,
        { _status: "published" },
        undefined,
      )(),
    ).resolves.toBeDefined();
  });

  it("allows an editor saving a draft of Legal", async () => {
    await expect(
      gateGlobal(
        requireAdminToPublishGlobal,
        editor,
        { _status: "draft" },
        undefined,
        {},
        null,
      )(),
    ).resolves.toBeDefined();
  });

  it("blocks an approver unpublishing live Legal text", async () => {
    await expect(
      gateGlobal(
        requireAdminToPublishGlobal,
        approver,
        { _status: "draft" },
        { _status: "published" },
      )(),
    ).rejects.toThrow(/Only admins can unpublish Legal/i);
  });
});

describe("isHead", () => {
  it("is true for head (approver role) and admin, false otherwise", async () => {
    expect(isHead(approver)).toBe(true);
    expect(isHead(admin)).toBe(true);
    expect(isHead(editor)).toBe(false);
    expect(isHead(null)).toBe(false);
  });
});

describe("divisionScoped (write access)", () => {
  it("grants an editor write access within their own division", async () => {
    expect(grants(divisionScoped("pr"), editor)).toBe(true);
  });

  it("denies an editor write access outside their division", async () => {
    expect(grants(divisionScoped("finance"), editor)).toBe(false);
  });

  it("denies an editor when the write would publish (hides Publish button)", async () => {
    const fn = divisionScoped("pr");
    expect(
      fn({
        req: { user: editor },
        data: { _status: "published" },
      } as unknown as AccessArgs),
    ).toBe(false);
  });

  it("allows an editor proposing a draft (_status draft)", async () => {
    const fn = divisionScoped("pr");
    expect(
      fn({
        req: { user: editor },
        data: { _status: "draft" },
      } as unknown as AccessArgs),
    ).toBe(true);
  });

  it("grants a head write access across divisions (for review/publish)", async () => {
    expect(grants(divisionScoped("pr"), approver)).toBe(true);
    expect(grants(divisionScoped("finance"), approver)).toBe(true);
  });

  it("allows a head to publish (_status published)", async () => {
    const fn = divisionScoped("pr");
    expect(
      fn({
        req: { user: approver },
        data: { _status: "published" },
      } as unknown as AccessArgs),
    ).toBe(true);
  });

  it("grants an admin write access regardless of divisions", async () => {
    expect(grants(divisionScoped("pr"), admin)).toBe(true);
    expect(grants(divisionScoped("finance"), admin)).toBe(true);
  });

  it("denies an anonymous request", async () => {
    expect(grants(divisionScoped("pr"), null)).toBe(false);
  });
});

describe("hasRole and inDivision", () => {
  it("hasRole reads the roles array and is false for anonymous", async () => {
    expect(hasRole(editor, "editor")).toBe(true);
    expect(hasRole(editor, "admin")).toBe(false);
    expect(hasRole(admin, "admin")).toBe(true);
    expect(hasRole(null, "editor")).toBe(false);
  });

  it("inDivision matches any overlapping division and is false for anonymous", async () => {
    expect(inDivision(editor, ["pr"])).toBe(true);
    expect(inDivision(editor, ["finance"])).toBe(false);
    expect(inDivision(admin, ["pr"])).toBe(false); // admins carry no divisions
    expect(inDivision(null, ["pr"])).toBe(false);
  });
});

describe("readOwnDrafts (read access)", () => {
  it("returns a published-only clause for anonymous readers", async () => {
    expect(grants(readOwnDrafts("pr"), null)).toEqual(publishedOnly);
  });

  it("returns a published-only clause for an editor outside the division", async () => {
    expect(grants(readOwnDrafts("finance"), editor)).toEqual(publishedOnly);
  });

  it("grants full read to an editor within the division", async () => {
    expect(grants(readOwnDrafts("pr"), editor)).toBe(true);
  });

  it("grants full read to an approver across divisions", async () => {
    expect(grants(readOwnDrafts("finance"), approver)).toBe(true);
  });

  it("grants full read to an admin across divisions", async () => {
    expect(grants(readOwnDrafts("finance"), admin)).toBe(true);
  });
});

describe("rolesField and divisionsField update access (self-escalation guard)", () => {
  // The rule keys only off req.user's role, so a non-admin editing anyone's
  // account (including their own roles or divisions) is denied.
  it("denies a non-admin editor changing roles or divisions", async () => {
    expect(fieldUpdate(rolesField, editor)).toBe(false);
    expect(fieldUpdate(divisionsField, editor)).toBe(false);
  });

  it("denies an approver changing roles or divisions", async () => {
    expect(fieldUpdate(rolesField, approver)).toBe(false);
    expect(fieldUpdate(divisionsField, approver)).toBe(false);
  });

  it("denies an anonymous request", async () => {
    expect(fieldUpdate(rolesField, null)).toBe(false);
    expect(fieldUpdate(divisionsField, null)).toBe(false);
  });

  it("allows an admin to change roles and divisions", async () => {
    expect(fieldUpdate(rolesField, admin)).toBe(true);
    expect(fieldUpdate(divisionsField, admin)).toBe(true);
  });
});

// Leaving `access.readVersions` unset is the dangerous default: Payload then
// grants version reads to ANY authenticated user, which hands every editor the
// unpublished drafts of every other division (and, on Legal, counsel-reviewed
// text that `read` restricts to admins). These assertions pin the shared
// factories so a new collection or global cannot reintroduce the gap by
// omission, which is exactly how it happened the first time.
describe("readVersions is defined wherever drafts are enabled", () => {
  const sampleCollection = draftCollection({
    slug: "sample",
    divisions: ["pr"],
    useAsTitle: "name",
    defaultColumns: ["name"],
    description: "fixture for the access-shape assertions",
    fields: [{ name: "name", type: "text" }],
  });

  const samplePageGlobal = pageGlobal({
    slug: "page-sample",
    label: "Sample",
    path: "/sample/",
    ownedBy: "PR",
    divisions: ["pr"],
    fields: [{ name: "heading", type: "text" }],
  });

  const cases: [
    string,
    { versions?: unknown; access?: Record<string, unknown> },
  ][] = [
    ["draftCollection()", sampleCollection],
    ["pageGlobal()", samplePageGlobal],
    ["Legal", Legal],
    ["SiteSettings", SiteSettings],
  ];

  for (const [label, config] of cases) {
    it(`${label} enables drafts and defines readVersions`, () => {
      expect(config.versions).toBeTruthy();
      expect(typeof config.access?.readVersions).toBe("function");
    });

    it(`${label} denies version reads to an anonymous request`, () => {
      const readVersions = config.access?.readVersions as Access;
      expect(grants(readVersions, null)).toBe(false);
    });
  }

  it("scopes collection version reads to the owning division", async () => {
    const readVersions = sampleCollection.access?.readVersions as Access;
    expect(grants(readVersions, editor)).toBe(true);
    expect(
      grants(readVersions, { roles: ["editor"], divisions: ["finance"] }),
    ).toBe(false);
    expect(grants(readVersions, approver)).toBe(true);
    expect(grants(readVersions, admin)).toBe(true);
  });

  it("restricts Legal version reads to admins", async () => {
    const readVersions = Legal.access?.readVersions as Access;
    expect(grants(readVersions, editor)).toBe(false);
    expect(grants(readVersions, approver)).toBe(false);
    expect(grants(readVersions, admin)).toBe(true);
  });
});

// Both production hardening switches (cookies.secure, disableLocalStrategy)
// key off NODE_ENV, so a runtime that starts without it loses both silently.
// VERCEL_ENV is set by the platform and cannot be forgotten the same way.
describe("assertProductionHardening", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function stubVercelProductionCutoverKeys() {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CMS_SERVER_URL", "https://cms.example.com");
    vi.stubEnv("SITE_URL", "https://example.com");
    vi.stubEnv("CONTENT_SYNC_TOKEN", "test-token-value-32chars-long!!");
    vi.stubEnv(
      "CLOUDFLARE_DEPLOY_HOOK_URL",
      "https://api.cloudflare.com/hooks/test",
    );
    vi.stubEnv("S3_BUCKET", "qweb-media");
    vi.stubEnv("S3_ENDPOINT", "https://example.r2.cloudflarestorage.com");
    vi.stubEnv("S3_ACCESS_KEY_ID", "test-access-key");
    vi.stubEnv("S3_SECRET_ACCESS_KEY", "test-secret-key");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv("GOOGLE_WORKSPACE_DOMAIN", "q-summit.com");
    vi.stubEnv("GOOGLE_SA_CLIENT_EMAIL", "sa@example.iam.gserviceaccount.com");
    vi.stubEnv(
      "GOOGLE_SA_PRIVATE_KEY",
      "-----BEGIN PRIVATE KEY-----\\nTEST\\n-----END PRIVATE KEY-----\\n",
    );
  }

  it("refuses to boot when Vercel says production but NODE_ENV does not", async () => {
    const { assertProductionHardening } =
      await import("../src/lib/require-env");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "development");
    expect(() => assertProductionHardening()).toThrow(/Refusing to boot/i);
  });

  it("allows a matching production runtime when cutover keys are set", async () => {
    const { assertProductionHardening } =
      await import("../src/lib/require-env");
    stubVercelProductionCutoverKeys();
    expect(() => assertProductionHardening()).not.toThrow();
  });

  it("refuses Vercel production when CLOUDFLARE_DEPLOY_HOOK_URL is missing", async () => {
    const { assertProductionHardening } =
      await import("../src/lib/require-env");
    stubVercelProductionCutoverKeys();
    vi.stubEnv("CLOUDFLARE_DEPLOY_HOOK_URL", "");
    expect(() => assertProductionHardening()).toThrow(
      /CLOUDFLARE_DEPLOY_HOOK_URL/,
    );
  });

  it("refuses Vercel production when S3_BUCKET is missing", async () => {
    const { assertProductionHardening } =
      await import("../src/lib/require-env");
    stubVercelProductionCutoverKeys();
    vi.stubEnv("S3_BUCKET", "");
    expect(() => assertProductionHardening()).toThrow(/S3_BUCKET/);
  });

  it("refuses Vercel production when Google SSO keys are missing", async () => {
    const { assertProductionHardening } =
      await import("../src/lib/require-env");
    stubVercelProductionCutoverKeys();
    vi.stubEnv("GOOGLE_CLIENT_ID", "");
    expect(() => assertProductionHardening()).toThrow(/GOOGLE_CLIENT_ID/);
  });

  it("stays out of the way for preview and local", async () => {
    const { assertProductionHardening } =
      await import("../src/lib/require-env");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NODE_ENV", "development");
    expect(() => assertProductionHardening()).not.toThrow();
    vi.stubEnv("VERCEL_ENV", "");
    expect(() => assertProductionHardening()).not.toThrow();
  });
});
