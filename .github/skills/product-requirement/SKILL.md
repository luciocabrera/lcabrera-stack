---
name: product-requirement
description: Read and maintain the product requirements register in docs/product/ — consult it before building against the published packages, write a requirement when none covers the work, and flip one to met in the commit that earns it. Use when planning a change to a package a consumer installs, when writing acceptance criteria, or when editing anything under docs/product/.
user-invocable: true
paths: ['docs/product/**']
---

# Working the requirements register

[`docs/product/`](../../../docs/product/README.md) holds what the published
packages must let a consumer do, one file per requirement, each with a declared
`state`. It exists because acceptance criteria written on an issue are read once
and evaporate when it closes — the next agent then re-derives the intent, or
invents a different one.

> That page owns the schema and every rule in it; this one is the procedure for
> using it. When they seem to disagree, it wins. The personas and product lines
> the statements are written for are in
> [`VISION.md`](../../../docs/product/VISION.md), and why `state` is declared
> rather than computed is
> [ADR-093](../../../docs/decisions/ADR-093-declare-a-requirement-state-rather-than-derive-it.md).

## Before you build

**1. Find the requirement your work moves.** `ls docs/product/requirements/` —
the filenames are the statements in kebab case, and there is no index to read
instead. If one covers the work, its `## Statement` is the intent the change has
to serve and its `## Acceptance` is what settles whether you are done. Read it
before writing the issue's §6, not after: where the two disagree, one of them is
wrong and finding out at review costs a round.

**2. If nothing covers it, write one, in the change that needs it.** The
register does not claim to be complete. A product statement with no file here is
unwritten, not out of scope — so the absence is a prompt, not permission. Copy
[`requirements/_TEMPLATE.md`](../../../docs/product/requirements/_TEMPLATE.md)
to `requirements/<id>.md`, where `<id>` equals the filename slug. Do not open a
separate sweep to enumerate the product in one sitting; write the one your work
needs.

**3. Check it is not already there under another name first.** Nothing dedupes
the directory. If an existing requirement is nearly right, edit that one. If
yours genuinely leans on another, name it in `requires` rather than restating
it — `browse-and-edit-a-table-without-writing-sql` leans on two and repeats
neither.

**4. When your change makes one true, flip `state` in the same commit.** A flip
on its own is a claim with no diff behind it. Read the `met` rule below before
writing the word.

## What this layer is canonical for

- **What a consumer must be able to do** with the published packages, in the
  consumer's words rather than the packages'.
- **Whether that is true today** — the `state` field.
- **Where to look to check it** — the `evidence` pointers, which say where the
  answer lives and not that the answer is yes. An `unmet` requirement carries
  them too, pointing at the gap.
- **Which packages a requirement concerns**, so what a package owes is
  answerable without reading every file that mentions it.

## Four things it is not

Each has a real home. Writing one of them here is how a fact gets two homes.

| You are about to write                                   | It goes                                                                                                                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| what should happen next, in what order, by when          | a GitHub issue, sub-issue or milestone ([ADR-036](../../../docs/decisions/ADR-036-github-planning-layer.md))                            |
| why it is built this way, and what was rejected          | an ADR in [`docs/decisions/`](../../../docs/decisions/)                                                                                 |
| who is touching which files right now                    | the task register in [`docs/coordination/`](../../../docs/coordination/README.md)                                                       |
| how far the product is from its intent, as a measurement | a report produced on demand and never committed ([ADR-049](../../../docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md)) |

The last row is the one that gets pushed on, and it arrives disguised as
accuracy: half the criteria hold, and `unmet` feels unfair to the work already
done. It is not unfair, it is the definition. Which criteria hold is visible in
the `## Acceptance` list.

## A statement is not an acceptance criterion

This is the failure that makes a register unusable, and it goes in one
direction: an implementation claim written into the `## Statement` slot.

> **Wrong slot**, as someone might write it for a query-builder facade:
> _`@lcabrera/server` exports a `buildQuery` function taking a single `ReadSpec`
> argument that covers fields, filters, sorting, pagination and grouping._

That is a design note. Rename the export and it is false, though nothing about
what the consumer needs has changed. The pair it should have been, from
[`express-a-read-through-one-entry-point.md`](../../../docs/product/requirements/express-a-read-through-one-entry-point.md):

> **Statement** — the persona's vocabulary, avoiding package names where the
> persona would not use one: _I want to say what I am reading — fields, filters,
> sorting, pagination, aggregation, grouping — and get back a query I can run. I
> do not want to learn a menu of builders first, work out which one covers the
> combination I have, and then discover that my case needs two of them composed
> in the right order._
>
> **Acceptance** — decidable, each bullet naming what decides it: _One exported
> function accepts every dimension of a read in a single argument. Exactly one
> file is documented as the query entry point, in
> `packages/server/src/db/query-builder/ARCHITECTURE.md`. The change is recorded
> in the published surface by `vp run api-surface:verify`._

The test that separates them: replace the facade with a different design. Every
acceptance bullet is rewritten and the statement is untouched. If your statement
moves when the implementation moves, it is a criterion sitting in the wrong slot,
and the requirement will not outlive the redesign it was written during.

Acceptance bullets carry **no checkbox**. `state` is the one declaration in the
file, and a box beside it is a second one — they drift, reliably in the
direction where the boxes are right and the field is stale.

## Adding one changes exactly one file

The new `<id>.md` is the whole change. Neither `docs/product/README.md` nor
`VISION.md` lists the requirements, and neither ever will.

That is not an omission to be helpfully fixed. An index is one region every
branch appends to, so two agents adding a requirement in the same week conflict
on a file neither of them was editing — and here a conflicting pull request
silently skips every `pull_request` workflow, which is a worse outcome than the
conflict. The directory is the listing. The reasoning is
[ADR-075](../../../docs/decisions/ADR-075-the-index-does-not-list-the-adrs.md),
which retired the same table from the ADR home.

## The `state` field

Two values, `met` and `unmet`, written by hand and flipped in the commit that
changes the answer.

**No percentage and no date.** Not `70%`, not `partial`, not `met as of <date>`,
not a score and not a burn-down. Each of those is a measurement, and a
measurement in a tracked file is right on the day it is written and wrong from
the next commit, with nothing on the page to say which — the failure
[`AGENTS.md`](../../../AGENTS.md) §7 names and the one ADR-093 rejected a third
state over. There is no field in this schema that takes a date.

**Before writing `met`, break the property on purpose.** A `met` requirement
carries at least one `command` evidence pointer that CI runs _and that could
fail_. A script can check that the pointer exists and runs; only you can check
the second half, so plant the violation, run the pointer, watch it fail, then
revert. If it does not fail, the requirement is `unmet` and the dead check is
the gap you just found.

That half is not theoretical. The first entry written under this schema declared
`met` on a guard whose dependency filter had stopped matching anything after a
package rename: the command ran, scanned an empty list, and passed with a
deliberate violation planted. It is `unmet` today —
[`the-ui-package-stays-client-safe.md`](../../../docs/product/requirements/the-ui-package-stays-client-safe.md)
records the whole probe.

## Traps in the frontmatter

The schema is stated in full in
[`docs/product/README.md`](../../../docs/product/README.md). Three fields are
worth knowing before you fill the template in, because a wrong value in any of
them still parses.

- **`packages` takes workspace directory names**, not npm names — `node-runtime`,
  not `@lcabrera/node`; `eslint-local-rules`, not `@lcabrera/eslint-plugin`.
- **`persona` is exactly one**, even when `lines` is both. Pick the one the
  requirement **fails hardest for**, using the failure list that closes each
  persona's section in `VISION.md`. Counting packages answers a different
  question, and a cross-line requirement is well-formed whichever persona it
  names, so no checker will catch the wrong pick.
- **`issues` is bare integers** here (`1010`), unlike the `#`-prefixed strings
  in `docs/agents/planning/`.

## Failure modes

- **A criterion nobody else can settle.** "The API is ergonomic" is not a
  criterion. Name the command, the export or the path that decides it.
- **A statement that names an export.** See above — it is a design note, and it
  dies at the first rename.
- **A second file restating an existing requirement.** Search the filenames
  before writing; `requires` is for leaning on one, not for repeating it.
- **`met` in a follow-up commit**, or in a PR that changes nothing else. The
  flip belongs next to the code that earns it, so `git log` answers who claimed
  it and in which change.
- **A pointer that cannot fail.** A scanner over an empty list and a correct
  guard print the same `PASS`. This is Non-Negotiable Rule 14 at register scale.

## Related

- [`docs/product/README.md`](../../../docs/product/README.md) — the schema and
  every rule above, in full
- [`docs/product/VISION.md`](../../../docs/product/VISION.md) — the two product
  lines and the three personas
- [ADR-093](../../../docs/decisions/ADR-093-declare-a-requirement-state-rather-than-derive-it.md)
  — why `state` is declared, and what that costs
- the `refactor-verified` skill — an issue's §6 is the bar for one change; a
  requirement is the bar that outlives it
