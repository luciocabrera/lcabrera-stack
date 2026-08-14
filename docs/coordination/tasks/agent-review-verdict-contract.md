---
id: agent-review-verdict-contract
title: Define the agent code-review verdict contract
owner: agent:claude
status: active
branch: docs/696-agent-review-verdict-contract
area:
  - docs/agents/agent-review-contract.md
  - docs/agents/merge-checklist.md
  - docs/README.md
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: #702
issue: #696
---

## What

Write the contract the CI agent code reviewer must satisfy before epic #685 lets
it block a merge: the JSON verdict schema and the single field the gate reads,
the severity model and the blocking threshold, the reviewer's input boundary, the
admissibility bar a blocking finding must clear, the override path, and the
prohibitions.

Prose only — the workflow, the prompt and the verdict validator are #697.

## Status / next

- Current step: contract written; merge checklist and the docs map link it
- Blockers: none
- Next: gate, push, ready the PR
