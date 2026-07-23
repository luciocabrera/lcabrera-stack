---
id: virtual-select-fill-runaway
title: VirtualSelect infinite-scroll fetches forever when a client filter empties the loaded list
owner: agent:claude
status: review
branch: fix/363-virtual-select-fill-runaway
area:
  - packages/ui/src/components/VirtualList/**
  - packages/ui/src/hooks/useInfiniteScrollObserver.hook.*
started: 2026-07-23
updated: 2026-07-23
plan: (none)
pr: '#364'
issue: #363
---

## What

VirtualSelect infinite-scroll fetches forever when a client filter empties the loaded list

## Status / next

- Current step: fix implemented, quality gate green, PR #364 open for review
- Blockers: none
- Next: merge PR #364; delete this task file on merge
