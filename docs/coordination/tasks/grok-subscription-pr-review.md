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
  - docs/decisions/ADR-135-a-grok-subscription-reviewer-posts-with-the-runner-token-and-is-not-an-accepted-reviewer.md
started: 2026-10-16
updated: 2026-10-17
plan: (none)
issue: #1375
---

## What

Add a pull-request workflow that reviews with the grok.com session in
`GROK_AUTH_JSON`, and leave the catalog reviewer on `XAI_API_KEY`.

## Status / next

- Current step: the model step denies Edit on scripts/ and packages/, and the Read rules that match a home file outside cwd are the /** spellings.
- Blockers: the required checks restart on this commit, and Copilot review complete waits on a review of the new head.
- Next: reply on the open thread, then merge once those checks are green and the threads are resolved.
