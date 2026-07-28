// Google Workspace SSO for the admin (payload-oauth2). Enabled iff
// GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are both set; local dev sets
// neither and keeps the seeded password accounts. Workspace groups are the
// source of truth for roles/divisions: getUserInfo runs on EVERY login,
// before any user create/update, and its return value is persisted onto the
// user doc, so access re-syncs each login and a throw rejects the login with
// no user written. Setup runbook: docs/dev/go-live.md.
import type { AuthStrategy, PayloadRequest, Plugin } from "payload";
import { OAuth2Plugin } from "payload-oauth2";

import { DIVISIONS, type Division, type Role } from "../access/divisions";
import { requireEnv } from "../lib/require-env";
import {
  buildGroupMap,
  createMembershipLookup,
  deriveAccess,
  parseGroupMap,
  type GroupAccess,
  type MembershipLookup,
} from "./google-groups";

/** Claims from https://www.googleapis.com/oauth2/v3/userinfo (unknown until checked). */
export type GoogleUserInfoClaims = {
  email?: unknown;
  email_verified?: unknown;
  hd?: unknown;
};

export type FetchUserInfo = (
  accessToken: string,
) => Promise<GoogleUserInfoClaims>;

export const fetchGoogleUserInfo: FetchUserInfo = async (accessToken) => {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Google userinfo request failed with status ${response.status}.`,
    );
  }
  return (await response.json()) as GoogleUserInfoClaims;
};

/**
 * Core of the plugin's getUserInfo, with the two network dependencies
 * (userinfo fetch, Directory membership lookup) injected so tests stub them.
 * Throws to reject the login: unverified email, wrong Workspace domain, no
 * mapped group, or any Directory API failure (fail closed, no role fallback).
 */
export const resolveGoogleUser = async (options: {
  accessToken: string;
  domain: string;
  groupMap: ReadonlyMap<string, GroupAccess>;
  fetchUserInfo: FetchUserInfo;
  checkMembership: MembershipLookup;
  warn: (message: string) => void;
}): Promise<{ email: string; roles: Role[]; divisions: Division[] }> => {
  const claims = await options.fetchUserInfo(options.accessToken);
  const email = typeof claims.email === "string" ? claims.email : "";
  if (!email) {
    throw new Error(
      "Google login rejected: userinfo response carried no email.",
    );
  }
  if (claims.email_verified !== true) {
    throw new Error(
      `Google login rejected for ${email}: email is not verified.`,
    );
  }
  if (claims.hd !== options.domain) {
    throw new Error(
      `Google login rejected for ${email}: account is not in the ${options.domain} Workspace.`,
    );
  }
  // All group checks fire in parallel (9 groups today). Any rejection
  // propagates and fails the login closed.
  const groups = [...options.groupMap.entries()];
  const results = await Promise.all(
    groups.map(([groupKey]) => options.checkMembership(groupKey, email)),
  );
  const memberships: GroupAccess[] = [];
  results.forEach((result, index) => {
    const [groupKey, access] = groups[index] as [string, GroupAccess];
    if (result === "group-not-found") {
      options.warn(
        `Google group ${groupKey} does not exist (hasMember returned 404); treated as not-a-member. Check GOOGLE_GROUP_PREFIX and the Workspace groups.`,
      );
    } else if (result === "member") {
      memberships.push(access);
    }
  });
  const access = deriveAccess(memberships);
  if (access.roles.length === 0) {
    throw new Error(
      `Google login rejected for ${email}: user is in no mapped Workspace group.`,
    );
  }
  return { email, roles: access.roles, divisions: access.divisions };
};

/**
 * Credential material that must never reach the browser. The plugin's auth
 * strategy loads the user with showHiddenFields: true (it needs the session
 * list) and returns that doc as req.user, which the admin serializes into
 * every page's client payload. Observed leak: salt, hash, and reset tokens
 * of the logged-in user embedded in the dashboard HTML. Stripped here, at
 * the only place the hidden fields enter a request.
 */
const CREDENTIAL_FIELDS = [
  "salt",
  "hash",
  "resetPasswordToken",
  "resetPasswordExpiration",
] as const;

/** Wrap the plugin's strategy so its req.user never carries credentials. */
export const stripCredentialFields = (strategy: AuthStrategy): void => {
  const authenticate = strategy.authenticate;
  strategy.authenticate = async (args) => {
    const result = await authenticate(args);
    if (result.user) {
      for (const field of CREDENTIAL_FIELDS) {
        delete (result.user as unknown as Record<string, unknown>)[field];
      }
    }
    return result;
  };
};

/**
 * Configured payload-oauth2 plugin for the users collection. Login entry
 * point: GET /api/users/oauth/google; callback (register this redirect URI in
 * the Google Cloud console): <CMS_SERVER_URL>/api/users/oauth/google/callback.
 * Success lands on / (admin root); failure on /login. When the OAuth client
 * env is absent the plugin is a no-op.
 */
export const googleOAuthPlugin = (options: { serverURL: string }): Plugin => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return (config) => config;
  }
  // Google login is on: the remaining Workspace env is required. Fail fast at
  // config time (same posture as requireEnv for DATABASE_URI).
  const domain = requireEnv("GOOGLE_WORKSPACE_DOMAIN");
  const prefix = process.env.GOOGLE_GROUP_PREFIX || "cms-";
  // GOOGLE_GROUP_MAP (JSON, validated fail-fast) replaces the naming
  // convention when set, so the groups are adjustable without a code change.
  const groupMap = process.env.GOOGLE_GROUP_MAP
    ? parseGroupMap(process.env.GOOGLE_GROUP_MAP)
    : buildGroupMap(prefix, domain, DIVISIONS);
  const checkMembership = createMembershipLookup({
    clientEmail: requireEnv("GOOGLE_SA_CLIENT_EMAIL"),
    // The PEM is stored with escaped newlines in the env dashboard.
    privateKey: requireEnv("GOOGLE_SA_PRIVATE_KEY").replace(/\\n/g, "\n"),
  });
  const plugin = OAuth2Plugin({
    enabled: true,
    strategyName: "google",
    useEmailAsIdentity: true,
    // JIT provisioning: first login creates the account; roles/divisions come
    // from the getUserInfo return value on create and update alike. The
    // plugin's Local API writes run with overrideAccess (default), so the
    // admin-only field access on roles/divisions does not block the sync.
    onUserNotFoundBehavior: "create",
    serverURL: options.serverURL,
    authCollection: "users",
    clientId,
    clientSecret,
    // The hd query param pre-filters Google's account picker to the Workspace
    // domain (the plugin preserves query params already present on this URL).
    // UX only: the authoritative domain check is the hd CLAIM verification in
    // resolveGoogleUser, which a crafted request cannot skip.
    providerAuthorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?hd=${encodeURIComponent(domain)}`,
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scopes: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    prompt: "select_account",
    // PKCE binds the code exchange to the browser that started the flow (the
    // plugin sets code_challenge and a Lax pkce_verifier cookie), closing the
    // login-CSRF hole an unauthenticated authorize link would otherwise have.
    pkceEnabled: true,
    authorizePath: "/oauth/google",
    callbackPath: "/oauth/google/callback",
    getUserInfo: (accessToken: string, req: PayloadRequest) =>
      resolveGoogleUser({
        accessToken,
        domain,
        groupMap,
        fetchUserInfo: fetchGoogleUserInfo,
        checkMembership,
        warn: (message) => req.payload.logger.warn(message),
      }),
    successRedirect: () => "/",
    failureRedirect: (req, error) => {
      // Log the message only: a GaxiosError from the Directory API carries the
      // request config incl. the Authorization bearer token, which pino's err
      // serializer would otherwise write to the logs.
      const message = error instanceof Error ? error.message : String(error);
      req.payload.logger.error(`Google login failed: ${message}`);
      return "/login";
    },
  });
  return async (incomingConfig) => {
    const config = await plugin(incomingConfig);
    const users = config.collections?.find((c) => c.slug === "users");
    const auth = users?.auth;
    const strategies =
      auth && typeof auth === "object" ? auth.strategies : undefined;
    const google = strategies?.find((s) => s.name === "google");
    if (!google) {
      // Fail fast: a silently missing strategy would mean the credential
      // strip below never runs while Google login still appears to work.
      throw new Error(
        "payload-oauth2 did not register the google auth strategy",
      );
    }
    stripCredentialFields(google);
    return config;
  };
};
