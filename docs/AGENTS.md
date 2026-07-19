# Docs

Work under `docs/`. Process and homes: [`README.md`](README.md). arc42 chapter rules: [`architecture/AGENTS.md`](architecture/AGENTS.md).

## ALWAYS

- Copy `decisions/_template.md` for a new ADR; keep the required H2s in template order; delete the template comments before the PR.
- ADRs: the Status and Date bullets, filename `NNNN-kebab-slug.md`.
- Same PR: ADR index in `architecture/09-architecture-decisions.md`.
- Mark architecture claims as current, or as direction / TBD / owed ADR.
- Mermaid via **docs-diagrams**; caption states the takeaway.
- Place new pages by audience: readers who should not need to know what a repository is go in `editors/`; developer docs go in `decisions/` or `architecture/`; rare-ops pages land flat under `docs/` when their work first happens.
- Editor-facing docs (`editors/`) are written for non-developers: plain language, no repo jargon (no PR, CI, repo, markdown).
- `pnpm run check` runs from the repo root, not from `docs/`.

## PREFER

- Glossary row only when a term is first used.
- When a change introduces a new quality, add a one-line stimulus/response scenario to `architecture/10-quality-requirements.md`; keep the list short.

## NEVER

- New directories under `docs/` (`editors/`, `decisions/`, `architecture/` are the complete set).
- Edit accepted ADRs (supersede instead).
- Freestyle ADR sections.
- Fill empty arc42 sections for completeness.
- Invent vendors, flows, or schemas past accepted ADRs.
- Real PII in examples.
- Restate `README.md`'s process rules here.
