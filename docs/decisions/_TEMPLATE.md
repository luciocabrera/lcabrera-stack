<!--
  The shape of an ADR in this repo. `vp run adr:new -- "<title>"` copies this
  file, strips this comment, and fills in the number and heading; copying it by
  hand does the same job.

  WHERE IT GOES is settled: docs/decisions/ is the only home. `registers.adrHomes`
  in devkit.config.json is the set — read by adr-registry.mjs and enforced by
  `vp run adr:verify` — so adding a home is a config change, not a convention.
  WHICH NUMBER is not a choice either: `vp run adr:verify` prints the next free
  one. No number is grandfathered to mean two things, and
  `registers.adrGrandfatheredDuplicates` is empty, so the gate rejects every
  repeat. Never renumber an existing ADR — it is a dated record.

  `vp run adr:verify` checks placement, filename, heading number and index
  freshness — it does NOT read the sections below. They are the convention this
  file carries, derived from what ADR-047..051 already do rather than invented:
  Context / Decision / Consequences / Alternatives considered are in all of them.
  Drop a section that has nothing to say; do not rename the ones you keep.

  After adding the file, run `vp run adr:verify`. This file is the whole change:
  a home's index carries no row per ADR, so there is nothing to regenerate and
  nothing for a second ADR branch to conflict with
  (ADR-075-the-index-does-not-list-the-adrs.md).
-->

# ADR-NNN — <one line, in the imperative: what was decided>

**Status:** Accepted

<!-- Proposed | Accepted | Superseded by [ADR-NNN](./ADR-NNN-slug.md).
     Superseding never edits the old decision's body — an ADR is a dated record.
     ADR-047 shows the fuller metadata block (Date, Issue, Corrects, Relates to)
     worth adding when a decision corrects an earlier one. -->

## Context

<!-- What was true before, and what forced a decision. Enough that a reader six
     months out does not have to reconstruct it. Name the constraints that
     narrowed the field — a decision looks arbitrary without them. -->

## Problem

<!-- Optional; fold into Context for a small decision. Use it when the failure
     being fixed needs stating on its own (ADR-050, ADR-051). -->

## Options considered

<!-- Optional. A numbered list, each with why it was rejected, and the chosen one
     marked `Chosen.` — ADR-050 is the worked example. Use this when the decision
     was a choice between comparable designs; use `Alternatives considered` below
     when it is one design plus the objections it had to answer. Small ADRs need
     only one of the two. -->

## Decision

<!-- What is now true, in the present tense. Be specific enough to be checkable:
     names, paths, the gate that enforces it if one does. -->

## Consequences

<!-- What this costs as well as what it buys — the trap someone will hit, the
     thing that is now harder. A consequences section with no cost in it is a
     sales pitch, and the next reader will not trust the rest. -->

## Alternatives considered

<!-- Each rejected alternative with the reason it lost, so it is not re-proposed
     from scratch. "Rejected on evidence: <what was measured>" beats "rejected as
     too complex". -->

## References

<!-- Issues, PRs, ADRs, docs, upstream links. Measurements and investigation
     narrative belong in the PR or issue, not here — link them. -->
