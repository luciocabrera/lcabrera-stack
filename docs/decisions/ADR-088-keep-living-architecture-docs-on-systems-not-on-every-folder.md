# ADR-088 — Keep living architecture docs on systems, not on every folder

**Status:** Accepted

**Corrected in part by:** [ADR-094](ADR-094-move-explanations-out-of-functions-and-into-the-record-that-owns-them.md) — the "Comments stay rare" paragraph under Decision, and the "A trap on this line → a code comment" row of the table under Context, were reversed by a standing rule set on 2026-08-28. Everything else here stands, and the body below is unedited.

**Issue:** [#900](https://github.com/luciocabrera/lcabrera-stack/issues/900)

**Relates to:** the documentation map in [`docs/README.md`](../README.md),
and the comment rule in [`AGENTS.md`](../../AGENTS.md) §7.

## Context

This repository already has a split for where knowledge lives:

| Question                         | Home              | Lifetime           |
| -------------------------------- | ----------------- | ------------------ |
| Why we chose this                | an ADR            | dated, append-only |
| Does this artifact already exist | `INVENTORY.md`    | living, gated      |
| How a _system_ is wired          | `ARCHITECTURE.md` | living             |
| A trap on this line              | a code comment    | living             |

`docs/README.md` states the rule that keeps those from rotting into each other:
one canonical home per fact; everything else links, never copies.

A second set of instructions undid that split. `AGENTS.md` told agents to
create an `ARCHITECTURE.md` before implementing in a directory that lacked
one. `packages/ui/src/PATTERNS.md` required one in every component folder.
The quality-gate Documentation Update Rule required a Props table, a mermaid
of the render flow, and a new architecture file whenever a folder was new.

The comment rule in the same `AGENTS.md` already said the opposite: comment
only what the code cannot say; there is no "document every export" rule
(that one existed, produced volume rather than clarity, and was removed).
An orphan `apps/react-router/docs/enterprise_coding_standards.md` still
required JSDoc on every export, so a search for "JSDoc" revived it.

The copies drifted. A Button architecture Props table listed a `color` prop
the types do not have. `TableGroupAggregate`'s architecture file still
described several measures in one cell after the component's own comment
recorded the opposite. Nothing gates architecture-file freshness —
`docs:verify` checks paths, `inventory:verify` checks util names.

## Decision

**An `ARCHITECTURE.md` is for a system**, not for a folder. A system is a
cluster whose wiring is not visible from one file: Table (and its stores),
Form, the query builders, design-system token composition when it is
non-local. It records data flow, ownership, and constraints the code cannot
say.

It does **not** record:

- a Props table (the types file is the contract)
- a file-tree listing (the directory is the listing)
- a mermaid of the function body (the function is the flow)

Do not create one because a directory is new. A leaf component — Button,
CopyButton, Title, a private delegate whose name and types already say what
it is — gets an inventory row, not an architecture file.

**Inventories stay, and stay short.** One sentence per row. They are the
reuse catalog, and `inventory:verify` already fails a util whose name is
missing. They are not a second architecture file.

**ADRs stay the home of decisions.** Living wiring does not move into an
ADR: rewriting a decision every time a prop is renamed falsifies the record.

**Comments stay rare.** A short comment earns its place by carrying a
non-obvious constraint, a trap, or a decision whose alternative looks
equally reasonable, on the line that would otherwise be broken. File-level
JSDoc that restates a name, a type, an inventory row, or an ADR is the same
copy in a third place — do not add it. The one scoped JSDoc rule that
remains is the short "why" header on scripts
([`.claude/rules/scripts.md`](../../.claude/rules/scripts.md)).

Existing leaf `ARCHITECTURE.md` files are not deleted by this decision.
They stop being required, stop being updated by default, and stop being
the thing an agent must read before a one-file change. Removing the ones
that only restate the folder is a later cleanup, not a prerequisite.

## Consequences

**What it costs.** An agent editing Table still has a system architecture
file to read; an agent editing CopyButton does not get a 26-line restatement
of `navigator.clipboard.writeText`. Finding "how is this leaf wired" means
reading the code and the inventory row. Some useful "why" currently living
only in a leaf architecture file will need to move into an ADR, a system
architecture file, or a one-line comment before that file is deleted.

**What it buys.** New work stops adding a markdown file per folder. The
quality gate no longer fails a PR in review for skipping a Props table.
Inventories remain the gated catalog. ADRs remain the dated record.

**The trap.** Treating "do not require an architecture file" as "delete
comments and put the essays in ADRs" recreates the copy, in a home that
must not be rewritten. The test is the same as the comment rule: if the
code already says it, write nothing.

## Alternatives considered

1. **Move the explanations into ADRs and delete architecture files.**
   Rejected: an ADR is a dated decision. Living wiring (which provider
   owns which store, which delegate reads it) changes without being a new
   decision, and rewriting the ADR to match today is the thing ADR-075's
   "never rewrite a body" rule exists to stop.
2. **Keep a file per component, gate the Props tables.** Rejected: a gate
   that the types already provide. The types cannot drift from themselves;
   a table can, and did.
3. **Leave the instructions, tidy the files by hand.** Rejected: the
   instructions are what produce the files. Cleaning without changing them
   is a one-time pass the next component reopens.

## References

- [`docs/README.md`](../README.md) — one canonical home per fact
- [`AGENTS.md`](../../AGENTS.md) §7 — comment only what the code cannot say
- [`.github/skills/quality-gate-workflow/SKILL.md`](../../.github/skills/quality-gate-workflow/SKILL.md) — Documentation Update Rule
- [`packages/ui/src/PATTERNS.md`](../../packages/ui/src/PATTERNS.md) — was requiring a file per component directory
- [#900](https://github.com/luciocabrera/lcabrera-stack/issues/900)
