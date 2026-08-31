---
governs:
  - repository
---

# ADR-101 — The no-comment rule covers a type declaration

**Status:** Accepted

**Date:** 2026-08-31

**Issue:** [#1028](https://github.com/luciocabrera/lcabrera-stack/issues/1028)

**Amends:** [ADR-095](ADR-095-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md) — its Decision names two positions, and the accurate list is three. Nothing else there changes: the two exemptions, the two homes, and the reason a positional rule replaced a judgement one all stand, and ADR-095's body keeps its original reasoning.

**Relates to:** [ADR-088](ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md) (the record ADR-095 corrects), [`AGENTS.md`](../../AGENTS.md) §7

## Context

ADR-095 states the rule positionally, which is the property that lets a linter
decide it: **no comment sits above a function or component declaration, and no
prose sits inside its body.** `AGENTS.md` §7 says the same two positions.
#1028 builds the rule that enforces them.

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
reliably, and #1028's own §6 criteria — which a verifier reads as the bar —
name only the two.

## Decision

**The rule covers three positions, not two.** A comment does not sit above a
declaration, inside a function or component body, or inside a type declaration.
"Above a declaration" is the general form: a `type`, an `interface` (which this
repository forbids for other reasons), an `enum`, a class, a method, and a
`const` holding anything at all — a command descriptor's JSDoc rotted exactly
like a function's ([#850](https://github.com/luciocabrera/lcabrera-stack/issues/850)).

**`local-rules/no-explanatory-comments` in `@lcabrera/eslint-plugin` is the
enforcement**, turned on by both shared flat configs for `.ts`/`.tsx` sources.
It visits `TSTypeAliasDeclaration`, `TSInterfaceDeclaration` and
`TSEnumDeclaration` for both positions, so a comment above a type alias and a
comment on one of its members are each reported, and its colocated suite carries
a fixture for each.

**The exemptions are unchanged**, and they are what keeps the third position
from being a trap. The file-level header stays — the file's **first comment
block**, in a source file of any extension, describing the module rather than a
declaration. `.claude/rules/scripts.md` is where that header is additionally
**mandatory**, for a `.mjs`/`.cjs` script; it is permitted everywhere, and that
is what makes it a home for a trap in a `.ts` file with no other one. Stating it
as only the header a script mandates would leave the TypeScript headers this
sweep wrote unsanctioned, and deleting one takes the trap with it. A tool
directive stays, because deleting one changes what another engine reports. And JSDoc a build reads stays — the annotations, not prose sharing
their block. That last one is why the rule exempts an annotated block only in a
JavaScript file: a TypeScript declaration carries its own types, so `@param`
beside one is prose, while a published `.mjs` package's `.d.mts` is derived from
the block.

`AGENTS.md` §7 states the three positions for agents; this record is why the
list grew. ADR-095's Decision is not rewritten — it is a dated record, and the
header pointer above is a statement about the record rather than a revision of
it, the same practice ADR-088 carries.

## Consequences

**What it costs.** A type's members lose the one place a per-member note could
sit, and a wide state type is the case where that hurts most: `TableMetaState`
has members whose meaning is genuinely not obvious from `readonly
groupingPeriods?: Readonly<Record<string, TableGroupPeriod>>`. Those notes move
to the ADR that owns the decision or to the system's `ARCHITECTURE.md`, both
further away than the line above the member. The bet is ADR-095's, unchanged:
the note was being missed more often than it was being read, and a positional
rule a linter decides beats a judgement rule nothing could.

**A second cost is specific to this position.** A member's note is often the
only statement of an invariant that is not a decision — "absent means off",
"never a function, it crosses the loader boundary". Those have no ADR of their
own, and writing one per member is not proportionate. The honest destination is
the system `ARCHITECTURE.md` when the invariant is about wiring and the pull
request otherwise, and the failure mode to watch in review is the author writing
nothing at all.

**What it buys.** The rule is the same rule in every position a declaration can
take, so there is no boundary to argue about and nothing that reads as complete
while leaving a gap. And it is decided by the linter rather than by a reader
noticing, which is the whole reason ADR-095 made the rule positional.

**What is not affected.** ADR-095's two homes, its two exemptions, and its
statement that deleting the reasoning instead of moving it is not compliance all
stand as decided.

## Alternatives considered

1. **Leave type declarations out and rely on review.** Rejected: it is the
   position the repository writes these comments in most, and "the rule names
   two positions but means three" is the judgement rule ADR-095 replaced. The
   evidence is that the gap survived #993, ADR-095 and #1028's own acceptance
   criteria without anyone noticing until a verifier read the rule against the
   tree.
2. **Rewrite ADR-095's Decision to say three.** Rejected:
   [`docs/README.md`](../README.md) states that a conclusion is superseded by a
   new record, never edited into a different one. A reader six months out needs
   to see that the rule was stated as two positions and grew, not a record that
   reads as though it always said three.
3. **Supersede ADR-095 entirely.** Rejected: nothing in it was reversed. The
   homes, the exemptions and the reasoning for a positional rule are all live,
   and marking the record superseded would retire decisions nobody changed.
4. **Cover the type declaration but not a plain `const`.** Rejected on evidence:
   [#850](https://github.com/luciocabrera/lcabrera-stack/issues/850) is a JSDoc
   above `CLEAR_COLUMN_AGGREGATE_COMMAND`, a `const` object, naming a derivation
   its only consumer stopped using. Drawing the line at "declarations that
   declare types or functions" would have left that one unreported, and it is
   one of the two worked examples the rule exists for.

## References

- [ADR-095](ADR-095-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md) — the rule this amends, and why explanations move rather than being deleted
- [`AGENTS.md`](../../AGENTS.md) §7 — the three positions as agents read them
- [`.claude/rules/scripts.md`](../../.claude/rules/scripts.md) — the file-level header that survives
- [#1028](https://github.com/luciocabrera/lcabrera-stack/issues/1028) — the lint rule and the sweep
- [#850](https://github.com/luciocabrera/lcabrera-stack/issues/850) — a comment above a `const` naming a derivation its consumer does not use
- [#627](https://github.com/luciocabrera/lcabrera-stack/issues/627) — a comment above a function advertising a reader that never existed
