---
id: url-state-codec
title: feat(ui): a closed-vocabulary URL state codec
owner: agent:claude
status: review
branch: feat/561-url-state-codec
area:
  - packages/ui/src/utils/urlState/**
started: 2026-08-12
updated: 2026-08-12
plan: (none)
pr: #630
issue: #561
---

## What

feat(ui): a closed-vocabulary URL state codec

`createUrlStateCodec` pairs one `serialize` with one `deserialize` and takes its
whole validation story from a caller-supplied narrowing that answers `undefined`
for any token outside its vocabulary — no schema library added to a published
browser package. That answer refuses the whole payload, so a hand-edited param
yields no state rather than partly applied state, or a value typed as valid while
holding something else.

The `sorting`, `filters` and `tableState` params are migrated onto it, in both
directions. The unnarrowed `JSON.parse(param) as CompactSorting` in
`deserializeSortingFromURL` is gone.

## Status / next

- Current step: implemented, full gate green, PR #630 open as a draft for review
- Blockers: none
- Next: independent review, then ready/merge

## Notes

- `packages/ui/src/utils/urlState/**` is internal — no `exports` entry and no
  API-surface change. The behaviour reaches consumers through the exported
  `routing/loaders/createTableRouteLoader.util`, which is why the change carries
  a `patch` changeset.
- The codec and the three instances are deliberately not barrelled through
  `index.ts` (ADR-007). #568's `grouping` codec imports `createUrlStateCodec` by
  file path.
