# Docs

Three user groups shape everything here: **visitors** (the public site must be fast and correct), **division editors** (edit their own content in Payload, no repo access needed), and **maintainers** (code and docs in this repo).

One home per question:

| Question | Home |
| --- | --- |
| How do I run or deploy this? | [`dev/`](dev/): maintainer how-tos (local loop, Cloudflare, Vercel) |
| Which root script / Make target? | [`dev/scripts.md`](dev/scripts.md): `local/` `content/` `check/` `preview/` `ops/` |
| How do I pull or propose content packages? | [`dev/content-sync.md`](dev/content-sync.md) (drafts only; never publish/deploy) |
| How do divisions edit content? | [`editors/`](editors/): the editor handbook, written for non-developers |
| How do titles and WhatsApp previews work? | [`editors/seo.md`](editors/seo.md) |
| How does `/llms.txt` identity get edited? | [`editors/llms.md`](editors/llms.md) |
| Why is the system built this way? | [`decisions/`](decisions/): ADRs, architecture decisions, append-only |
| How does the system work **right now**? | [`architecture/`](architecture/): arc42; always current truth |

The placement rule: **if the reader should not need to know what a repository is, the page belongs in `editors/`**; everything else may assume a developer.

| Home | Doc type | Put here |
| --- | --- | --- |
| `editors/` | How-to for non-developers | Payload editing, SEO cards, `/llms.txt` identity |
| `dev/` | How-to for maintainers | Local setup, deploy procedures, later rollover/backup |
| `architecture/` | Explanation / current truth (arc42) | Topology, runtime, concepts; not step-by-step runbooks |
| `decisions/` | ADRs | Architecture-level choices with alternatives |

Do not put command-level setup into arc42 chapters: [`architecture/07-deployment.md`](architecture/07-deployment.md) describes _what_ is deployed where; [`dev/go-live.md`](dev/go-live.md) is _how_ to set it up. New pages join one of the four homes above.

How work lands is defined below, once, and summarized for contributors in [`CONTRIBUTING.md`](../CONTRIBUTING.md). It is short on purpose: most changes to the website are content edits in Payload and never touch this repository.

## State ownership

The first question for any change: where does this truth live?

| Truth | Owner | Changed via |
| --- | --- | --- |
| Content: text, images, partners, speakers, jobs, team, FAQ | Payload CMS | Division editors in admin ([`editors/`](editors/)); agents/maintainers may propose **drafts** only via [`dev/content-sync.md`](dev/content-sync.md); only approvers Publish |
| CI content fixture (fake) | `apps/web/test/fixtures/ci-content/` | Regenerated via `pnpm content:fixture -- --from <snapshot dir>` |
| Media files | R2 (uploaded through Payload) | Payload uploads |
| Code: site, CMS schema, pages | This repo | PRs, reviewed |
| Visual identity: tokens, color, layout, components | [`apps/web/DESIGN.md`](../apps/web/DESIGN.md) | PRs, gated by `pnpm run check:design` |
| Architecture decisions | [`decisions/`](decisions/) | ADR PRs, append-only |
| Secrets, credentials | Provider dashboards, GitHub secrets | Never in git |

If someone asks for a change and it is content, route them to Payload (or the editor handbook); an issue or PR is the wrong tool.

## Code changes

1. An issue describes the change ([bug](../.github/ISSUE_TEMPLATE/bug.yml) or [change request](../.github/ISSUE_TEMPLATE/change-request.yml)); trivial fixes can go straight to a PR.
2. Branch, small diff, PR against protected `main`, one review (CODEOWNERS gates the sensitive paths).
3. **Same-PR rule:** every doc, diagram, or index the change invalidates is updated in the same PR. Docs describe the system as it is, never as it was.

## ADR discipline

An ADR is needed when a choice is architecture-level: new vendor, new package, paid service, data model change, anything expensive to reverse. The test: **were there two real options?** If yes, the decision earns a page in [`decisions/`](decisions/) (copy `_template.md`).

- Accepted ADRs are append-only. Wrong later? Write a superseding ADR and link both ways.
- Index every ADR in [`architecture/09-architecture-decisions.md`](architecture/09-architecture-decisions.md) in the same PR (CI-checked).
- Decisions we know we owe are listed in that same file; take one when its work starts.

## Diagram style

Diagrams are Mermaid, in-page, C4-flavored (Context/Container level): plain flowcharts with subgraphs, because GitHub renders those natively in READMEs and PRs. One diagram per view; small enough to review in a diff. Authoring rules: the **docs-diagrams** skill (`.agents/skills/docs-diagrams/`).
