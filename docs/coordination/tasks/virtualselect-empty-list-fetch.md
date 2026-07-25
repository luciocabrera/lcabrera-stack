---
id: virtualselect-empty-list-fetch
title: Stop VirtualSelect fetching pages while the option list renders empty
owner: agent:claude
status: review
branch: fix/432-virtualselect-empty-list-fetch
area:
  - packages/ui/src/components/VirtualList/**
started: 2026-07-25
updated: 2026-07-25
plan: (none)
pr: #433
issue: #432
---

## What

The infinite-scroll sentinel is an in-flow sibling of the body content, so with
no rows rendered its 1px is the scroll container's only overflow — enough to
paint a scrollbar over "No options found" and to satisfy
`useInfiniteScrollObserver`'s `scrollHeight <= clientHeight` test as a real
scrolled-to-bottom, which walked the whole dataset. The sentinel now renders and
arms only in the `list` content mode.

## Status / next

- Current step: implemented, full quality gate green, PR #433 ready for review
- Blockers: none
- Next: merge
