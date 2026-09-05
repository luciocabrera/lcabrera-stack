---
id: harness-classification
title: classify every harness file by profile and by update path
owner: agent:claude
status: active
branch: chore/1070-harness-classification
area:
  - packages/devkit/CLASSIFICATION.md
  - docs/decisions/**
started: 2026-09-05
updated: 2026-09-05
plan: (none)
pr: '#1089'
issue: #1070
---

## What

Record two verdicts per harness file in `packages/devkit/CLASSIFICATION.md` —
which profile rung it lands on, and whether it updates by `sync` or by version
bump — and write both sorting criteria down. ADR-109 carries the update-path
criterion.

## Status / next

- Current step: round 4 — the path-rule rows re-derived from their own `paths:` frontmatter
- Blockers: none
- Next: push, then hold for the verifier
