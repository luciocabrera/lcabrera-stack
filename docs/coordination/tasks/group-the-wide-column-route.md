---
id: group-the-wide-column-route
title: Prove grouping genericity on the wide-column route
owner: agent:claude
status: review
branch: feat/575-group-the-wide-column-route
area:
  - apps/react-router/src/routes/wide-alltypes-150/**
started: 2026-08-19
updated: 2026-08-19
plan: (none)
pr: 812
issue: #575
---

## What

Give the wide-column route grouping, to prove the feature is generic over any
SQL-backed route (#575). Adoption is a loader flag plus a service function; no
grouping shape is restated in the app, which is only true because #643 landed
first.

## Status / next

- Current step: implemented, full quality gate green, PR open for review
- Blockers: none
- Next: address review, then merge
