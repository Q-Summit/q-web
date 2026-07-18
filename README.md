# q-web

The website for [Q-Summit](https://q-summit.com), Germany's largest student-organized startup conference.

## How it works

The public site is pre-built static HTML, served from Cloudflare's edge. Content lives in Payload CMS, where division members edit their own collections under personal, division-scoped accounts, with drafts and an approval step before anything goes live. Publishing triggers a static rebuild; the live site never depends on the CMS being up.

| Layer     | Technology                   | Where                    |
| --------- | ---------------------------- | ------------------------ |
| Site      | Astro (static output)        | Cloudflare               |
| CMS       | Payload 3                    | Vercel                   |
| Database  | Postgres                     | Neon, Frankfurt          |
| Media     | R2 object storage            | Cloudflare               |
| Analytics | PostHog Cloud EU, cookieless | No consent banner needed |

Publish flow: an approver publishes in Payload, a hook calls the Cloudflare deploy hook, the site rebuilds in roughly 2 to 4 minutes, and the deploy is atomic. A failed build never touches the live site.

The full decision trail is in [`docs/decisions/`](docs/decisions/): [ADR-0001](docs/decisions/0001-astro-static-site.md), [ADR-0002](docs/decisions/0002-payload-cms-on-vercel-neon.md), [ADR-0003](docs/decisions/0003-posthog-cookieless-analytics.md). Architecture, costs, risks, and compliance live in [`docs/architecture/`](docs/architecture/).

## Editing content

Content (partners, speakers, jobs, team, FAQ, page text, images) is edited in Payload, not in this repository. Editors need no GitHub account and no developer tools: the [editor handbook](docs/editors/) explains drafts, previews, and the approval step in plain language.

## Repository layout

| Path             | Holds                                    |
| ---------------- | ---------------------------------------- |
| `apps/web/`      | Astro site                               |
| `apps/cms/`      | Payload CMS                              |
| [`docs/`](docs/) | Decisions, architecture, editor handbook |
| `scripts/`       | Setup and maintenance scripts            |
| `.github/`       | CI workflows, issue and PR templates     |

## Getting started

Requires Node `>=22.18` and pnpm `>=10` (exact version pinned in `package.json`).

```sh
pnpm run setup   # install, git hooks, skills symlink, docs validation
pnpm run check   # lint, spelling, formatting, docs structure
pnpm run format  # Prettier write
```

## Contributing

Code and docs changes: see [`CONTRIBUTING.md`](CONTRIBUTING.md). Content changes go through Payload (see [Editing content](#editing-content) above).

## Security

Please report vulnerabilities privately; see [`SECURITY.md`](SECURITY.md).

## License

Code is MIT ([`LICENSE.md`](LICENSE.md)). Site content, media, and the Q-Summit marks are all rights reserved ([`LEGAL.md`](LEGAL.md)).
