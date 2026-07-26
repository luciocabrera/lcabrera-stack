---
id: react-doctor-gate
title: Adopt react-doctor as an enforced quality gate
owner: agent:claude
status: review
branch: chore/456-react-doctor-gate
area:
  - doctor.config.jsonc
  - scripts/verify-react-doctor.mjs
  - scripts/lib/suppressions-react-doctor.mjs
  - scripts/lib/jsonc.mjs
  - docs/decisions/ADR-055-*
  - docs/agents/react-doctor-triage.md
started: 2026-07-26
updated: 2026-07-26
plan: (none)
pr: #457
issue: #456
---

## What

Adopt react-doctor as an enforced quality gate

## Status / next

- Current step: implementation complete, `check:push` green — in review
- Blockers: none
- Next: land, then triage the remaining advisory warnings

## Coordination

Deliberately **out of scope**, because they belong to work already claimed:

- `packages/ui/**/ColumnOrderSection/**` and the `js-set-map-lookups` /
  `js-combine-iterations` findings — `react-doctor-combine-iterations`,
  `real-array-bench-poc` (#454) and `array-op-hierarchy` (#452) own the array
  rule families. Nothing here fixes one; they stay advisory warnings under this
  gate, which is exactly what lets those tasks land independently.

Two overlaps resolved rather than left as warnings:

- **ADR number.** This was written as ADR-054 and renumbered to **ADR-055**:
  `array-op-hierarchy` (#452, PR #453) claimed `docs/decisions/ADR-054-*` first
  and already has `ADR-054-array-operation-hierarchy.md` on its branch. Whoever
  merges second should re-run `vp run adr:verify` — the gate catches a reused
  number, but only once both are on `main`.
- **`docs/agents/react-doctor-triage.md`** is also claimed by
  `real-array-bench-poc`. Edits here are confined to the header (two claims in it
  were factually wrong once the tool became enforced) and a new
  `no-barrel-import` section; the `js-combine-iterations` section that task will
  extend is untouched, so the two should merge cleanly.

`react-doctor-combine-iterations.md` is stale — PR #450 merged and its branch is
gone from origin, so `coordination:verify` warns on it. Left for its owner to
delete rather than closed out from here.
