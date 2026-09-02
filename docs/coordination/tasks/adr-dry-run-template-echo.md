---
id: adr-dry-run-template-echo
title: The ADR scaffold's dry run prints the template file it read
owner: agent:claude
status: active
branch: fix/1056-adr-dry-run-template-echo
area:
  - packages/repo-standards/scripts/adr-scaffold*
  - packages/repo-standards/scripts/new-adr.mjs
started: 2026-09-02
updated: 2026-09-02
plan: (none)
pr: (none)
issue: #1056
---

## What

`repo-adr --dry-run` printed the rendered record, so it wrote the bytes of the
ADR template — a file whose directory the host repository sets through
`registers.adrTemplateHome` — to stdout. SonarCloud flags the flow as
`jssecurity:S8689`, and it is the only open issue behind `main`'s failing
quality gate (`new_security_rating` 4 against a threshold of 1).

The dry run now prints the path, the number and the title, and nothing sourced
from the template.

## Status / next

- Current step: fix written, tested, and the API-surface snapshot regenerated;
  running the full gate.
- Blockers: none
- Next: push, open the PR, and re-read `vp run sonar:report -- --branch main`
  once the merge is analysed.
