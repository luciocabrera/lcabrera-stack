---
id: no-habit-return-types
title: feat(eslint-local-rules): enforce Rule 9 with a no-habit-return-types rule
owner: agent:claude
status: review
branch: chore/963-no-habit-return-types
area:
  - packages/eslint-local-rules/**
  - packages/vite-configs/**
started: 2026-08-26
updated: 2026-08-26
plan: (none)
pr: '#975'
issue: #963
---

## What

feat(eslint-local-rules): enforce Rule 9 with a no-habit-return-types rule

## Status / next

- Current step: the rule reports only the four shapes where nothing can be
  hidden, so a deliberate widening is never flagged and there is no escape hatch
  to design. Enabled in both shared configs; twelve findings auto-fixed. Proving
  it loads took three probes — the first two proved nothing.
- Review round 1: the `void` arm's reachability test looked at the block's
  direct children only, so five shapes whose end point is unreachable — both
  `if`/`else` arms throwing, a `switch` `default` that throws, `for (;;)`,
  `while (true)`, a throwing `finally` — inferred `never` and were auto-narrowed
  from `void`. The test now walks the body. Each of the five is pinned as a
  `valid` case, and all five fail against the previous guard.
- Blockers: none
- Next: review rounds on #975, then merge.
