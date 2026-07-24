import { describe, expect, it } from "vitest";

import { DIVISIONS } from "../src/access/divisions";
import {
  buildGroupMap,
  deriveAccess,
  parseGroupMap,
} from "../src/auth/google-groups";

const DOMAIN = "example.com";

describe("parseGroupMap", () => {
  it("parses a valid explicit mapping and dedupes grants", () => {
    const map = parseGroupMap(
      JSON.stringify({
        "board@example.com": { roles: ["admin", "approver", "admin"] },
        "web-team@example.com": {
          roles: ["editor"],
          divisions: ["it", "pr", "it"],
        },
        "pr-extra@example.com": { divisions: ["pr"] },
      }),
    );
    expect(map.size).toBe(3);
    expect(map.get("board@example.com")).toEqual({
      roles: ["admin", "approver"],
      divisions: [],
    });
    expect(map.get("web-team@example.com")).toEqual({
      roles: ["editor"],
      divisions: ["it", "pr"],
    });
    // Divisions-only entries are allowed; they compose with a role granted by
    // another group but never allow sign-in by themselves (resolveGoogleUser
    // requires at least one role).
    expect(map.get("pr-extra@example.com")).toEqual({
      roles: [],
      divisions: ["pr"],
    });
  });

  it("rejects malformed JSON", () => {
    expect(() => parseGroupMap("{not json")).toThrow(/not valid JSON/);
  });

  it("rejects non-object shapes", () => {
    expect(() => parseGroupMap('["a@example.com"]')).toThrow(/JSON object/);
    expect(() => parseGroupMap('{"a@example.com": ["admin"]}')).toThrow(
      /must be an object/,
    );
  });

  it("rejects keys that are not group emails", () => {
    expect(() => parseGroupMap('{"admins": {"roles": ["admin"]}}')).toThrow(
      /not a group email/,
    );
  });

  it("rejects unknown roles and unknown divisions", () => {
    expect(() =>
      parseGroupMap('{"a@example.com": {"roles": ["superuser"]}}'),
    ).toThrow(/unknown role "superuser"/);
    expect(() =>
      parseGroupMap(
        '{"a@example.com": {"roles": ["admin"]}, "b@example.com": {"roles": ["editor"], "divisions": ["marketing"]}}',
      ),
    ).toThrow(/unknown division "marketing"/);
  });

  it("rejects entries that grant nothing and empty maps", () => {
    expect(() =>
      parseGroupMap(
        '{"a@example.com": {"roles": ["admin"]}, "b@example.com": {}}',
      ),
    ).toThrow(/grants nothing/);
    expect(() => parseGroupMap("{}")).toThrow(/no groups at all/);
  });

  it("rejects a mapping in which no group grants admin", () => {
    expect(() =>
      parseGroupMap(
        '{"a@example.com": {"roles": ["editor"], "divisions": ["it"]}}',
      ),
    ).toThrow(/no group grants the admin role/);
  });
});

describe("buildGroupMap", () => {
  it("maps admins, approvers, and one group per division", () => {
    const map = buildGroupMap("cms-", DOMAIN, DIVISIONS);
    // 2 role groups + 7 division groups.
    expect(map.size).toBe(2 + DIVISIONS.length);
    expect(map.get("cms-admins@example.com")).toEqual({
      roles: ["admin"],
      divisions: [],
    });
    expect(map.get("cms-approvers@example.com")).toEqual({
      roles: ["approver"],
      divisions: [],
    });
    for (const { value } of DIVISIONS) {
      expect(map.get(`cms-${value}@example.com`)).toEqual({
        roles: ["editor"],
        divisions: [value],
      });
    }
  });

  it("covers all seven known divisions by group email", () => {
    const map = buildGroupMap("cms-", DOMAIN, DIVISIONS);
    for (const division of [
      "chair",
      "pr",
      "partner",
      "finance",
      "operations",
      "concept",
      "it",
    ]) {
      expect(map.has(`cms-${division}@example.com`)).toBe(true);
    }
  });

  it("honors a custom prefix", () => {
    const map = buildGroupMap("web-", DOMAIN, DIVISIONS);
    expect(map.get("web-admins@example.com")).toEqual({
      roles: ["admin"],
      divisions: [],
    });
    expect(map.get("web-it@example.com")).toEqual({
      roles: ["editor"],
      divisions: ["it"],
    });
    expect(map.has("cms-admins@example.com")).toBe(false);
  });
});

describe("deriveAccess", () => {
  const map = buildGroupMap("cms-", DOMAIN, DIVISIONS);
  const group = (email: string) => {
    const access = map.get(email);
    if (!access) throw new Error(`missing group ${email}`);
    return access;
  };

  it("returns empty access for no memberships", () => {
    expect(deriveAccess([])).toEqual({ roles: [], divisions: [] });
  });

  it("grants admin with no division from the admins group", () => {
    expect(deriveAccess([group("cms-admins@example.com")])).toEqual({
      roles: ["admin"],
      divisions: [],
    });
  });

  it("grants approver with no division from the approvers group", () => {
    expect(deriveAccess([group("cms-approvers@example.com")])).toEqual({
      roles: ["approver"],
      divisions: [],
    });
  });

  it("grants editor plus the division for a division group", () => {
    expect(deriveAccess([group("cms-partner@example.com")])).toEqual({
      roles: ["editor"],
      divisions: ["partner"],
    });
  });

  it("unions roles and divisions across groups", () => {
    expect(
      deriveAccess([
        group("cms-approvers@example.com"),
        group("cms-pr@example.com"),
        group("cms-it@example.com"),
      ]),
    ).toEqual({
      roles: ["approver", "editor"],
      divisions: ["pr", "it"],
    });
  });

  it("deduplicates the editor role across multiple division groups", () => {
    const access = deriveAccess([
      group("cms-finance@example.com"),
      group("cms-chair@example.com"),
    ]);
    expect(access.roles).toEqual(["editor"]);
    expect(access.divisions).toEqual(["finance", "chair"]);
  });

  it("unions all three roles when every role group is held", () => {
    expect(
      deriveAccess([
        group("cms-admins@example.com"),
        group("cms-approvers@example.com"),
        group("cms-operations@example.com"),
        group("cms-concept@example.com"),
      ]),
    ).toEqual({
      roles: ["admin", "approver", "editor"],
      divisions: ["operations", "concept"],
    });
  });
});
