---
id: grouping-guard-rails
title: Grouping guard rails, timeout and cancellation error
owner: agent:claude
status: active
branch: chore/573-grouping-guard-rails
area:
  - packages/server/**
  - apps/react-router/src/routes/enterprise-orders/**
  - apps/react-router/src/.server/**
started: 2026-08-13
updated: 2026-08-13
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/656
issue: #573
---

## What

Grouping guard rails, timeout and cancellation error (#573): cardinality
estimation with warn/refuse thresholds, the row-limit backstop, a
transaction-scoped `statement_timeout`, `QueryCanceledError`, and the plain
serializable error union the loader edge returns instead of an error class.

`apps/react-router/src/.server/**` is claimed because the live-Postgres proof of
the timeout belongs beside the sibling grouping smoke suites there — the
package's own suite is DB-free by ADR-032.

## Status / next

- Current step: implementing
- Blockers: none
- Next: full quality gate, then ready for review
