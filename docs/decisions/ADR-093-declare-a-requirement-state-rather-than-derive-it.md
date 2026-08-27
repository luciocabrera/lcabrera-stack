# ADR-093 — Declare a requirement's state rather than deriving it

**Status:** Accepted

**Issue:** [#986](https://github.com/luciocabrera/lcabrera-stack/issues/986)

## Context

[`docs/product/`](../product/README.md) states what the packages must let a
consumer do: one file per requirement, each with a statement in its persona's
vocabulary, acceptance criteria that are decidable, and typed pointers to where
the answer lives. Every requirement also has to answer one more question — **is
it true today?** — because a register that only says what ought to be the case
tells no one how far the product is from it.

There are two ways to answer that. **Declare it**: a `state` field in the file,
written by hand and changed by whoever changes the answer. **Derive it**: leave
the field out, and have a tool run the acceptance criteria and report what it
finds.

Deriving is the more attractive of the two, and for the usual good reason — a
derived answer cannot be stale, and this repository already prefers derived over
declared in several places. `deriveWorkspaces` reads `pnpm-workspace.yaml` rather
than a hand-kept roster; the ADR index is generated; findings reports are
produced on demand rather than committed
([ADR-049](./ADR-049-findings-reports-are-produced-on-demand.md)). A hand-written
"this is done" field is exactly the shape those decisions moved away from.

## Problem

The attraction does not survive contact with what the acceptance criteria
actually say.

**Most of them are not runnable from here.** "A reader with only the installed
package reaches every claim the README makes." "A non-technical user browses,
filters and edits a table without writing SQL." "One documented entry point takes
a schema, a table and a column set." Some of these are decidable by a script,
some by a person reading a rendered page, and some only by someone using the
product. A deriving tool can answer for the runnable subset and must invent an
answer for the rest — and whichever way it defaults, it is wrong for half of
them.

**A check that cannot run and a check that fails look identical.** This is
Non-Negotiable Rule 14 at register scale: an absent test file, a renamed
command, a criterion nobody has automated yet, and a genuine regression all
produce the same "not met". Optimistic defaults are worse — then a deleted test
reports as a met requirement. The register's most-read field would be the one
field nothing could distinguish a fact from a hole in.

**Deriving means running, and the register has to be readable without running
anything.** An agent consults it while planning, on a branch, often with no
database, no built packages and no network — the same properties that keep the
coordination register in git rather than in GitHub Issues
([ADR-036](./ADR-036-github-planning-layer.md), on why the register is not
moved to GitHub Issues). A derived state is a
measurement, and a measurement is produced on demand and never committed
(ADR-049) — so the field would have to leave the file that needs it.

**A declared state has an author; a derived one has nobody to ask.** `git log`
answers who claimed a requirement was met and in which change, next to the code
that made it true.

## Decision

**`state` is declared.** It is one of exactly two values, `met` or `unmet`,
written by hand and flipped in the same commit as the change that makes it true.

Three rules make the declaration answerable rather than decorative:

1. **A requirement declaring `met` carries at least one `command` evidence
   pointer that CI runs.** The claim is then attached to something that fails
   loudly — a lie has to survive the gate, not merely survive review.
2. **There is no third value.** No `partial`, no percentage, no score, no "as
   of" date. A third value is where a measurement gets in, and a measurement in
   a tracked file is right on the day it is written and wrong from the next
   commit, with nothing on the page to say which
   ([`AGENTS.md`](../../AGENTS.md) §7). Which acceptance criteria hold is what
   the `## Acceptance` list is for.
3. **Acceptance bullets carry no checkboxes.** A box is a second declaration of
   the same fact in the same file; two copies drift, and the drift is invisible
   because both look authoritative.

**Evidence pointers say where the answer lives, not that the answer is yes.** An
`unmet` requirement carries them too — pointing at the gap. That is what keeps
rule 1 meaningful: it is a rule about `met`, not a general demand for proof.

A tool that reports the product's **distance** from its stated intent therefore
reads declared states and resolves pointers; it does not run them, and it says
so in its output rather than letting a reader mistake a resolved pointer for a
green check.

## Consequences

**What it costs, stated plainly: a declared state can be wrong.** The register
can say `met` on a branch where it no longer is, and nothing in the file itself
will notice. Three things blunt that and none of them removes it — the `met`
rule ties the claim to a CI command, the flip lands in the commit that earns it,
and a wrong claim is a diff someone reviewed rather than an accident. Anyone
reading `state` is reading a **claim with a named author**, not a test result,
and should treat it accordingly.

**What it buys.** Every requirement gets an answer, including the ones no script
in this repository could ever run. The register stays readable offline on any
branch. And the field cannot silently degrade into "we could not check", because
there is no path by which a tool writes it.

**The trap.** The pressure to add a third state will come, and it will arrive
disguised as accuracy — a requirement half of whose criteria hold, and `unmet`
feels unfair to the work already done. It is not unfair; it is the definition. A
requirement is met when its acceptance criteria hold, and the ones that already
hold are visible in the list. The moment a third value exists, someone writes a
percentage into it, and then someone writes a burn-down that reads it.

## Alternatives considered

1. **Derive the state by running the acceptance criteria in a gate.** Rejected
   on the three grounds above: it can only answer the runnable subset, it cannot
   distinguish "cannot run" from "fails", and it turns the register's central
   field into a report that then may not be committed (ADR-049). It also inverts
   the dependency — the register would need the product built and running in
   order to say anything about it.

2. **Derive it from checkboxes in the `## Acceptance` list.** This looks like
   derivation and is not: a box is hand-written too. All it does is move the
   declaration to a place readers are likelier to mistake for computed, and it
   puts two declarations of one fact in one file.

3. **Drop the field; let the issue tracker say what is done.** This is the
   status quo that opened [#985](https://github.com/luciocabrera/lcabrera-stack/issues/985):
   criteria live on an issue, are machine-read by nothing, and evaporate when it
   closes. It is also unanswerable offline, which is when the question gets
   asked.

4. **A percentage, a score, or a coverage-style number.** Rejected as a changing
   number in a tracked file — the failure mode `AGENTS.md` §7 names, and the one
   ADR-049 untracked a directory of committed snapshots over. It would also be a
   number nothing computes, which is the worst of both designs.

## References

- Issue [#986](https://github.com/luciocabrera/lcabrera-stack/issues/986), epic
  [#985](https://github.com/luciocabrera/lcabrera-stack/issues/985)
- [`docs/product/README.md`](../product/README.md) — the register this governs,
  and the full frontmatter schema
- [ADR-036](./ADR-036-github-planning-layer.md) — the backlog is GitHub's; the
  register is not a second backlog
- [ADR-049](./ADR-049-findings-reports-are-produced-on-demand.md) — a gate
  compares against it → tracked; it reports what a tool found → produced on
  demand
- [ADR-075](./ADR-075-the-index-does-not-list-the-adrs.md) — why neither
  `docs/product/README.md` nor `VISION.md` lists the requirements
