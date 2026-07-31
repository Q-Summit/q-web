# Go-live

Production setup for what exists today: R2, the site Worker, Vercel CMS migrations, Google SSO for the CMS, and the env keys those need. Topology and rollback: [`../architecture/07-deployment.md`](../architecture/07-deployment.md). Local CF-shaped preview: [`local-development.md`](local-development.md). Draft content packages: [`content-sync.md`](content-sync.md).

Production deploys through Cloudflare Workers Builds, git-connected to this repo ([ADR-0004](../decisions/0004-cloudflare-workers-builds-deploy.md)): a merge to `main` builds `apps/web` and deploys atomically. Humans merge; the platform deploys; agents never deploy. `apps/web/wrangler.jsonc` is the deploy contract.

## Shipped flows that still need one-time keys

The PostHog analytics client and the publish rebuild hook both ship in the site but stay inert until their production keys are set. PostHog turn-on and rollback are in [PostHog analytics](#posthog-analytics) below.

Publish → Workers Builds is **shipped** ([architecture/06](../architecture/06-runtime.md)): live-site changes POST `CLOUDFLARE_DEPLOY_HOOK_URL`. Set that URL on the Vercel CMS project and as the GitHub secret for **Rebuild site**. Cloudflare dedupes bursts ([Deploy Hooks](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/)).

## Repository branch protection

Every merge to `main` deploys, so `main` must be protected. In the repo settings, protect `main` and mark the **Checks** status (`.github/workflows/checks.yml`) as a **required** status check. GitHub branch protection is not expressible in the repo, so it is set once here. The visual-regression check is **advisory** and intentionally NOT a required status ([visual-testing.md](visual-testing.md)).

**"Require branches up to date" is optional and left off by default** to avoid the per-PR update chore. It is safe to omit: `Checks` re-runs on `push: main`, so a bad merge goes red on `main` immediately (post-merge detection rather than pre-merge prevention), and visual baselines are committed PNGs that git 3-way-merges (different components merge cleanly; the same component hits a binary conflict that forces a re-render), with `visual-propagate.yml` keeping open PRs fresh after each merge. Enable it only if you want to prevent a red `main` rather than react to one.

## Visual review secrets (optional, for seamless mode)

The visual-regression review ([visual-testing.md](visual-testing.md)) works with no secrets (COMPARE mode: a PR comment + a downloadable report). To light up the hosted report and automatic baseline commits, add:

- A Cloudflare **Pages** project named `q-web-vrt-reports` (Direct Upload), plus repo secrets `CLOUDFLARE_API_TOKEN` (Pages:Edit) and `CLOUDFLARE_ACCOUNT_ID` (PUBLISH mode: hosts the click-to-view report). The report is public, which is safe here: it only ever shows template-fixture renders with images neutralized to placeholder glyphs, never production content. An **Access** policy is optional if you want to restrict viewing anyway.
- A `VRT_PAT` repo secret, a fine-grained token with `contents: write` on this repo (AUTO mode: the job commits refreshed baselines onto the PR branch, and `visual-propagate` re-runs updated PRs; the default `GITHUB_TOKEN` cannot re-trigger CI). After the first AUTO push, confirm the commit's GitHub author is `github-actions[bot]` (the push step sets the bot noreply email; the PAT only authenticates). If attribution is wrong, the visual job will re-run on every baseline push and may loop; the workflow emits a warning when it detects that shape.

## One-time Cloudflare setup

1. **R2 bucket** `qweb-media` (same name as MinIO / wrangler binding). Prefer the Worker as the only public reader for `/media/*`.
2. **R2 API token** for Payload (S3-compatible) on Vercel: `S3_BUCKET`, `S3_ENDPOINT` (`https://<accountid>.r2.cloudflarestorage.com`), `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION=auto`. Do not set `S3_FORCE_PATH_STYLE` in prod (MinIO only).
3. **Worker** from `apps/web` (`wrangler.jsonc`: `ASSETS` → `./dist`, `MEDIA` → `qweb-media`, `run_worker_first: ["/media/*", "/qm/*"]`). `public/.assetsignore` excludes `media` from asset uploads.
4. **Custom domain** on the Worker for `q-summit.com` (and `www` if needed).
5. **Workers Builds** git-connect this repo to the `q-web` Worker in the Cloudflare dashboard ([ADR-0004](../decisions/0004-cloudflare-workers-builds-deploy.md)). Production branch `main`; build command `pnpm --filter web run build` (Astro static output to `apps/web/dist/`, per `apps/web/package.json`); the Worker lives in `apps/web` (`wrangler.jsonc`), which the platform deploys with `wrangler deploy`. Build env in the next section. Once git-connected, every merge to `main` triggers a production CMS-mode build, so complete the CMS on Vercel section below before merging anything; a build without a reachable CMS fails.
6. **Deploy hook** URL. In Cloudflare: Workers & Pages → your site Worker → Settings → Builds → Deploy Hooks → create one for `main`. Store the URL in **both** places: the `CLOUDFLARE_DEPLOY_HOOK_URL` **GitHub** repository secret (manual **Rebuild site** workflow) and the same-named env var on the **Vercel CMS** project (Payload publish → rebuild). The URL is the credential (no Authorization header); treat it as a secret. Docs: [Deploy Hooks](https://developers.cloudflare.com/workers/ci-cd/builds/deploy-hooks/).

Empty R2 breaks images. Seed images via Payload uploads or a one-time sync into `qweb-media` with keys matching `/media/<key>`. Hero/hack video and HLS are not uploadable through Payload today (images-only Media allowlist); seed those keys into R2 separately. Local: `pnpm r2:sync` then `pnpm preview:cf`.

### Site build env

Set in the Workers Builds environment, not in code:

| Variable | Purpose |
| --- | --- |
| `CONTENT_SOURCE=cms` | Build from Payload instead of local JSON |
| `CMS_URL` | Published CMS origin (HTTPS) |
| `PUBLIC_CMS_URL` | CMS origin baked into the client at build time (Live Preview origin check); omitting it silently bakes `http://localhost:3000` |
| `PUBLIC_POSTHOG_KEY` | PostHog project API key (`phc_...`, public by design). Enables the cookieless analytics client; turn-on and rollback are in [PostHog analytics](#posthog-analytics) below. Omitting it builds a site that sends nothing |

Real content is never committed to git. Production Workers Builds run in CMS mode: set `CONTENT_SOURCE=cms`, `CMS_URL`, and `PUBLIC_CMS_URL` in the Workers Builds env (`apps/web/.env.workers.example`) from the very first production deploy. The CMS on Vercel, seeded and published, is a hard prerequisite for the first site deploy. CI and fresh clones build from the committed fake fixture (`apps/web/test/fixtures/ci-content/`, regenerated with `pnpm content:fixture -- --from <snapshot dir>`); a real JSON build needs a maintainer-held content snapshot restored at `apps/web/content/` (gitignored). Workers Builds runs `wrangler deploy` on every merge to `main`; do not deploy by hand. A manual `wrangler deploy` stays human break-glass only and never runs from agent workflows.

```sh
CONTENT_SOURCE=cms CMS_URL=<published-cms-origin> PUBLIC_CMS_URL=<published-cms-origin> pnpm --filter web run build
CONTENT_SOURCE=json pnpm --filter web run build  # parity check: maintainer snapshot copied to apps/web/content/ first (gitignored)
# build:cms hardcodes CMS_URL=localhost:3000; local convenience only
cd apps/web && WRANGLER_LOG=debug pnpm exec wrangler deploy --dry-run  # local validation only
pnpm --filter web run cf-typegen     # after wrangler.jsonc edits; commit types
```

### After the first site deploy

Once the first production (or staging) deploy that should serve AI/SEO surfaces is live, spot-check:

- `https://q-summit.com/llms.txt` (identity + main links; under ~20 KB)
- `https://q-summit.com/llms-full.txt` (opens; header matches summary)
- One page share preview (WhatsApp or LinkedIn Post Inspector)
- `https://q-summit.com/robots.txt` and `sitemap-index.xml`

For `CONTENT_SOURCE=cms` builds, Site Settings → AI assistants and each page meta must be **published** in Payload, or the bake will miss identity/blurbs.

At go-live, set up the external uptime monitor against the canonical URLs (see [`incident.md`](incident.md) Detection).

Also set the repository variable `REMOTE_CMS_URL` (repo Settings, Secrets and variables, Actions, Variables) to the published CMS origin so the weekly CMS mode build canary ([`.github/workflows/cms-build.yml`](../../.github/workflows/cms-build.yml)) arms itself; it stays inert until this variable is set.

## PostHog analytics

The cookieless PostHog client ships with the site; how it works is documented in [analytics.md](analytics.md). Two settings switch collection on in production, and the order between them matters. In the PostHog EU project settings, enable cookieless server hash mode first: the client runs `cookieless_mode: "always"`, and PostHog drops every event silently until that mode is on. While there, enable heatmap capture, web vitals autocapture, and exception autocapture. Then add `PUBLIC_POSTHOG_KEY` (the `phc_...` project key) to the Workers Builds env in the table above and deploy; the key is inlined at build time, so collection begins only once that build finishes.

To verify, open the deployed site with devtools: analytics requests go to `/qm/e/` on the same origin with no request to any `posthog.com` host, no cookies, and an empty localStorage, and `$pageview` and the custom events appear in PostHog EU within a minute. The world map fills from `$geoip_country_code`, which the Worker's `/qm/geo` route supplies from Cloudflare's edge.

To roll back, clear `PUBLIC_POSTHOG_KEY` and redeploy; the build then tree-shakes the SDK out entirely and the site sends nothing.

The `phc_...` key is public in the bundle, as it is for any client-side analytics, so anyone can send events to the project. This cannot leak data (the key only writes), but it lets someone pollute the numbers and run up the bill. At turn-on, set a per-product usage limit on the PostHog EU project (Settings, Billing) so spam can dirty the data but never inflate the invoice; a Cloudflare rate-limiting rule on `/qm/*` is an optional second line.

The public legal pages name PostHog Cloud EU as a sub-processor; that copy lives with the Datenschutzerklaerung in the CMS, maintained by the team.

## CMS on Vercel

### Project connect

One-time, mirroring the Workers Builds git-connect above but for the CMS. In the Vercel dashboard:

1. Create the Vercel project from this repo (git-connect the monorepo).
2. Set **Root Directory** to `apps/cms`. Install/build defaults come from [`apps/cms/vercel.json`](../../apps/cms/vercel.json) (`pnpm install` from the monorepo root, then `pnpm run migrate && pnpm run build` in the CMS app). Production branch `main`.
3. Attach the CMS custom domain that `CMS_SERVER_URL` / `CMS_URL` point at (see the keys table below), then set the env keys in the Vercel project.

### Migrations

Local: schema **push**. Production: never push.

1. `pnpm db:up` then `pnpm --filter cms run generate:migrations -- <name>`; verify with `pnpm --filter cms run migrate`.
2. Commit `apps/cms/src/migrations/*` with the schema change.
3. Vercel build command: `pnpm --filter cms run migrate && pnpm --filter cms run build` (once per deploy container; do not enable `prodMigrations` on every connect).
4. Leave `PAYLOAD_DB_PUSH` unset in prod. Vercel sets `NODE_ENV=production` automatically, which is what disables the local password strategy and schema push; nothing to configure.

## Google SSO setup

Production sign-in is Google only ([ADR-0005](../decisions/0005-google-sso-group-roles.md)); roles and divisions are derived from Google Workspace groups on every login. This is a one-time operator setup across Google Cloud, a service account, the Workspace Admin console, and Vercel. The rationale and the fail-closed posture live in the ADR; the steps live here.

### a. Google Cloud console (OAuth client)

1. Create or choose a Google Cloud project (any project on the org works; keep it named for this site).
2. Enable the **Admin SDK API** for that project (APIs and Services, Library).
3. Configure the OAuth consent screen as **Internal** (Workspace only), then create an OAuth **client ID** of type **Web application**.
4. Set the authorized redirect URI to `<CMS_SERVER_URL>/api/users/oauth/google/callback` (the exact CMS origin from the keys table below, HTTPS).
5. Copy the client ID and client secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### b. Service account (group lookup, no delegation)

1. In the same project, create a **service account** (IAM and Admin, Service Accounts). It needs no project IAM roles.
2. **Do not enable domain-wide delegation.** The Directory API access comes from a directly-assigned Workspace admin role (step c), not from delegation or impersonation.
3. Create a **JSON key** for the service account and download it once.
4. From that JSON, set `GOOGLE_SA_CLIENT_EMAIL` to `client_email` and `GOOGLE_SA_PRIVATE_KEY` to `private_key` (the PEM block; keep the `\n` escapes, the code un-escapes them). Store the key only in Vercel; never commit it.

### c. Workspace Admin console (Groups Reader role)

A Workspace **super admin** grants the service account read access to group membership:

1. Admin console, Account, Admin roles, open **Groups Reader**.
2. **Assign service accounts**, paste the service account email (`GOOGLE_SA_CLIENT_EMAIL`).

This is the only authorization the service account has: reading group membership. No domain-wide delegation, no user impersonation.

### d. Workspace groups

**Default convention** (`GOOGLE_GROUP_PREFIX`, default `cms-`): create these nine groups. Membership is the access-control surface; add and remove people here.

| Group                         | Grants                |
| ----------------------------- | --------------------- |
| `cms-admins@q-summit.com`     | `admin`               |
| `cms-approvers@q-summit.com`  | `approver`            |
| `cms-chair@q-summit.com`      | `editor` + chair      |
| `cms-pr@q-summit.com`         | `editor` + pr         |
| `cms-partner@q-summit.com`    | `editor` + partner    |
| `cms-finance@q-summit.com`    | `editor` + finance    |
| `cms-operations@q-summit.com` | `editor` + operations |
| `cms-concept@q-summit.com`    | `editor` + concept    |
| `cms-it@q-summit.com`         | `editor` + it         |

Roles and divisions are the union across a person's groups, re-synced on every login. **Group membership is the only way in:** a `q-summit.com` account that is in no mapped role-granting group is refused sign-in and no account is created, and an existing account whose groups were removed is refused at its next sign-in. A valid Workspace email alone grants nothing.

**Q-Summit production map:** instead of nine `cms-*` groups, production sets `GOOGLE_GROUP_MAP` to existing org groups (this **replaces** the prefix convention entirely):

| Group                  | Grants                                 |
| ---------------------- | -------------------------------------- |
| `it@q-summit.com`      | `admin`                                |
| `board@q-summit.com`   | `approver`                             |
| `ct-2027@q-summit.com` | `editor` + all seven content divisions |

`ct-2027@` is intentionally broad (whole cohort may draft across divisions); only `board@` / `it@` can Publish. Keep the JSON in Vercel in sync with `apps/cms/.env.vercel` comments.

To use a different explicit map, set `GOOGLE_GROUP_MAP` (JSON: full group email to `roles`/`divisions`, example in `apps/cms/.env.vercel.example`). It is validated when the CMS boots: unknown roles or divisions, entries that grant nothing, and mappings in which no group grants `admin` are all rejected with a clear error instead of surfacing at someone's login.

### e. Vercel env vars

Add the rows in [Keys that exist today](#keys-that-exist-today) to the Vercel CMS project: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_DOMAIN` (`q-summit.com`), `GOOGLE_SA_CLIENT_EMAIL`, `GOOGLE_SA_PRIVATE_KEY`, and optional `GOOGLE_GROUP_PREFIX` (only if the prefix is not `cms-`). **Vercel production refuses to boot without Google SSO and S3 keys** (`assertProductionHardening`): password login is already disabled there, so a missing Google client is total admin lockout, not a soft fallback. Local/preview can omit Google env; SSO stays off and seeded password accounts keep working.

### f. Smoke test

Minting an Admin SDK token by hand in `curl` (JWT-bearer flow) is fiddly, so verify end to end instead of poking the API directly:

1. Add yourself to `it@q-summit.com` (or `cms-admins@…` if you use the prefix convention).
2. Open the CMS origin (root `/`; unauthenticated visitors get `/login`) and use **Continue with Google**.
3. Confirm a user document was created for your address with `roles` containing `admin` (Users collection). A refused login with the error logged (`req.payload.logger`) and a redirect to `/login` means a failed group lookup or an unmatched group, not a wrong password.

To spot-check group membership without logging in, use the Admin console (the group's Members list) or the Admin SDK "Try this API" explorer for `hasMember`.

## CMS admin bootstrap

Once the Vercel deploy is up, migrations have run, and [Google SSO setup](#google-sso-setup) is complete, the first admin bootstraps through Google. Production has no create-first-user password screen: the email/password strategy is disabled in production, so `/` (and `/login`) show only **Continue with Google**. The admin is mounted at the CMS host root (`routes.admin: '/'`), e.g. `https://cms.q-summit.de/`.

1. Add yourself to `it@q-summit.com` (or `cms-admins@…`) first. On first sign-in, JIT provisioning creates your account with role `admin` derived from that group ([ADR-0005](../decisions/0005-google-sso-group-roles.md)); there is no password to set. If you already ran the [smoke test](#f-smoke-test) above, this step is done: that sign-in was the bootstrap.
2. Grant everyone else by Workspace group membership, not in the admin UI: put approvers in `board@` (or `cms-approvers@`), and editors in `ct-2027@` (or their `cms-<division>@` group). Roles and divisions re-sync from the groups on every login, so edits to the `roles`/`divisions` fields in the admin UI are overwritten at next sign-in.
3. Content-sync identity is **each operator's own Workspace account**, not a bot and not a special CMS account: set `CONTENT_SYNC_USER_EMAIL` to your own `name.lastname` (the CMS resolves it to `name.lastname@q-summit.com`) and **sign in to the CMS with Google once** so JIT provisioning creates your Users row. The changelog then stamps `name.lastname@agent.q-summit.com` and shows `you (agent)`, which is the point: you can see who proposed something and that it came from an agent rather than a manual edit. Any role works, admins included, because propose is drafts-only by construction and never publishes. Also set a strong `CONTENT_SYNC_TOKEN` on Vercel ([Keys that exist today](#keys-that-exist-today)); that token is the actual secret, and it is what you do not hand out. Propose sends `X-Content-Sync-Actor`; the endpoint looks that user up and never creates accounts. Drafts only; Publish stays human.

### Access recovery posture

Production has no passwords, so there is nothing to reset in Payload: access is a Google sign-in plus Workspace group membership.

- Recovering a person's access means restoring their Google account (Workspace admin or Google account recovery) and confirming their group membership; roles re-sync on their next login.
- Keep at least two people in `it@q-summit.com` (or `cms-admins@…`) so losing one Google account never leaves the deployment without an admin.
- **Offboarding:** removing someone from all mapped groups blocks their next sign-in, but an already-issued session cookie stays valid for up to one hour (`tokenExpiration` on the users collection). For immediate revocation, an admin deletes their user document in the Users collection; every later request is then refused because no account resolves. If they are ever re-added to a group, JIT provisioning recreates the account on sign-in.
- **Admin SDK outage:** login fails closed ([ADR-0005](../decisions/0005-google-sso-group-roles.md)), but an existing admin **session cookie keeps working until it expires**, so a logged-in admin is not immediately locked out. There is no repo-side recovery path; keep the Google side healthy.
- **Workspace super-admin lockout** is out of scope for this repo (handled in Google Workspace, not here).

## Content cutover

The final step. It needs everything above already done (CMS deployed on Vercel, Google SSO set up, an admin and approvers bootstrapped) and the site content **published** in Payload. Production builds run CMS mode from the very first deploy (see Site build env above); the cutover is pointing the production domain at the deployment, after a parity check. Build both modes locally and compare the rendered pages before touching production. Hashed asset filenames (`/_astro/<name>.<hash>.<ext>`) differ between builds by design, so normalize the hash segment before diffing; the page content must match.

### Initial bulk load

Production Payload starts empty; nothing else here documents how it gets seeded. Seeding it through `ops:cms-remote`, `ops:mirror-db`, direct SQL, or `pg_restore` is forbidden: the only sanctioned remote write is draft-only `POST /api/content-sync` (root [`AGENTS.md`](../../AGENTS.md) NEVER: "Invent or document a SQL/`pg_restore` / `data:push` write path to production"). Use the checklist below.

1. **Media first.** Content-sync only looks up existing media by filename; it never creates a Media doc or fetches a URL (`resolveMediaId` in `apps/cms/src/content-sync/apply-package.ts`). Upload every file a package will reference into the CMS Media library before proposing that package (bulk multi-select upload works from the admin). A package proposed before its media exists lands those docs in `skipped` with a `missing media filename` error instead of `created`.
2. **Propose in scoped packages.** The endpoint hard-caps a package at 200 combined docs and globals (`apply-package.ts`'s `MAX_DOCS`; see [content-sync.md's failure modes](content-sync.md#failure-modes)). Split the full edition across scoped `--collections` / `--globals` packages ([flags](content-sync.md#flag-defaults)) instead of one giant propose, for example:

   ```sh
   pnpm content:propose -- --globals all --dry-run && pnpm content:propose -- --globals all
   pnpm content:propose -- --collections partners,jobs --dry-run && pnpm content:propose -- --collections partners,jobs
   pnpm content:propose -- --collections speakers,team,past-teams --dry-run && pnpm content:propose -- --collections speakers,team,past-teams
   pnpm content:propose -- --collections faqs,testimonials --dry-run && pnpm content:propose -- --collections faqs,testimonials
   ```

   Adjust the split to whatever grouping stays under the 200-doc cap for the actual edition size; every batch writes drafts only, same as day-to-day propose.

3. **Approver publish session.** Work the admin **Review queue** (`/reviews`) as the single working surface: it lists every drafted collection doc and global in one place. An approver publishes Site Settings and the 11 page globals (12 globals total), then each partner, job, speaker, team member, past-teams entry, FAQ, and testimonial, one document at a time; there is no bulk-publish action. Budget a multi-hour session for a full edition.
4. Once every doc proposed in this pass is published, prod Payload is seeded. From this point, treat snapshot JSON edits as emergency-only: an edit made to the snapshot during the cutover window has to be reproduced in Payload too, or the parity diff below never converges. Re-run the parity diff only after this seeding pass is fully published.

```sh
cd apps/web
# PUBLIC_CMS_URL identical in both builds so the parity diff only varies the content source.
CONTENT_SOURCE=json PUBLIC_CMS_URL=<published-cms-origin> pnpm run build && cp -r dist /tmp/qweb-json
CONTENT_SOURCE=cms CMS_URL=<published-cms-origin> PUBLIC_CMS_URL=<published-cms-origin> pnpm run build && cp -r dist /tmp/qweb-cms

# Same set of pages in both builds?
diff <(cd /tmp/qweb-json && find . -name '*.html' | sort) \
     <(cd /tmp/qweb-cms  && find . -name '*.html' | sort)

# Compare page content with the /_astro/ hash segment normalized to HASH.
norm() { sed -E 's#(/_astro/[^"]+\.)[A-Za-z0-9_-]{8,}(\.[a-z0-9]+)#\1HASH\2#g' "$1"; }
for f in $(cd /tmp/qweb-json && find . -name '*.html' | sort); do
  diff <(norm "/tmp/qweb-json/$f") <(norm "/tmp/qweb-cms/$f") >/dev/null \
    || echo "CONTENT DIFF in $f"
done
```

Known-benign byte deltas: the JSON snapshot carries scraped markup that Lexical rendering does not reproduce, so FAQ and job pages differ in dead class wrappers (`max-width-large`, `paragraph is-left`; no CSS targets them), trailing `<br/>`, apostrophe entity encoding, and leading whitespace. When only those categories appear, compare at text level instead: strip tags, unescape entities, collapse whitespace, then diff; the visible text and the FAQ JSON-LD answer text must be identical.

- **Legal review signoff** on the privacy policy (the `legal` global in Payload; the maintainer snapshot holds an offline copy in `legal.json`) is required before DNS cutover. Do not point the production domain at this deployment while that review is outstanding.
- **Publish → rebuild:** confirm `CLOUDFLARE_DEPLOY_HOOK_URL` is set on Vercel and as the GitHub secret before DNS cutover ([architecture/06](../architecture/06-runtime.md)). Unpublish and restore also schedule a rebuild; use **Rebuild site** only if the hook was missed or Builds failed. After a successful deploy, HTML revalidates immediately (`max-age=0` in `_headers`); `/media/*` follows R2 etags in the Worker Cache API (no purge needed for new uploads or same-key overwrites at the edge). Details: [architecture/06 § What refreshes](../architecture/06-runtime.md#what-refreshes-on-publish--redeploy).
- Point production at the deployment only when the normalized page diff between the CMS-mode build and a snapshot JSON build (maintainer snapshot copied to gitignored `apps/web/content/`) is clean (byte-clean, or text-clean with only the known-benign categories above).
- Payload is the only production content source. Content emergency: roll back to Cloudflare's previous deployment first. Full CMS outage fallback: commit the maintainer snapshot as `apps/web/content/` in an emergency PR and set `CONTENT_SOURCE=json` in the Workers Builds env (JSON mode then auto-detects the committed `content/` dir), then revert both once the CMS is healthy. Do NOT unset the variable: it is required, and an unset value fails the build with `[content] CONTENT_SOURCE is unset` -- which would turn the outage into a failed emergency deploy.
- The maintainer snapshot is frozen; never hand-maintain it as a content source.

## Keys that exist today

None live in git; `.env.example` files document local values only.

| Credential | Created in | Stored in | Used by |
| --- | --- | --- | --- |
| `DATABASE_URI` | Neon | Vercel | CMS |
| `PAYLOAD_SECRET` | random string | Vercel | Payload token signing |
| `CMS_SERVER_URL` | CMS domain | Vercel | serverURL, cors, csrf |
| `SITE_URL` | site domain (`https://q-summit.com`) | Vercel | cors/csrf origins **and** Live Preview iframe target |
| `PUBLIC_CMS_URL` | CMS domain (`https://cms.q-summit.de`) | Workers Builds (site) | Live Preview `postMessage` origin check in the site client |
| `S3_*` (bucket, endpoint, keys, region) | R2 token | Vercel | storage-s3 |
| `CONTENT_SYNC_TOKEN` | random string | Vercel + gitignored `.env.remote` | `POST /api/content-sync` (drafts only) |
| `CLOUDFLARE_DEPLOY_HOOK_URL` | Workers Builds deploy hook | Vercel CMS **and** GitHub repository secret | Publish → rebuild (CMS); **Rebuild site** workflow (manual) |
| `CONTENT_SYNC_USER_EMAIL` | your own `name.lastname` (client) | `.env` / `.env.remote` | `X-Content-Sync-Actor`; resolved to `@q-summit.com`; that user must exist in Payload |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth client | Vercel | `payload-oauth2` login |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client | Vercel | `payload-oauth2` login |
| `GOOGLE_WORKSPACE_DOMAIN` | Workspace domain (`q-summit.com`) | Vercel | `hd` check + group domain |
| `GOOGLE_SA_CLIENT_EMAIL` | service account JSON (`client_email`) | Vercel | Directory API `hasMember` |
| `GOOGLE_SA_PRIVATE_KEY` | service account JSON (`private_key`, PEM) | Vercel | Directory API `hasMember` |
| `GOOGLE_GROUP_PREFIX` | optional, default `cms-` | Vercel | group-to-role mapping |
| `GOOGLE_GROUP_MAP` | optional JSON, replaces the prefix convention | Vercel | explicit group-to-role mapping |

The `GOOGLE_*` rows are the production Google SSO inputs; setup steps are in [Google SSO setup](#google-sso-setup). Google login stays off until both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set, and local dev needs none of them (to test the real flow locally anyway, see [local-development.md](local-development.md)).

The content-sync identity is each operator's own Payload user, created by their own Google sign-in during [CMS admin bootstrap](#cms-admin-bootstrap), step 3, plus a strong `CONTENT_SYNC_TOKEN`. There is no separate sync account to create. Propose cannot publish or deploy; procedure: [`content-sync.md`](content-sync.md).

If this disagrees with `wrangler.jsonc` or `apps/cms/src/payload.config.ts`, the code wins; update this page in the same PR.
