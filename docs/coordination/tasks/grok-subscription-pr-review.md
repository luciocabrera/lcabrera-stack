---
id: grok-subscription-pr-review
title: Review pull requests with the Grok subscription
owner: agent:grok
status: review
branch: ci/1375-grok-subscription-pr-review
area:
  - .github/workflows/grok-pr-review.yml
  - scripts/lib/grok-pr-review-workflow.test.mjs
  - COMMANDS.md
  - docs/tooling/copilot-review-gate.md
  - packages/devkit/CLASSIFICATION.md
started: 2026-10-16
updated: 2026-10-16
plan: (none)
issue: '#1375'
---

## What

Add a pull-request workflow that reviews with the grok.com session in
`GROK_AUTH_JSON`, and leave the catalog reviewer on `XAI_API_KEY`.

## Status / next

- Current step: open the pull request and set the Actions secret.
- Blockers: none.
- Next: merge once the required checks are green.
