---
governs:
  - repository
---

# ADR-095 — Move explanations out of functions and into the record that owns them

- **Status:** Accepted
- **Date:** 2026-08-28
- **Issue:** [#993](https://github.com/luciocabrera/lcabrera-stack/issues/993)
- **Amended by:** [ADR-104](ADR-104-the-no-comment-rule-covers-a-type-declaration.md) — the Decision below names two positions, and the accurate list is three: a comment above a **type** declaration, and prose between its members, are covered on the same terms. Everything else here stands, and the body below keeps its original reasoning.
- **Corrects:** the "Comments stay rare" paragraph and the "A trap on this line → a code comment" row of [ADR-088](ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md). Nothing else in ADR-088 is touched: where architecture documents live, and what they may not contain, stand as decided.
- **Relates to:** [`docs/README.md`](../README.md) ("This is not a licence to revise an ADR" — the append-only rule that makes this a new record rather than an edit, and that licenses the pointer added to ADR-088's header), [#1028](https://github.com/luciocabrera/lcabrera-stack/issues/1028) (the lint rule and the sweep).

## Context

The repository owner set a standing rule on 2026-08-28: no comment appears above
or inside a function or component declaration. Explanations belong in the record
that owns them. The one exemption is the file-level header that
[`.claude/rules/scripts.md`](../../.claude/rules/scripts.md) mandates for a
`.mjs`/`.cjs` script.

That reverses a position this repository took deliberately, twice. `AGENTS.md`
§7 said a comment "earns its place by carrying what they cannot — a non-obvious
constraint, a trap, a decision whose alternative looks equally reasonable", and
ADR-088 restated the same sentence with the same three examples and assigned "A
trap on this line" to a code comment in its knowledge-home table. Those were not
oversights; they were the answer to a real question about where a line-level
trap goes.

#993 replaced the `AGENTS.md` paragraph. That left the two disagreeing, which is
precisely the defect #993 exists to remove, and an ADR body is not editable — a
record is dated, and rewriting it falsifies what was decided at the time. So the
correction has to be a new record.

There is a second reason not to just edit the wording. The old rule was
unenforceable by construction: "earns its place" is a judgement, so nothing could
check it, and the volume it was meant to hold down grew anyway. The new rule is
positional, which is the property that lets a linter decide it.

## Decision

**No comment sits above a function or component declaration, and no prose sits
inside its body.** Both positions are covered: the JSDoc block over the
declaration, and any explanation within it.

**Two exemptions, both narrow.**

1. **The file-level header** `.claude/rules/scripts.md` mandates: one short block
   at the top of a `.mjs`/`.cjs` file saying why the file exists, its usage and
   its exit codes. That rule is unchanged.
2. **JSDoc a build reads** — `@param`, `@returns`, `@type` and the rest of the
   annotations a tool consumes. In a published `.mjs` package the declarations
   are derived from them: without the `@param` on
   `createCustomRulesLintConfig`, an option defaulting to `[]` publishes as
   `never[]`, which rejects the one value a consumer is supposed to pass, and
   `attw:verify` fails. `packages/CLAUDE.md` states that as part of the
   publishing contract.

**The second exemption is for annotations, not for prose that shares their
block.** A `@param` line stays; a paragraph above it explaining the design does
not, and moves to one of the two homes below. Where an annotation genuinely
needs a sentence to be usable — what a parameter means, not why the function
exists — that sentence lives inside the tag it belongs to. Stated because
#1028's sweep will be read against this line: the test is whether removing the
text changes what a tool emits, not whether it sits in a `/** */`.

**The explanation moves; it is not deleted.** There are two homes, and which one
depends on what the explanation is:

| What it is                                                      | Home                      |
| --------------------------------------------------------------- | ------------------------- |
| A decision — why this approach and not the one that looks equal | the ADR that owns it      |
| Investigation, measurement, the trap hit on the way             | the pull request or issue |

Deleting the reasoning instead of moving it does not satisfy this decision.

`AGENTS.md` §7 states the rule for agents; this record is why. Neither restates
the other, per [`docs/README.md`](../README.md)'s one-home rule.

## Consequences

**What it costs, and the cost is real.** A line-level trap loses its nearest
home. ADR-088 put it beside the line that would otherwise be broken because that
is where the next editor is standing, and a record in `docs/decisions/` or a
merged pull request is further away than a comment two lines up. Someone will
break a constraint they would have seen. The bet is that the constraint was
already being missed more often than the comment was being read, and that a
positional rule a linter can enforce beats a judgement rule nothing could.

The second cost is friction at the moment of writing. Reaching for an ADR or a
pull-request paragraph is slower than typing a comment, and the failure mode is
not "the author writes an ADR" — it is "the author writes nothing". That is the
thing to watch for in review, and it is why "deleting instead of moving" is
called out in the Decision rather than left implied.

**What it buys.** One position rather than a judgement, so a rule exists that a
linter can decide — which is what #1028 builds. And explanations land where they
are dated: a comment saying why is right on the day it is written and
unfalsifiable afterwards, while a pull request carries its own timestamp and an
ADR carries its own status.

**What is not affected.** ADR-088's architecture-document decision stands whole:
an `ARCHITECTURE.md` is for a system, it carries no Props table, no file tree and
no mermaid of a function body, and a leaf component gets an inventory row. The
`INVENTORY.md` row and the `ARCHITECTURE.md` rows of ADR-088's knowledge-home
table are unchanged; only its last row moves.

**Existing comments are not deleted by this record.** The tree predates the rule
and every published package carries comments in the covered positions today.
Applying it, and the lint rule that enforces it, are #1028; sweeping before the
gate exists means sweeping twice.

That deferral covers an existing comment **edited** as well as one left alone. A
comment in a covered position that is corrected — because it stated something
false — is still in a covered position, and the edit is not a claim that it now
complies. #1028 removes it on the same terms as the rest. Stating this because
the opposite reading is available and wrong: a recently-touched comment looks
reviewed, and a sweep that skips the ones someone has been near is the sweep that
leaves the worst of them.

## Alternatives considered

1. **Edit ADR-088's body to match.** Rejected: an ADR is a dated record, and
   [`docs/README.md`](../README.md) states the rule — "a conclusion is superseded
   by a _new_ ADR, never edited into a different one". A reader six months out
   needs to see that the repository held the old position and why it changed, not
   a record that reads as though it always said this. The same paragraph is what
   licenses the pointer ADR-088's header gained: an amended ADR says its body
   keeps its original reasoning, which is a statement about the record, not a
   revision of it. That practice pre-dates this decision — ADR-036 and ADR-035
   both carry an amendment pointer in the same header slot.
2. **Supersede ADR-088 entirely.** Rejected: most of ADR-088 is about where
   architecture documents live and what they may not contain, and none of that
   is in question. Marking the whole record superseded would retire a decision
   nobody reversed, and the next reader would have no live statement of it.
3. **Keep both rules and scope them — comments allowed for traps, banned
   otherwise.** Rejected: that is the rule that already failed. "A trap worth a
   comment" is a judgement, nothing can check it, and it is the wording the two
   surfaces drifted apart over.
4. **State the rule only in `AGENTS.md` and leave ADR-088 alone.** Rejected: that
   is the state this record fixes. Two accepted surfaces would give opposite
   answers, and `AGENTS.md` links ADR-088 from more than one section, so a reader
   following any of those pointers lands on the reversed rule.
   `grep -n 'ADR-088' AGENTS.md` is the current count; it is not written here,
   because a number in prose is one nothing keeps true.

## References

- [`AGENTS.md`](../../AGENTS.md) §7 — the rule as agents read it
- [ADR-088](ADR-088-keep-living-architecture-docs-on-systems-not-on-every-folder.md) — the record this corrects, in one paragraph and one table row
- [`.claude/rules/scripts.md`](../../.claude/rules/scripts.md) — the file-level header that survives
- [`docs/README.md`](../README.md) — append-only, and what an amended ADR may say about itself
- [#993](https://github.com/luciocabrera/lcabrera-stack/issues/993) — the reconciliation that surfaced the conflict
- [#1028](https://github.com/luciocabrera/lcabrera-stack/issues/1028) — the lint rule and the sweep
