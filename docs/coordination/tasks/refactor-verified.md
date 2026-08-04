---
id: refactor-verified
title: Independent builder/verifier refactor loop (/refactor-verified)
owner: agent:claude
status: active
branch: chore/507-refactor-verified
area:
  - .github/skills/refactor-verified/**
  - .claude/agents/refactor-builder.md
  - .claude/agents/refactor-verifier.md
  - docs/agents/refactor-verified-contract.md
started: 2026-08-04
updated: 2026-08-04
plan: (none)
pr: (none)
issue: #507
---

## What

A `/refactor-verified <issue-number>` workflow in which the agent that implements
a change is not the agent that certifies it. A builder subagent claims and
implements; a separate verifier subagent receives only the diff and the issue's
§6, re-derives each criterion, and must prove a gate actually fires by planting a
deliberate violation. FAIL loops back to the builder, bounded at three rounds; the
PR is marked ready only on a PASS.

Ships the skill, two agent definitions, and the contract doc that owns the
evidence standard.

## Status / next

- Current step: skill, agents and contract written; index entries next
- Blockers: none
- Next: quality gate, then demonstrate the loop end to end on #311
