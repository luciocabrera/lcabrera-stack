---
id: adr-index-no-conflict
title: Stop the generated ADR index conflicting between concurrent ADRs
owner: agent:claude
status: active
branch: chore/724-adr-index-no-conflict
area:
  - scripts/verify-adrs.mjs
  - scripts/new-adr.mjs
  - scripts/lib/adr*
  - docs/decisions/README.md
  - docs/decisions/ADR-075-*.md
  - docs/cqms/decisions/README.md
  - apps/react-router/docs/decisions/README.md
started: 2026-08-15
updated: 2026-08-15
plan: (none)
pr: '#726'
issue: #724
---

## What

Stop the generated ADR index conflicting between concurrent ADRs.

Each home's `README.md` stops carrying a row per ADR — that row was the one
region every ADR branch appended to, so any two concurrent ADRs conflicted on it
however carefully their numbers were sequenced. `vp run adr:list` produces the
listing on demand. ADR-075 records the decision and why `merge=union` was
rejected on evidence.

## Status / next

- Current step: implemented; gate running
- Blockers: none
- Next: push, update PR #726, leave it draft for the verifier
