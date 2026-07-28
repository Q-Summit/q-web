# Docs

Work under `docs/`. Process and homes: [`README.md`](README.md). Nested leaves: [`architecture/AGENTS.md`](architecture/AGENTS.md), [`dev/AGENTS.md`](dev/AGENTS.md), [`editors/AGENTS.md`](editors/AGENTS.md).

## ALWAYS

- Copy `decisions/_template.md` for a new ADR; keep the required H2s in template order; delete the template comments before the PR.
- ADRs: the Status and Date bullets, filename `NNNN-kebab-slug.md`.
- Same PR: ADR index in `architecture/09-architecture-decisions.md`.
- Mark architecture claims as current, or as direction / TBD / owed ADR.
- Mermaid via **docs-diagrams**; caption states the takeaway.
- Anything about styling, tokens, or the `ui/` primitives belongs in [`../apps/web/DESIGN.md`](../apps/web/DESIGN.md), not here; load the **design-system** skill before citing a rule ID.
- Place new pages by audience: non-developers -> `editors/`; maintainer how-tos -> `dev/`; current system truth -> `architecture/`; architecture choices -> `decisions/`.
- Root tooling catalog (purpose folders `local/` `content/` `check/` `preview/` `ops/`): [`dev/scripts.md`](dev/scripts.md).
- `pnpm run check` runs from the repo root, not from `docs/`.

## PREFER

- Glossary row only when a term is first used.
- When a change introduces a new quality, add a one-line stimulus/response scenario to `architecture/10-quality-requirements.md`; keep the list short.
- Keep arc42 chapters free of runbook steps; link to `dev/` instead.
- Thin nested AGENTS in `dev/` and `editors/` for local scars; do not restate this file there.

## NEVER

- New directories under `docs/` beyond `editors/`, `dev/`, `decisions/`, and `architecture/`.
- Put step-by-step setup or deploy checklists into arc42 chapters (those belong in `dev/`).
- Edit accepted ADRs (supersede instead).
- Freestyle ADR sections.
- Fill empty arc42 sections for completeness.
- Invent vendors, flows, or schemas past accepted ADRs.
- Real PII in examples.
- Restate `README.md`'s process rules here.
