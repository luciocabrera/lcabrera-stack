---
id: leaf-architecture-cleanup
title: Delete leaf ARCHITECTURE.md files that only restate the folder
owner: agent:claude
status: active
branch: docs/902-leaf-architecture-cleanup
area:
  - **/ARCHITECTURE.md
  - packages/ui/src/PATTERNS.md
  - .claude/rules/react-components.md
  - scripts/docs-paths-baseline.json
started: 2026-08-24
updated: 2026-08-24
plan: (none)
pr: #903
issue: #902
---

## What

Delete leaf ARCHITECTURE.md files that only restate the folder.
Keep system files (Table, Form, query builders, stores, package charters).

## Status / next

- Current step: classifying keep vs delete, then deleting
- Blockers: none
- Next: delete leaves, salvage unique why into inventory or a short comment if needed, fix docs:verify links
