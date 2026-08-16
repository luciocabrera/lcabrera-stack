---
id: agent-review-verdict-check
title: Validate a head-bound agent-review verdict on every PR
owner: agent:claude
status: review
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

- Current step: PR #727 is green and every state the check reports — `absent`,
  `pass`, stale, `fail`, `error` — has been observed on this pull request in
  Actions, with the evidence on #697. Left as a draft, per dispatch.
- Blockers: none
- Next: review, then merge. Promotion to a blocking check and the `absent`
  policy are #698, not this task.
