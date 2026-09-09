---
id: grok-clean-code-review
title: Add a Grok clean-code catalog review on pull requests
owner: agent:grok
status: active
branch: ci/1149-grok-clean-code-review
area:
  - .github/workflows/grok-review.yml
  - .github/workflows/grok-review.prompt.md
  - scripts/lib/grok-review-workflow.test.mjs
  - scripts/lib/copilot-review-reviewers.test.mjs
  - packages/devkit/CLASSIFICATION.md
  - docs/tooling/copilot-review-gate.md
  - docs/agents/merge-checklist.md
  - docs/agents/agent-review-contract.md
  - COMMANDS.md
  - docs/decisions/ADR-116-a-grok-catalog-reviewer-posts-on-pull-requests-and-is-not-an-accepted-reviewer.md
started: 2026-09-09
updated: 2026-09-09
plan: (none)
pr: #1150
issue: #1149
---

## What

Add a Grok catalog reviewer on pull requests, posting under its own App and
not joining ACCEPTED_REVIEWERS. ADR-116.

## Status / next

- Current step: implementation in progress
- Blockers: operator must create the Grok reviewer GitHub App and add
  `XAI_API_KEY`, `GROK_REVIEWER_APP_ID`, `GROK_REVIEWER_APP_PRIVATE_KEY`
- Next: quality gate, draft PR, operator secrets
