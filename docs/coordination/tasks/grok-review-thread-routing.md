---
id: grok-review-thread-routing
title: Grok catalog findings open review threads instead of body-only comments
owner: agent:copilot
status: review
branch: ci/1173-grok-review-thread-routing
area:
  - .github/workflows/grok-review.yml
  - .github/workflows/grok-review.prompt.md
  - scripts/lib/grok-review-workflow.test.mjs
started: 2026-09-10
updated: 2026-09-10
plan: (none)
pr: '#1174'
issue: #1173
---

## What

The catalog reviewer wrote findings with a path and a concrete fix into the
review body and left `grok-review-findings.json` empty, so nothing anchored and
no thread opened. The prompt now routes by severity, and the findings file is no
longer seeded with a valid empty answer.

## Status / next

- Current step: pushed, quality gate green, awaiting review
- Blockers: none
- Next: merge and delete this file
