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
- Review rounds 1-3, all on the same question: when does a body infer `never`
  rather than `void`. The first two fixes were blunt (any `throw` disqualifies,
  then two of four endless-loop spellings) and each left shapes that were still
  auto-narrowed. The blunt version also cost nearly all the rule's reach, since
  most `void` bodies here are guard clauses. The arm now computes whether the
  body can reach its bottom, the way the compiler does, so guard clauses are
  reported again and every unreachable shape is left alone.
- Known limitation, deliberate and documented in the rule, the README and the
  changeset: a call to a `(): never` function (`process.exit(1)`) also makes the
  bottom unreachable, and deciding that needs a type checker this plugin has
  not. Pinned as an `invalid` case named as a limitation so it cannot be lost.
- Measured rather than asserted: with the twelve fix sites reverted,
  `packages/server` alone reports 11 findings under the new check and 0 under the
  blunt one.
- Blockers: none
- Next: review rounds on #975, then merge.
