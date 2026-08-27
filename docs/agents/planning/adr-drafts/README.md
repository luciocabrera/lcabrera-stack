---
kind: charter
status: live
recorded: 2026-07-25
issues: []
packages: []
---

# ADR drafts

Proposed decisions that have not been adopted. A draft is named by slug and holds
**no ADR number** — a number is taken from the one global sequence at adoption,
not at proposal, because a reserved number goes stale as the sequence moves on.

On adoption: move the file into the home its tier calls for, take the number
`vp run adr:verify` reports as free, and run `vp run adr:verify` again to confirm
it. There is no index row to add — a home's `README.md` lists no ADRs, which is
what keeps two adoptions in flight from conflicting
([ADR-075](../../../decisions/ADR-075-the-index-does-not-list-the-adrs.md)). The
rule and the tier split are
[ADR-048](../../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md).

A draft carries no planning frontmatter. The block on this page is here because
it is a charter for a directory under `planning/`, and the
[parent charter](../README.md) says why the drafts beside it are out of its
scope.

This directory is often empty — that is the healthy state, not a missing file.
