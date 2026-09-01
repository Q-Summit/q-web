# Content sync (pull / propose)

Agent-facing procedure for **draft-only content packages** (JSON via CMS REST / content-sync API). Safety rules: root [`AGENTS.md`](../../AGENTS.md). Runtime / deploy boundary: [`../architecture/06-runtime.md`](../architecture/06-runtime.md), [`../architecture/07-deployment.md`](../architecture/07-deployment.md). Local accounts and Docker: [`local-development.md`](local-development.md). Production keys: [`go-live.md`](go-live.md). Tooling map: [`scripts.md`](scripts.md).

## Content package vs ops mirror

| Kind | Content package (`make pull` / `content:*`) | Break-glass mirror (`ops:mirror-*`) |
| --- | --- | --- |
| When | Day-to-day content edits (agents OK) | Rare human debugging with full local DB/media |
| Who | Agents OK | Humans only (TTY) |
| What moves | Allowlisted collections/globals as JSON package | Entire Neon dump and/or R2 → MinIO |
| Needs | `REMOTE_CMS_URL` (pull); `CONTENT_SYNC_TOKEN` (propose) | `REMOTE_DATABASE_URI` / `REMOTE_S3_*` + TTY confirm |
| Writes remote? | Propose writes **drafts** only | Mirror is remote → local only (no `data:push`) |
| Folder | `scripts/content/` | `scripts/ops/` |

Never run `ops:mirror-db` because you meant `make pull`. Prefer this page over Neon for content work.

## Security model (short)

| Control | Behavior |
| --- | --- |
| Auth | `Authorization: Bearer <CONTENT_SYNC_TOKEN>` on `POST /api/content-sync` and `POST /api/content-sync/media` |
| Identity | Lookup real `<you>@q-summit.com` user (must exist). Changelog stamps `<you>@agent.q-summit.com` / shows as `you (agent)` vs manual Workspace email |
| Privilege | The actor keeps their real roles/divisions, which decide **which drafts** they may write. No role can publish here: `forceDraftData` + `draft: true` make every write a version |
| Writes | Package ingest is always `draft: true` + `_status: draft` (versions only; live row stays published) |
| Access | Local API with `overrideAccess: false` (division rules still apply) |
| Allowlist | Collections/globals in `apps/cms/src/content-sync/keys.ts` |
| Deny | `users`, `legal` |
| Media | Create-if-missing via `POST /api/content-sync/media` (multipart `file` + `alt`). Apply still looks up by filename; no URL fetch; no overwrite or delete |
| Deploy | Endpoints never call Cloudflare / wrangler |
| Stolen token | Can spam/alter **drafts** in the named actor's scope and create **new** Media files; cannot overwrite or delete media, Publish, deploy, reach `users`/`legal`, or pass the result off as a manual edit (the `(agent)` stamp survives). The token is the secret; guard it |

Pull (`make pull` / `content:pull`) is read-only published REST (`REMOTE_CMS_URL` only). Propose needs the token. Neither talks to Neon.

## Env

| Variable | Where | Used by |
| --- | --- | --- |
| `REMOTE_CMS_URL` | `apps/cms/.env.remote` | `content:pull`; remote `content:propose` target |
| `CONTENT_SYNC_TOKEN` | `.env.remote` (and Vercel / local `.env`) | `content:propose` and `content:upload-media` |
| `CONTENT_SYNC_USER_EMAIL` | local `.env` / `.env.remote` (client) | Your own `name.lastname`; sent as `X-Content-Sync-Actor`; CMS forces `@q-summit.com`; user must already be in Payload |
| `REMOTE_DATABASE_URI` | Shell only, exported per use; never written to a file | Human `ops:mirror-db` / `ops:cms-remote` only (break-glass) |

`REMOTE_DATABASE_URI` is never persisted, not even in `.env.remote`: an operator exports it in their shell for the one break-glass `ops:` invocation that needs it, and it is gone when that shell session ends. `.env.remote` itself holds only the day-to-day `REMOTE_CMS_URL` and `CONTENT_SYNC_TOKEN`.

A maintainer shares the `.env.remote` values out-of-band with every Q internal (developer or agent operator) who works on real content: `make pull`, optionally `--import` into local drafts. Anyone without those creds works on the seeded fake fixture. The values never enter git, issues, or PRs.

## Working directory

Always edit **`scripts/content-packages/current/bundle.json`**. That is the JSON `content:propose` sends. Image binaries stay **out** of the JSON (5 MiB cap); put them in `current/media/<filename>` or pass `--media-dir`. Propose uploads missing files first, then applies the package. `--skip-media` skips the upload step.

Pull and export do not write per-collection sidecar files under `collections/` / `globals/` by default. Pass `--sidecars` (flags: [`scripts.md`](scripts.md)) to opt into writing them for browsing an export. Editing a sidecar, when one exists, never affects propose. Local export copies matching files from `apps/cms/media/` or `apps/web/public/media/` into `current/media/` when they exist on disk.

## Flag defaults

| Flag | Pull default | Export default |
| --- | --- | --- |
| `--collections` | all sync collections | all sync collections |
| `--globals` | none (use `all` or a list) | none |
| `--out` / package dir | `scripts/content-packages/current` | same |

## Upsert keys (stable identity)

| Collection   | Key                                                      |
| ------------ | -------------------------------------------------------- |
| partners     | `name`                                                   |
| jobs         | `slug`                                                   |
| speakers     | `name` + `group`                                         |
| team         | `name` + `year`                                          |
| past-teams   | `year` (one group photo per past board year)             |
| faqs         | `question` + `page` (`home` \| `program` \| `hackathon`) |
| testimonials | `attribution`                                            |
| globals      | singleton slug                                           |

Renaming a key field creates a new draft; the old doc remains until a human deletes it.

Upsert keys are schema-enforced unique. Single-field keys (`partners.name`, `jobs.slug`, `past-teams.year`, `testimonials.attribution`) carry a database unique index; compound keys (`speakers` name+group, `team` name+year, `faqs` question+page) are enforced by a validation hook. An editor cannot save a duplicate through the admin: Payload rejects the save with an error naming the conflicting document; propose's find-by-key cannot silently match the wrong one of two same-key docs.

## Loops

**Remote (usual agent path):**

```sh
# Make front door (same as pnpm content:*):
make pull ARGS='--collections faqs'
# edit scripts/content-packages/current/bundle.json only
make propose ARGS='--dry-run'
make propose
# images: put files in current/media/ or pass --media-dir; --skip-media skips upload

# Equivalent pnpm:
pnpm content:pull -- --collections faqs
pnpm content:propose -- --dry-run
pnpm content:propose
```

Requires `REMOTE_CMS_URL` in `.env.remote`. Do not run `make package` / `content:export` after pull (overwrites `current/` from local CMS).

**Local CMS export:**

```sh
make dev
pnpm content:export -- --collections faqs
pnpm content:propose -- --local --dry-run
pnpm content:propose -- --local
```

`make package` is an alias for `content:export` (local CMS only). Use `--local` when `.env.remote` exists but you want localhost.

Export packages the **latest published** local state only: local drafts are ignored and never-published docs are skipped (logged). Propose sends only content an approver already published locally. Version history never transfers; the target gets a single fresh draft per changed doc.

## Result JSON

`created`, `updated`, `skipped`, `errors`, `dryRun`. Denied or unknown collection/global slugs **abort the whole package** (no writes). The endpoint returns **HTTP 422** when `errors` is non-empty (including after a mid-package write failure that stops further writes). The propose CLI also exits non-zero when `errors` is non-empty.

Two behaviors to expect:

- **Unchanged docs are skipped, not re-drafted.** A doc whose package content matches the target's current draft-aware state lands in `skipped` as `<label> (unchanged)`; re-proposing a pulled-but-unedited package adds no no-op drafts to the review queue.
- **Drafts are validated on write.** Required fields and slug/URL formats are checked at propose time; a bad package fails with the field errors in `errors` instead of surfacing when an approver tries to Publish.

## Failure modes

| Symptom | Likely cause |
| --- | --- |
| 401 | Missing/wrong `CONTENT_SYNC_TOKEN` |
| 400 | Body not JSON, not a package object, or `package.version` is not `1` |
| 413 | Package larger than 5 MiB |
| `package exceeds max docs (200)` | Combined docs + globals over the endpoint's 200-doc cap; split into scoped packages |
| 422 | Apply errors (deny/unknown slug, missing keys, write failure); see `errors` |
| 400 actor | Missing header, bad format / `dev` / wrong domain, **no Payload user**, or user has no CMS roles (never auto-creates) |
| `denied collection/global` | Tried `users` / `legal` / unknown slug |
| `missing media filename` | Target CMS has no media with that filename, and propose did not upload it (missing local file, `--skip-media`, or media endpoint error) |
| media 400 / 422 | Bad filename, missing `alt`, disallowed mime, oversize, or create failed |
| `missing upsert key fields` | FAQ without `question`+`page`, etc. |
| Division / access error in `errors` | Sync user lacks that division |
| Schema field error | Migration not deployed on target yet |

## After propose

Tell the human: drafts are in Payload admin for an approver to Publish. Do not Publish. Do not `wrangler deploy`.

Production builds read only published Payload content (`CONTENT_SOURCE=cms`; [go-live.md](go-live.md#content-cutover)). The live site updates after an approver Publish.
