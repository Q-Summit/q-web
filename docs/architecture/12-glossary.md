# 12 · Glossary

<!-- arc42 section 12: shared vocabulary. -->

The terms the docs and issues assume you know. Domain terms land here when the first docs that need them arrive.

## Domain

| Term | Meaning |
| --- | --- |
| **Division** | An organizational unit of Q-Summit e.V. (for example partners, PR, program). Each division edits its own content in the CMS under its own accounts. |
| **Editor** | A division member with a personal, scoped Payload account. Edits drafts; cannot publish without approval. |
| **Approver** | Someone with publish rights; the gate between drafts and the live site. |
| **Edition** | One conference year's content. New editions are created alongside the current one; past editions archive themselves. |
| **Collection** | A content type in Payload (partners, speakers, jobs, team, FAQ, pages). |

## Process and docs

| Term | Meaning |
| --- | --- |
| **ADR** | Architecture Decision Record in [`../decisions/`](../decisions/): a system-wide decision chosen among alternatives. Append-only. |
| **arc42** | The standard architecture doc template ([arc42.org](https://arc42.org/overview)) structuring `architecture/`. Always describes the system as it works right now. |
| **C4** | A way to describe software at four zoom levels (context, container, component, code). Our diagrams are plain flowcharts styled at the context/container level. |
| **Same-PR rule** | Every doc a change invalidates is updated in the same PR ([`../README.md`](../README.md)). |

## Platform

| Term | Meaning |
| --- | --- |
| **Astro** | The static site framework for `apps/web`; builds all pages to plain HTML at deploy time. |
| **Payload** | The open-source (MIT) CMS for `apps/cms`; where all content lives and editors work. |
| **Neon** | Managed Postgres (Frankfurt) backing Payload. |
| **R2** | Cloudflare object storage for media, S3-compatible. |
| **PostHog** | Cookieless analytics, EU cloud; the reason the site needs no consent banner ([ADR-0003](../decisions/0003-posthog-cookieless-analytics.md)). |
| **Deploy hook** | The URL Payload calls on publish to trigger a Cloudflare rebuild ([section 6](06-runtime.md)). |
| **vivenu** | The external ticketing provider; the site only links out to it. |
