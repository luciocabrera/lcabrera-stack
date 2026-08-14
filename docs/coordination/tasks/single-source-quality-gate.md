---
id: single-source-quality-gate
title: Single-source the quality gate in its skill and restore the React Doctor stage
owner: agent:claude
status: review
branch: fix/670-single-source-quality-gate
area:
  - .github/skills/quality-gate-workflow/**
  - .claude/agents/quality-gate.md
  - AGENTS.md
  - COMMANDS.md
  - docs/agents/**
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: 671
issue: 670
---

## What

The gate sequence was written in four places — `AGENTS.md`, the
`quality-gate-workflow` skill, that skill's `references/daily-practice.md`, and the
`quality-gate` subagent template — and they drifted. Only `AGENTS.md` listed
`vp run react-doctor:verify`, a **blocking** stage (ADR-055); the other three
listed seven stages and never mentioned it. Since `AGENTS.md` tells agents to
invoke the skill, following the instruction ran a gate missing that check.

Restores the stage to the three copies that lacked it, makes the skill the single
canonical definition, and reduces `AGENTS.md` and `COMMANDS.md` to a pointer plus
(in COMMANDS.md) the gated command table that file exists to be.

Note on `area`: `.claude/skills` is a git-tracked **symlink** to `.github/skills`,
so no tracked path exists below `.claude/skills/` and a glob there can never match
a changed file. Only the `.github/skills/**` form is a real lock.

## Status / next

- Current step: `/code-review` findings addressed in a second commit.
- Blockers: none.
- Next: merge and delete this file.
