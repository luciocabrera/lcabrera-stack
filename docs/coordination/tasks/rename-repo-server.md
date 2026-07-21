---
id: rename-repo-server
title: Rename the Node-only package to @repo/server and adopt kebab-case naming
owner: agent:claude
status: active
branch: refactor/rename-repo-server
area:
  - packages/server/**
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #146
---

## What

Renames the Node-only package (`packages/data-access`, `@repo/data-access`) to
`packages/server` / `@repo/server`, and moves its whole source tree to
kebab-case file names, matching `@repo/utils` and `@repo/api`.

The name follows the axis that actually divides these packages — **runtime**.
`@repo/api` is browser-safe, `@repo/utils` is pure, and this one is Node-only
(`pg`, `node:crypto`). `@repo/db` was the name originally filed on #146, but
`crypto/` and `tokens/` hold credential primitives with no SQL in them, so that
name would have misdescribed half the package.

Every import path in the repo that names this package changes, so the rename
and the kebab-case sweep run together rather than rewriting the same lines
twice.

Decision records are deliberately **not** rewritten: ADR-008 is a dated account
of the previous rename and says so itself. The new ADR on #145 supersedes it.

## Status / next

- Current step: file + package rename done, consumer sweep applied
- Blockers: none
- Next: regenerate tsconfigs, run the full gate, open the PR
