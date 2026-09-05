---
id: harness-conformance
title: structural conformance for skills, rules and subagents
owner: agent:claude
status: review
branch: feat/1071-harness-conformance
area:
  - scripts/validate-skills.cjs
  - scripts/validate-skills.test.mjs
  - scripts/verify-harness-conformance*
  - scripts/lib/validate-skills-contract.cjs
  - scripts/lib/conformance*
  - scripts/ARCHITECTURE.md
  - .github/workflows/check-safe.yml
  - .github/ARCHITECTURE.md
  - .claude/README.md
started: 2026-09-05
updated: 2026-09-05
plan: (none)
pr: '#1090'
issue: #1071
---

## What

structural conformance for skills, rules and subagents

## Status / next

- Current step: review findings addressed — link resolution split back apart,
  the concrete-token regex made linear, count labels singularised
- Blockers: none
- Next: reviewers re-read, then the orchestrator readies the PR
