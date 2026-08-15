---
id: agent-review-verdict-check
title: Validate a head-bound agent-review verdict on every PR
owner: agent:claude
status: active
branch: ci/697-agent-review-verdict-check
area:
  - .github/workflows/agent-review-verdict.yml
  - scripts/verify-agent-review.mjs
  - scripts/lib/agent-review*
  - .claude/agents/refactor-verifier.md
  - docs/agents/agent-review-contract.md
  - docs/agents/epic-orchestration.md
  - docs/agents/merge-checklist.md
  - .github/skills/refactor-verified/SKILL.md
started: 2026-08-15
updated: 2026-08-15
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/727
issue: #697
---

## What

Publish an advisory `Agent review verdict` check that validates — never produces
— the agent-review verdict posted for a pull request's current head (#697), and
make `refactor-verifier` emit that verdict alongside its prose report.

## Status / next

- Current step: implemented and green; exercising the check's four states on
  this pull request itself, since a green run on good code and a check that is
  not wired up look identical.
- Blockers: none
- Next: finish the state probes, record them on #697, then hand to review.
  Promotion to a blocking check is #698, not this task.
