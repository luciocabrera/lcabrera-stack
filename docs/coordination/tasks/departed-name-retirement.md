---
id: departed-name-retirement
title: retire the departed products' names, and gate their return
owner: agent:claude
status: review
branch: chore/947-departed-name-retirement
area:
  - docs/decisions/**
  - apps/react-router/docs/decisions/**
  - docs/agents/**
  - docs/README.md
  - scripts/**
  - packages/**
  - .github/skills/**
started: 2026-08-25
updated: 2026-08-25
plan: (none)
pr: '#948'
issue: #947
---

## What

retire the departed products' names, and gate their return

## Status / next

- Current step: complete, in review — `vp run check:safe` green in the worktree
- Blockers: none
- Next: address review, then merge

## Scope note

`CHANGELOG.md` is deliberately untouched and excluded from the gate: it is
regenerated from git commit subjects (`vp run changelog:generate`), so a
hand-edit is reverted by the next run and the subjects themselves are immutable
history.
