---
id: decode-grouped-rows
title: Promote grouped-read decoding into a package entry point
owner: agent:claude
status: review
branch: refactor/643-decode-grouped-rows
area:
  - packages/server/src/db/olap/**
  - apps/react-router/src/routes/enterprise-orders/.server/**
started: 2026-08-19
updated: 2026-08-19
plan: (none)
pr: 810
issue: #643
---

## What

Promote the last generic pieces of the grouped-read path — the `count(*)`-first
aggregate convention, its decode, and the grouped ORDER BY derivation — out of
`enterprise-orders` and into `@lcabrera/server/db/olap`. Completes #643, whose
first three files moved under #796/ADR-082.

## Status / next

- Current step: implemented, full quality gate green, PR #810 open for review
- Blockers: none
- Next: address review, then merge — this precedes #575
