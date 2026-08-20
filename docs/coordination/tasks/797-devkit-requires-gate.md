---
id: 797-devkit-requires-gate
title: Enforce a skill's declared config requirements
owner: agent:claude
status: review
branch: feat/797-797-devkit-requires-gate
area:
  - packages/devkit/scripts/**
  - packages/devkit/ARCHITECTURE.md
  - packages/devkit/CLASSIFICATION.md
  - packages/devkit/README.md
started: 2026-08-20
updated: 2026-08-20
plan: (none)
pr: https://github.com/luciocabrera/vite-react-compiler/pull/840
issue: #797
---

## What

Issue #797 wave 2, the `requires:` half: a shipped file declares the config keys
it cannot run without, `sync` refuses to write it into a consumer who has not set
them, and `closure` reports a declaration naming a key outside the config's key
space as a fourth kind of escape.

Not in this task: the `peer:` range and `doctor --accept`, which are the other
two of wave 2's three sequenced changes.

## Status / next

- Current step: verified; the two non-blocking findings from that round are
  fixed — the frontmatter extractor now reads every ordinary YAML spelling of
  the list, and the counts written into `CLASSIFICATION.md` prose are gone
- Blockers: none
- Next: review

## Coordination

`797-adr-081-addendum` (branch `chore/797-797-adr-081-addendum`) also claims
`packages/devkit/CLASSIFICATION.md`. The overlap is real but the edits are in
different regions — that task records rejected alternatives, this one adds the
hard/soft dependency column its §6 criterion requires. Whichever merges second
rebases.
