---
id: copilot-suppressed-comments
title: Surface Copilot's suppressed review comments
owner: agent:claude
status: review
branch: ci/750-copilot-suppressed-comments
area:
  - scripts/copilot-*.mjs
  - scripts/lib/copilot-*.mjs
  - docs/tooling/copilot-review-gate.md
  - docs/decisions/ADR-078-*.md
started: 2026-08-17
updated: 2026-08-17
plan: (none)
pr: #754
issue: #750
---

## What

Read the findings Copilot suppresses into a review body — where conversation
resolution, the merge bar, never sees them — and report them beside the
`Copilot review complete` gate. They report and never block (ADR-078), and the
reader answers with a state rather than a count, so "nothing was suppressed" and
"nothing could be read" stop looking alike.

## Status / next

- Current step: implemented, gate green, in review
- Blockers: none
- Next: address review findings, then close the claim on merge
