---
id: single-source-quality-gate
title: Single-source the quality gate in its skill and restore the React Doctor stage
owner: agent:claude
status: active
branch: fix/670-single-source-quality-gate
area:
  - .github/skills/quality-gate-workflow/**
  - .claude/skills/quality-gate-workflow/**
  - AGENTS.md
  - docs/agents/**
started: 2026-08-14
updated: 2026-08-14
plan: (none)
pr: (none)
issue: 670
---

## What

The gate sequence was written twice — `AGENTS.md` § Post-Change Quality Gate and
the `quality-gate-workflow` skill — and the copies drifted: the skill's "Canonical
Gate Order" omitted `vp run react-doctor:verify`, a **blocking** stage (ADR-055).
Since `AGENTS.md` tells agents to invoke the skill, following the instruction ran a
gate missing that check.

Restores the stage to the skill with its rationale, moves the Documentation Update
Rule there too, and reduces `AGENTS.md` to a pointer so there is one copy to drift
from. Repoints the five docs that referenced the relocated sections.

`.claude/skills/` and `.github/skills/` are hardlinks to the same files, so the
`area` globs list both paths for the soft lock even though one edit covers both.

## Status / next

- Current step: implemented; doc gates green; PR open for review.
- Blockers: none.
- Next: address review findings, then merge and delete this file.
