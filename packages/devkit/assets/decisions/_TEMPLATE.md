---
governs:
  - <repository, or one workspace directory name per line>
---

<!--
  The shape of an architecture decision record. Copy this file to
  `ADR-NNN-<kebab-title>.md`, strip this comment, and fill in the number and the
  heading; the ADR scaffolder from the gate runtime does the same job and takes
  the next free number for you. The `---` block above is carried through as it
  is, so a scaffolded record fails the gate until you say what it governs.

  WHICH NUMBER is not a choice: numbers are unique across every decision home in
  the repository, so a decision that spans two of them is still one record. The
  ADR gate prints the next free number and refuses a collision.

  `governs` is ADDITIVE CLASSIFICATION, not an amendment: it says what the
  decision applies to, which is a fact about the tree you are standing in, not a
  change to what was decided. That is why adding one to an old record is allowed
  while rewriting its body is not. Its values are workspace DIRECTORY names,
  derived from the workspace file rather than declared, or the single value
  `repository` when the decision constrains no one workspace. The two do not
  mix, and the list is never empty: a record that governs everything says so, so
  that "nobody filled this in" cannot be spelled the same way as an answer. The
  gate lists the records governing one workspace on request.

  The gate checks placement, filename, heading number, index freshness, the
  block above, and that Context, Decision, Consequences and one of the two
  alternatives sections are present and not empty. It does NOT judge what they
  say. Sections marked optional below may be dropped; do not rename the ones you
  keep.

  Records that predate the block are grandfathered in a baseline the gate reads,
  rather than edited into shape. That list may not get longer.

  This file is the whole change. A home's index carries no row per record, so
  there is nothing to regenerate and nothing for a second decision branch to
  conflict with.
-->

# ADR-NNN — <one line, in the imperative: what was decided>

**Status:** Accepted

<!-- Proposed | Accepted | Superseded by ADR-NNN.
     Superseding never edits the old decision's body — a decision record is
     dated, and rewriting it destroys the only evidence of what was known then. -->

## Context

<!-- What was true before, and what forced a decision. Enough that a reader six
     months out does not have to reconstruct it. Name the constraints that
     narrowed the field — a decision looks arbitrary without them. -->

## Problem

<!-- Optional. The specific question this record answers, in one or two
     sentences. If it cannot be stated that briefly, it is probably two
     decisions. -->

## Options considered

<!-- Each one named, with what it would have cost. An option listed without its
     cost reads as a straw man, and a later reader cannot tell "considered and
     rejected" from "not looked at" — which is the whole reason this file exists.
     One of this and `Alternatives considered` below is required. -->

## Decision

<!-- What was chosen, in the imperative. -->

## Consequences

<!-- What follows, including what gets worse. A record with only upsides is a
     pitch, not a decision. -->

## Alternatives considered

<!-- The ones that were reasonable and were not taken, and what would make one
     of them right later. This is what stops the same debate reopening. One of
     this and `Options considered` above is required. -->
