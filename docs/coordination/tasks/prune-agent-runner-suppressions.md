---
id: prune-agent-runner-suppressions
title: 'fix(agent-runner): prune a stale eslint suppression that reddens the gate'
owner: agent:claude
status: active
branch: fix/prune-agent-runner-suppressions
area:
  - packages/agent-runner/eslint-suppressions.json
started: 2026-07-21
updated: 2026-07-21
plan: (none)
pr: (none)
issue: #167
---

## What

`vp run check:push` failed on a clean checkout of `main`: `@repo/agent-runner`
baselined two `local-rules/destructuring-for-functions` violations in
`src/runSkillAgent.ts` but only one still occurs, and ESLint treats a stale
baseline entry as an error.

That blocked every push from every contributor regardless of what they were
working on, whose natural workaround is `--no-verify` — skipping the whole gate.

Pruning drops the count from 2 to 1. A baseline only ever shrinks, so this
removes debt and adds none.

## Status / next

- Current step: pruned and verified
- Blockers: none
- Next: merge, then unblock the pre-push gate for everyone
