---
id: publishing-hygiene
title: Publishing hygiene for the public packages: LICENSE, files, peer dependencies
owner: agent:claude
status: review
branch: publishing-hygiene
area:
  - packages/ui/package.json
  - packages/api/package.json
  - packages/server/package.json
  - packages/utils/package.json
  - AGENTS.md
  - LICENSE
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: #225
issue: #224
---

## What

The publish-correctness fixes that are wrong today regardless of when the four
public packages actually ship: no licence, tarballs carrying tests and configs,
and React declared as an ordinary dependency.

Deliberately excludes everything needing a decision or a build — the npm scope
rename, the `dist` build, and Changesets. All four packages stay `private: true`.

## Status / next

- Current step: done, PR #225 open for review
- Blockers: none
- Next: close when merged. Follow-on work is the StyleX distribution spike, then
  the scope rename (needs the npm scope name decided), then the build.
