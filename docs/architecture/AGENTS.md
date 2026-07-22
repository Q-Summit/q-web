# Architecture (arc42)

Always-current truth for how the system works right now, one file per chapter of [arc42](https://arc42.org/overview), the standard 12-chapter architecture template. The stack is decided ([ADR-0001](../decisions/0001-astro-static-site.md) through [ADR-0005](../decisions/0005-google-sso-group-roles.md), indexed in [09](09-architecture-decisions.md)); chapters describe the decided design and must track the build as it lands. Docs-wide rules: [`../AGENTS.md`](../AGENTS.md).

## Chapter map

| Chapter | Holds | Filled by |
| --- | --- | --- |
| 01 introduction and goals | Requirements, quality goals, stakeholders | Edits only when the framing itself changes |
| 02 constraints | Organizational, technical, and legal constraints | Edits only when the framing itself changes |
| 03 context and scope | System context, external interfaces, scope | ADRs that change the topology |
| 04 solution strategy | Goal-to-approach mapping | ADRs that change strategy |
| 05 building blocks | Durable structure (C4 container/component) | PRs that add or change packages and collections |
| 06 runtime | Durable behavior (sequence/flow diagrams), including content-sync propose | PRs that change the publish, propose, or build flow |
| 07 deployment | Infrastructure and release topology (not runbooks; those live in [`../dev/`](../dev/)) | Deployment ADRs and config PRs |
| 08 concepts | Content model, authorization, crosscutting rules | PRs that change the Payload schema or access rules |
| 09 decisions | ADR index plus owed-decisions list | Same PR as each ADR (CI-checked) |
| 10 qualities | Stimulus-response scenarios | Changes that introduce a new quality |
| 11 risks and debt | Risk register, named shortcuts | PRs that take or pay off a shortcut |
| 12 glossary | One-line terms | The first doc that relies on a term |

## ALWAYS

- H1 is `# N · <title>`, matching the `NN-` filename prefix; chapter numbers stay stable.
- A stub is its header plus one line naming what fills it; update that line when the blocker changes.

## NEVER

- Pad a stub with invented content, speculative structure, or placeholder diagrams; empty is information.
- Reason about the docs setup inside chapter files (meta blockquotes, authoring notes); that guidance lives here.
- Put step-by-step setup, deploy checklists, or credential runbooks here; those belong in [`../dev/`](../dev/).
- Renumber, merge, or delete chapters.
