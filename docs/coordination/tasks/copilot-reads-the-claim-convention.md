---
id: copilot-reads-the-claim-convention
title: Stop Copilot reporting the coordination claim file as a mistake
owner: agent:claude
status: review
branch: chore/1130-copilot-reads-the-claim-convention
area:
  - .github/instructions/**
started: 2026-09-09
updated: 2026-09-09
plan: (none)
pr: #1131
issue: #1130
---

## What

Copilot code review keeps reporting the coordination claim file as something
that should not have been merged (#1097, #1063, #1128). The rule is in
`AGENTS.md`, but that file is 52 KB and Copilot reads it as the repository-wide
instructions, so the paragraph never reaches a review. A path-scoped
`.github/instructions/` file scoped to `docs/coordination/**` does reach it.

## Status / next

- Current step: gate green, PR open for review
- Blockers: none
- Next: merge, then watch the next PR carrying a claim to see whether the flag
  stops
