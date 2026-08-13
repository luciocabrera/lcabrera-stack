---
id: rollup-subtotals
title: Rollup, subtotal disambiguation and grouping-led ordering
owner: agent:claude
status: review
branch: chore/570-rollup-subtotals
area:
  - packages/ui/src/components/Table/**
  - packages/ui/src/utils/urlState/**
  - packages/ui/src/routing/**
  - packages/ui/src/design-system/tokens/commons.stylex.ts
  - packages/server/src/db/group-query-builder/**
  - apps/react-router/src/routes/enterprise-orders/**
started: 2026-08-13
updated: 2026-08-13
plan: (none)
pr: '#663'
issue: #570
---

## What

Rollup emission, mask decoding, subtotal and grand-total rendering, the ordering
rules and sort composition — and ADR-065's hierarchy column with them, because a
subtotal has nowhere to put its measures without one.

## Status / next

- Current step: implemented; running the gate.
- Blockers: none.
- Next: push, leave the PR a draft.

## Overlap with #571 (PR #665, `chore/571-treegrid-expansion`)

Both slices touch grouped-row rendering. Nothing here was acted on across the
boundary — `resolveGroupTreeNodes` and `resolveTableGroupTree` are #571's files
and are untouched by this branch.

### The decision, stated once

**A group row's ancestry is the prefixes of its own path, and position never
contributes to it.** That answers both halves of the question #571 raised:

- **An empty path is the root, not a level below it.** A rollup's grand total is
  keyed by nothing, so it has no ancestor. It is a **sibling of the top-level
  groups, not their parent**, even though `()` is a prefix of every `(a)`:
  ADR-065 puts its label "at depth zero in the hierarchy column", which is where
  a top-level group sits, and making it their ancestor would put the whole grid
  inside one collapsible subtree whose collapse hides the table.
  `toGroupHierarchyLabel` already renders it at depth 0 for that reason.
- **A subtotal after its children changes nothing**, because its prefix is the
  same wherever it is emitted. The order itself was never the free variable:
  #570's §6 requires "subtotals immediately follow their children and the grand
  total is last", so the ancestry rule is the half that had to be
  order-independent — which #571 already built it to be.

The one rule that is still positional is a **detail** row's parent, and rollup
cannot reach it: a grouped read returns no detail rows at all
(`selectGroupedOrders` maps every row through `toOrderGroupRow`, which projects
the summary and nothing else). When a slice does interleave detail rows into a
grouped result, the answer is to give the detail row an explicit parent — not to
reorder the query, which is fixed.

### What that costs #571, in their files

`getTableGroupRowSummary` used to refuse an empty path and now accepts it,
because that row is the one a rollup exists to produce. Their two expressions,
run verbatim on `path: []`:

```
pathKey   = resolveGroupPathKey(path)                                → "[]"
level     = path.length                                              → 0
parentKey = level === 1 ? '' : resolveGroupPathKey(path.slice(0, -1)) → "[]"
```

So the grand total is **its own parent**, and its `level` is `0` where the type
documents "1-based depth" and `aria-level` requires 1-based. Under the decision
above both are one condition — `level <= 1` takes the root key, and the level
the grand total is annotated at is the top one. Theirs to make; flagged to the
coordinator rather than edited here.

### Rebase

#665 will likely merge first. Rebase onto it and re-run the gate on the rebased
head: it also changed `<tbody>`'s height to count _visible_ rows rather than
loaded ones, and this branch's height invariant is measured, not restated — a
clean text rebase proves nothing about whether the two compose. No doc on this
branch repeats the old formula any more.
