import { describe, expect, it, vi } from "vitest";

import { DIVISIONS } from "../src/access/divisions";
import {
  resolveGoogleUser,
  type GoogleUserInfoClaims,
} from "../src/auth/google";
import {
  buildGroupMap,
  type MembershipResult,
} from "../src/auth/google-groups";

const DOMAIN = "example.com";
const groupMap = buildGroupMap("cms-", DOMAIN, DIVISIONS);

const claims = (
  overrides: Partial<GoogleUserInfoClaims> = {},
): GoogleUserInfoClaims => ({
  email: "alice@example.com",
  email_verified: true,
  hd: DOMAIN,
  ...overrides,
});

// memberOf: set of group emails the stub reports membership in.
const membershipStub =
  (memberOf: readonly string[]) =>
  async (groupKey: string): Promise<MembershipResult> =>
    memberOf.includes(groupKey) ? "member" : "not-member";

const resolve = (options: {
  claims?: GoogleUserInfoClaims;
  memberOf?: readonly string[];
  checkMembership?: (
    groupKey: string,
    memberKey: string,
  ) => Promise<MembershipResult>;
  warn?: (message: string) => void;
}) =>
  resolveGoogleUser({
    accessToken: "test-access-token",
    domain: DOMAIN,
    groupMap,
    fetchUserInfo: async () => options.claims ?? claims(),
    checkMembership:
      options.checkMembership ?? membershipStub(options.memberOf ?? []),
    warn: options.warn ?? (() => {}),
  });

describe("resolveGoogleUser", () => {
  it("rejects when the userinfo response has no email", async () => {
    await expect(
      resolve({ claims: claims({ email: undefined }) }),
    ).rejects.toThrow(/no email/);
  });

  it("rejects an unverified email", async () => {
    await expect(
      resolve({
        claims: claims({ email_verified: false }),
        memberOf: ["cms-it@example.com"],
      }),
    ).rejects.toThrow(/not verified/);
  });

  it('rejects a string "true" email_verified claim (strict boolean check)', async () => {
    await expect(
      resolve({
        claims: claims({ email_verified: "true" }),
        memberOf: ["cms-it@example.com"],
      }),
    ).rejects.toThrow(/not verified/);
  });

  it("rejects a login from the wrong Workspace domain", async () => {
    await expect(
      resolve({
        claims: claims({ hd: "attacker.example" }),
        memberOf: ["cms-it@example.com"],
      }),
    ).rejects.toThrow(/Workspace/);
  });

  it("rejects a consumer account with no hd claim", async () => {
    await expect(
      resolve({
        claims: claims({ hd: undefined }),
        memberOf: ["cms-it@example.com"],
      }),
    ).rejects.toThrow(/Workspace/);
  });

  it("rejects a user who is in no mapped group, before any user is created", async () => {
    await expect(resolve({ memberOf: [] })).rejects.toThrow(
      /no mapped Workspace group/,
    );
  });

  it("returns editor access with the division for a division group member", async () => {
    await expect(
      resolve({ memberOf: ["cms-partner@example.com"] }),
    ).resolves.toEqual({
      email: "alice@example.com",
      roles: ["editor"],
      divisions: ["partner"],
    });
  });

  it("returns the union of roles and divisions across groups", async () => {
    await expect(
      resolve({
        memberOf: [
          "cms-admins@example.com",
          "cms-pr@example.com",
          "cms-it@example.com",
        ],
      }),
    ).resolves.toEqual({
      email: "alice@example.com",
      roles: ["admin", "editor"],
      divisions: ["pr", "it"],
    });
  });

  it("checks every mapped group with the user's email", async () => {
    const checkMembership = vi.fn(membershipStub(["cms-it@example.com"]));
    await resolve({ checkMembership });
    expect(checkMembership).toHaveBeenCalledTimes(groupMap.size);
    for (const groupKey of groupMap.keys()) {
      expect(checkMembership).toHaveBeenCalledWith(
        groupKey,
        "alice@example.com",
      );
    }
  });

  it("fails closed when the Directory API errors (no role fallback)", async () => {
    await expect(
      resolve({
        checkMembership: async () => {
          throw new Error("Directory API unavailable");
        },
      }),
    ).rejects.toThrow(/Directory API unavailable/);
  });

  it("fails closed when the userinfo fetch itself fails", async () => {
    await expect(
      resolveGoogleUser({
        accessToken: "test-access-token",
        domain: DOMAIN,
        groupMap,
        fetchUserInfo: async () => {
          throw new Error("userinfo request failed");
        },
        checkMembership: membershipStub(["cms-it@example.com"]),
        warn: () => {},
      }),
    ).rejects.toThrow(/userinfo request failed/);
  });

  it("treats a nonexistent group as not-a-member but warns about it", async () => {
    const warn = vi.fn();
    const checkMembership = async (
      groupKey: string,
    ): Promise<MembershipResult> => {
      if (groupKey === "cms-chair@example.com") return "group-not-found";
      return groupKey === "cms-it@example.com" ? "member" : "not-member";
    };
    await expect(resolve({ checkMembership, warn })).resolves.toEqual({
      email: "alice@example.com",
      roles: ["editor"],
      divisions: ["it"],
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("cms-chair@example.com");
  });

  it("still rejects when the only 'membership' signal is a missing group", async () => {
    const warn = vi.fn();
    await expect(
      resolve({ checkMembership: async () => "group-not-found", warn }),
    ).rejects.toThrow(/no mapped Workspace group/);
    expect(warn).toHaveBeenCalledTimes(groupMap.size);
  });
});
