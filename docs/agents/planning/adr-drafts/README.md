# ADR drafts

Proposed decisions that have not been adopted. A draft is named by slug and holds
**no ADR number** — a number is taken from the one global sequence at adoption,
not at proposal, because a reserved number goes stale as the sequence moves on.

On adoption: move the file into the home its tier calls for, take the number
`vp run adr:verify` reports as free, and register it with
`vp run adr:verify -- --write`. The rule and the tier split are
[ADR-048](../../../decisions/ADR-048-adr-taxonomy-and-one-sequence.md).

This directory is often empty — that is the healthy state, not a missing file.
