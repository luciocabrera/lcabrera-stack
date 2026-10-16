---
id: grok-subscription-pr-review
title: Review pull requests with the Grok subscription
owner: agent:grok
status: review
branch: ci/1375-grok-subscription-pr-review
area:
  - .github/workflows/grok-pr-review.yml
  - .github/workflows/grok-pr-review.prompt.md
  - scripts/lib/grok-pr-review-workflow.test.mjs
  - docs/tooling/copilot-review-gate.md
  - packages/devkit/CLASSIFICATION.md
started: 2026-10-16
updated: 2026-10-16
plan: (none)
issue: #1375
---

## What

Add a pull-request workflow that reviews with the grok.com session in
`GROK_AUTH_JSON`, and leave the catalog reviewer on `XAI_API_KEY`.

## Status / next

- Current step: the review threads asked for the pinned CLI, and that is what the branch now runs.
- Blockers: none.
- Next: reply on the threads, then merge once the required checks are green.
