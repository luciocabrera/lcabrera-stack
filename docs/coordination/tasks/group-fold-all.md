---
id: group-fold-all
title: Expand and collapse every group at once
owner: agent:claude
status: review
branch: chore/774-group-fold-all
area:
  - packages/ui/src/components/Table/contexts/TableConfig/expansion/**
  - packages/ui/src/components/Table/TableHeaderCell/TableHeaderActionsMenu/GroupActions/**
  - packages/ui/src/components/Table/commands/grouping/**
  - packages/ui/src/components/Table/hooks/**
started: 2026-08-19
updated: 2026-08-19
plan: (none)
pr: #813
issue: #774
---

## What

Expand-all and collapse-all over a grouped body, in the column header's grouping
section. Collapse-all folds to the outermost level rather than to nothing.

Carries a correction to #802's fold model, recorded as
[ADR-083](../../decisions/ADR-083-a-fold-must-leave-a-row-to-undo-it.md): a level
is foldable only where a row survives the fold, so a `flat` grid — which emits no
ancestor rows — no longer offers a chevron that would hide a group irreversibly.

## Status / next

- Current step: implemented, ui suite green, awaiting the full gate + review
- Blockers: none
- Next: quality gate, push, address review
