# 0005 · Google SSO with Workspace-group roles for the CMS

- **Status:** Accepted
- **Date:** 2026-07-22
- **Trigger:** launch-readiness audit owed item "Google SSO / group-based admin auth"; the CMS still shipped email/password while the board already lives in Google Workspace

## Context

The CMS ([ADR-0002](0002-payload-cms-on-vercel-neon.md)) needs about 40 division editors plus approvers and admins, all of them on the `q-summit.com` Google Workspace. Email/password meant a password to manage per account, no central offboarding when a member leaves, and roles assigned by hand in the admin UI. Board membership already lives in Workspace groups, so access should follow the group, not a second list maintained in Payload. We want login tied to Workspace identity and roles/divisions derived from group membership, without adding a new identity vendor and without weakening the division scoping or the approver publish gate ([section 8](../architecture/08-concepts.md)).

## Considered options

1. **payload-oauth2 (community plugin) with Workspace groups via the Admin SDK Directory API**: a small OAuth2 plugin on the users collection (zero runtime deps, uses `jose`); Google is the identity provider and group membership drives roles. Login and callback are handled for us; we own only the userinfo/group logic. Con: a community plugin, so maintenance is a watch item.
2. **payload-authjs (Auth.js 5)**: brings a full auth framework; but Auth.js v5 is still beta and its future is unstable (it is folding into Better Auth), a large surface to adopt for one Workspace.
3. **Hand-rolled Payload custom auth strategy**: maximum control, but it re-implements what the plugin already does (token exchange, callback, session cookie), more security-sensitive code to own.
4. **Payload Enterprise SSO plugin**: first-party and supported, but sales-gated behind a paid Enterprise plan, against the near EUR 0 constraint of the rest of the stack.
5. **Cloud Identity transitive group APIs**: cleaner nested-group resolution, but Enterprise-edition-gated and not on our Workspace tier.
6. **SAML with group claims**: a different protocol needing heavier identity-provider setup, no advantage over OAuth plus the Directory API for a single Workspace.

## Decision

Option 1. `payload-oauth2` on the users collection: production sign-in is Google only, and roles/divisions are derived from Google Workspace groups on every login. The one-time operator runbook (Google Cloud, service account, Workspace admin, Vercel env) is [go-live](../dev/go-live.md#google-sso-setup).

- **Identity and provisioning:** the plugin uses email as identity, provisions the account on first login (JIT), and prompts for account selection. Google login is enabled only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set, so local dev needs no Google credentials.
- **Group-to-role mapping** (group prefix from `GOOGLE_GROUP_PREFIX`, default `cms-`; domain from `GOOGLE_WORKSPACE_DOMAIN`): `cms-admins@` grants `admin`, `cms-approvers@` grants `approver`, and `cms-<division>@` for each of the seven divisions (chair, pr, partner, finance, operations, concept, it) grants `editor` plus that division. An explicit `GOOGLE_GROUP_MAP` (JSON, validated fail-fast at boot) replaces the naming convention when existing groups should be reused. Roles and divisions are the union across the groups a person is in, re-synced on every login so the Workspace group is the single source of truth.
- **Group lookup authorization:** a service account holding the Workspace "Groups Reader" admin role (assigned directly in the Admin console) calls the Directory API `hasMember` endpoint per group, in parallel. Explicitly **without** domain-wide delegation and without an impersonation claim: the service account's own directly-granted role is the authorization. `hasMember` resolves same-domain nested groups, so the Enterprise-gated Cloud Identity transitive APIs are not needed.
- **Verification before any account is created:** the login handler fetches Google userinfo and requires `email_verified` and a hosted-domain (`hd`) match against `GOOGLE_WORKSPACE_DOMAIN`, then computes group membership; a member in no mapped group is rejected and no account is created.
- **Fail closed:** if the Directory API call fails (network or 5xx), login is refused rather than granting a fallback role. There is no degraded-access path.
- **Local dev keeps passwords:** the email/password strategy is disabled in production only (gated on `NODE_ENV`), so the local workbench keeps its seeded password users and the normal login form ([local-development](../dev/local-development.md)).

## Consequences

- New production secrets in Vercel: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_DOMAIN`, `GOOGLE_SA_CLIENT_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, and optional `GOOGLE_GROUP_PREFIX` / `GOOGLE_GROUP_MAP`. Inventory and the setup runbook: [go-live](../dev/go-live.md#google-sso-setup).
- A one-time Workspace-admin action (super admin) creating the nine groups and assigning the Groups Reader role to the service account. That setup, and the OAuth redirect URI to register (`<CMS_SERVER_URL>/api/users/oauth/google/callback`), live in [go-live](../dev/go-live.md#google-sso-setup).
- Group membership becomes the single access-control surface: grant access by adding a person to the right Workspace group, not by editing roles in the admin UI, because login overwrites roles/divisions from the groups. The content-sync editor user is the exception (no interactive login, so its roles stay as an admin set them; see [go-live](../dev/go-live.md#cms-admin-bootstrap)).
- Login now depends on the Admin SDK Directory API. An outage fails login closed, though an existing session cookie keeps working until it expires, so a logged-in admin is not immediately locked out. Access recovery is Workspace group membership plus Google account recovery; the residual risk of Workspace super-admin lockout is out of scope for this repo ([go-live](../dev/go-live.md#access-recovery-posture)).
- Production has no passwords, so the previously owed Payload email adapter is no longer needed for password resets, and the create-first-user password screen no longer applies in production ([go-live](../dev/go-live.md#cms-admin-bootstrap)).
- The division scoping, the approver publish gate, and the content-sync endpoint identity are unchanged; this ADR changes how a user authenticates and how roles are assigned, not what a role may do.
- Revisit if nested-group depth ever needs the Cloud Identity transitive APIs (an edition upgrade), if `payload-oauth2` goes unmaintained (a hand-rolled strategy is the fallback), or if a second identity provider is ever required.
