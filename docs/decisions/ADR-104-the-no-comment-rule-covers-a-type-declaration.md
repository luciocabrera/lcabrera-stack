---
governs:
  - repository
---

# ADR-104 — The no-comment rule covers a type declaration

**Status:** Accepted

**Date:** 2026-08-31

**Issue:** [#1028](https://github.com/luciocabrera/lcabrera-stack/issues/1028)

**Amends:** [ADR-095](ADR-095-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md) — its Decision names two positions, and the accurate list is three. Nothing else there changes: the exemptions, the two homes, and the reason a positional rule replaced a judgement one all stand, and ADR-095's body keeps its original reasoning.

**Relates to:** [ADR-088](ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md) (the record ADR-095 corrects), [`AGENTS.md`](../../AGENTS.md) §7

## Context

ADR-095 states the rule positionally: **no comment sits above a function or
component declaration, and no prose sits inside its body.** `AGENTS.md` §7 says
the same two positions.

A third position was never named. `type Args = { … }` is a declaration, a
comment above it is the same shape as a comment above the function that takes
it, and a comment between its members is the same shape as prose in a body — but
neither is stated in ADR-095, in `AGENTS.md`, or in `.claude/rules/`. Grepping
all three for "type declaration", "type alias" or "above a type" returns
nothing.

Two facts make that gap the expensive one rather than a tidy-up.

It is where the repository writes these comments most. An `Args`/`Props`/`Result`
type is the place a prose block explaining a shape feels most justified, because
the members carry no bodies to read instead — and it is where the prose rots
identically. The repository owner's own last round of feedback on the standing
rule flagged three JSDoc blocks on members of `Table.types.ts`, not a function
body.

And an unstated position is not merely unenforced, it is unnoticed. A rule that
names two positions reads as complete. A reviewer applying it to a type
declaration is going beyond what is written, which is not a thing reviews do
reliably.

#1028 set out to close both halves at once — name the third position, and make a
linter decide all three. The first half held. The second did not, and why it did
not is the second decision below.

## Decision

**The convention covers three positions, not two.** A comment does not sit above
a declaration, inside a function or component body, or inside a type
declaration. "Above a declaration" is the general form: a `type`, an `interface`
(which this repository forbids for other reasons), an `enum`, a class, a method,
and a `const` holding anything at all — a command descriptor's JSDoc rotted
exactly like a function's
([#850](https://github.com/luciocabrera/lcabrera-stack/issues/850)).

**A third exemption comes with the third position: a one-line note on a member
of an exported type.** The third position is the one that reaches outside this
repository. An exported descriptor is a package's published surface, and a
member's precondition, default or encoding is not derivable from its type — an
installer reads it in their editor and in the API-surface snapshot, and has none
of this repository's records. What stays is one line stating the fact the type
cannot: not a rationale, and not a pointer to a record an installer cannot open.

**The other two exemptions are unchanged**, and they are what keeps the third
position from being a trap. The file-level header stays — the file's **first
comment block**, in a source file of any extension, describing the module rather
than a declaration. `.claude/rules/scripts.md` is where that header is
additionally **mandatory**, for a `.mjs`/`.cjs` script; it is permitted
everywhere, and that is what makes it a home for a trap in a `.ts` file with no
other one. Stating it as only the header a script mandates would leave the
TypeScript headers this sweep wrote unsanctioned, and deleting one takes the
trap with it. And JSDoc a build reads stays — the annotations, not prose sharing
their block, the test being whether removing the text changes what a tool emits.

**The convention is held by review. Nothing enforces it mechanically, and that
is the decision, not an omission.** A lint rule was written, turned on in both
shared flat configs, proven live by a planted violation, and then removed
unmerged. What it cost is stated below.

## Consequences

**What removing the linter cost, and why it was still right.** A rule nothing
checks is the failure mode this repository has paid for three times —
`commands:verify`, `docs:verify` and `scripts:verify` all exist because prose
drifted from fact with nothing watching — so choosing review here is choosing
that risk knowingly.

It was still right because the thing being decided is not positional after all.
"Does this comment carry something the declaration cannot say?" is a judgement,
and every mechanical proxy tried for it drew the line somewhere a reader would
not:

- **The `export` keyword** as a stand-in for "an installer can read this". False:
  `tsc` resolves a property's documentation comment from the type that declares
  it however that type is reached, so an unexported alias intersected into an
  exported one, or reached through an exported function's signature, is read in
  an installer's editor with no `export` anywhere near it.
- **A character budget** as a stand-in for "a note, not a rationale". It refuses
  a correct sentence one character long and accepts a wrong one at ninety.
- **An adjacency walk over the file's leading comments** as a stand-in for "the
  file-level header". A block comment written flush against the header was
  absorbed into it, so a missing blank line turned the whole rule off for that
  file.

Each of those was a real defect, each was found by review of the rule rather
than by the rule, and each round of fixing one produced the next. That is the
signal: the review effort was going into the proxy instead of into the code. The
same effort spent on the comments themselves is the trade this record accepts.

**What the convention costs, unchanged from ADR-095.** A type's members lose the
one place a per-member note could sit, and a wide state type is where that hurts
most: `TableMetaState` has members whose meaning is genuinely not obvious from
`readonly groupingPeriods?: Readonly<Record<string, TableGroupPeriod>>`. Those
notes move to the ADR that owns the decision or to the system's
`ARCHITECTURE.md`, both further away than the line above the member.

**A second cost is specific to this position.** A member's note is often the only
statement of an invariant that is not a decision — "absent means off", "never a
function, it crosses the loader boundary". Those have no ADR of their own, and
writing one per member is not proportionate. The honest destination is the
system `ARCHITECTURE.md` when the invariant is about wiring and the pull request
otherwise, and the failure mode to watch in review is the author writing nothing
at all.

**The tie-breaker in review.** When a comment is the only thing in dispute,
delete it rather than debate it. Keep one where its omission would cost a reader
something the code does not say — that is the whole test, and it is a person's
to apply.

**What is not affected.** ADR-095's two homes, its exemptions, and its statement
that deleting the reasoning instead of moving it is not compliance all stand as
decided.

## Alternatives considered

1. **Leave type declarations out and rely on review for the other two.**
   Rejected: it is the position the repository writes these comments in most,
   and "the rule names two positions but means three" is exactly the gap that
   survived #993 and ADR-095 without anyone noticing.
2. **Rewrite ADR-095's Decision to say three.** Rejected:
   [`docs/README.md`](../README.md) states that a conclusion is superseded by a
   new record, never edited into a different one. A reader six months out needs
   to see that the rule was stated as two positions and grew, not a record that
   reads as though it always said three.
3. **Keep the lint rule and narrow its exemptions further.** Rejected on the
   evidence above: three successive narrowings each fixed a real false positive
   and each exposed the next, in a rule that public packages may not suppress
   (Non-Negotiable Rule 11), so a false positive has nowhere to go. The proxy
   was the thing under review, which is the wrong thing to be reviewing.
4. **Keep the lint rule as a warning rather than an error.** Rejected: the
   repository runs every eslint pass with `--max-warnings 0`, so a warning is an
   error with a longer name, and softening it for one rule would make the flag
   mean two things.
5. **Cover the type declaration but not a plain `const`.** Rejected on evidence:
   [#850](https://github.com/luciocabrera/lcabrera-stack/issues/850) is a JSDoc
   above `CLEAR_COLUMN_AGGREGATE_COMMAND`, a `const` object, naming a derivation
   its only consumer stopped using.

## References

- [ADR-095](ADR-095-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md) — the rule this amends, and why explanations move rather than being deleted
- [`AGENTS.md`](../../AGENTS.md) §7 — the three positions as agents read them
- [`.claude/rules/scripts.md`](../../.claude/rules/scripts.md) — the file-level header that survives
- [#1028](https://github.com/luciocabrera/lcabrera-stack/issues/1028) — the sweep, and the lint rule that was built and removed
- [#850](https://github.com/luciocabrera/lcabrera-stack/issues/850) — a comment above a `const` naming a derivation its consumer does not use
- [#627](https://github.com/luciocabrera/lcabrera-stack/issues/627) — a comment above a function advertising a reader that never existed
