---
id: biome-warnings-cleanup
title: clear the standing biome warnings
owner: agent:claude
status: active
branch: chore/873-biome-warnings-cleanup
area:
  - scripts/lib/claude-review-workflow.test.mjs
  - scripts/lib/renamed-mentions.mjs
started: 2026-08-21
updated: 2026-08-21
plan: (none)
pr: #874
issue: #873
---

## What

Clear the biome findings standing on `main`. `lint:biome:check` is `biome lint .`,
which exits 0 on warnings, so these never failed a push or a CI run and accumulated
unremarked — see #875 for whether that should change.

Measured in this worktree, at the merge base and at HEAD, so both numbers come from one
tree: **9 warnings + 2 infos → 0 warnings + 2 infos.** Eight of the nine warnings were
introduced by #866, merged the same day, and are the reason this exists.

(An earlier note here said "nine of the ten", pairing a count taken in the primary
checkout — which carries the `$schema` bump and so does not report the `deserialize`
info — with one taken here. Two trees, so the arithmetic could not close.)

## Not in scope — the third file, deliberately

`packages/ui/src/components/Table/TableBody/utils/resolveDrillCellChildren.util.test.tsx`
carries the remaining `noUselessFragments` finding. It sits inside
`packages/ui/src/components/Table/**`, which `aggregate-columns` (#869,
`chore/869-aggregate-columns`) holds as an active area, so touching it here would be
editing another live task's files. Dropped from `area` above rather than claimed and
left alone — a glob nobody is working is a lock that costs someone else a collision
warning for nothing.

It is an **info**, not a warning, so nothing regresses by leaving it. Whoever finishes
#869 can take it in passing, or it can be picked up after that branch merges.

The other remaining finding — `biome.jsonc:2:14 deserialize`, the `$schema` pinned at
2.5.8 against a 2.5.9 CLI — is already fixed on `chore/868-quick-test` and is not
duplicated here.

## Status / next

- Current step: both fixes made and verified; gate running
- Blockers: none
- Next: push, flip #874 out of draft, drive to merged
