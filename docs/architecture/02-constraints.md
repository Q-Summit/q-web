# 2 · Constraints

<!-- arc42 section 2: organizational, technical, and legal constraints. -->

| Constraint | Consequence |
| --- | --- |
| Volunteer team, yearly board turnover | Boring, documented stack; docs land in the same PR as the change; everything configured in git, not in clicks |
| Near-zero budget | About EUR 0/month ([ADR-0001](../decisions/0001-astro-static-site.md), [ADR-0002](../decisions/0002-payload-cms-on-vercel-neon.md), [ADR-0003](../decisions/0003-posthog-cookieless-analytics.md)); any paid service needs an ADR |
| Annual cycle: ticket sales open in January, event week early April | Risky changes happen off-season (roughly May to October); freeze before and during the sales and event window |
| German e.V. operating a public website, EU visitors | GDPR: Impressum and Datenschutzerklaerung pages required; cookieless analytics ([ADR-0003](../decisions/0003-posthog-cookieless-analytics.md)); self-hosted fonts and assets; EU data regions where possible; DPAs with all sub-processors (tracked offsite) |
| Divisions own their content | Per-division CMS accounts with scoped access and an approval gate; no shared logins |
| Content must survive the yearly changeover | Editions model: next year's content is created alongside the current year's, past years archive themselves |
| English only in the repo | Code, docs, issues, commits (site content itself may be German or English) |
