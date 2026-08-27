---
name: product-requirement
description: Read and maintain the product requirements register in docs/product/ — consult it before building against the published packages, write a requirement when none covers the work, and flip one to met in the commit that earns it. Use when planning a change to a package a consumer installs, when writing acceptance criteria, or when editing anything under docs/product/.
user-invocable: true
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

**2. If nothing covers it, decide whether it belongs here, then write it in the
change that needs it.** `docs/product/README.md` opens with two sections that
settle the first half — _What this layer is canonical for_ and _Four things it is
not_, the second naming the home each of those four goes to instead. Read them
there; they are not repeated below, and a shorter copy of them here would be a
copy nothing polices. The register does not claim to be complete, so a product
statement with no file is unwritten rather than out of scope — the absence is a
prompt, not permission. Copy
[`requirements/_TEMPLATE.md`](../../../docs/product/requirements/_TEMPLATE.md)
to `requirements/<id>.md`, where `<id>` equals the filename slug, and do not open
a separate sweep to enumerate the product in one sitting.

**3. Check it is not already there under another name first.** Nothing dedupes
the directory. If an existing requirement is nearly right, edit that one. If
yours genuinely leans on another, name it in `requires` rather than restating
it — `browse-and-edit-a-table-without-writing-sql` names what it leans on there
and repeats none of it.

**4. When your change makes one true, flip `state` in the same commit.** A flip
on its own is a claim with no diff behind it. Read the `met` rule below before
writing the word.

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

Acceptance bullets carry **no checkbox**: `state` is the file's one declaration,
and a box beside it is a second one.

## Adding one changes exactly one file

The new `<id>.md` is the whole change, and the index you will look for is absent
on purpose rather than by oversight. Any listing would be a single region that
every branch adding a requirement has to touch, so the second concurrent claim
lands a conflict in a file it never set out to edit — and the cost here is not a
merge someone resolves, it is that a conflicting pull request runs none of its
`pull_request` checks. So do not add a row anywhere: the directory is the
listing
([ADR-075](../../../docs/decisions/ADR-075-the-index-does-not-list-the-adrs.md)).

## The `state` field

Two values, `met` and `unmet`, written by hand and flipped in the commit that
changes the answer.

**No percentage and no date.** Not `70%`, not `partial`, not `met as of <date>`,
not a score and not a burn-down — the field takes none of them, and no field in
this schema takes a date at all. Why a third value was rejected, and what a
declared state costs instead, is
[ADR-093](../../../docs/decisions/ADR-093-declare-a-requirement-state-rather-than-derive-it.md).

**Before you write `met`, break the property on purpose.** The rule is that a
`met` requirement carries a `command` evidence pointer CI runs _and that could
fail_; a script can only check the first half of that, so the second half is
something you do — plant the violation, run the pointer, watch it fail, revert.
If it does not fail, the requirement is `unmet` and the dead check is the gap you
just found. That has already happened once:
[`the-ui-package-stays-client-safe.md`](../../../docs/product/requirements/the-ui-package-stays-client-safe.md)
is the entry, and it records the probe.

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

- [`docs/product/README.md`](../../../docs/product/README.md) — the schema, and
  what the layer is canonical for versus the four things it is not
- [`docs/product/VISION.md`](../../../docs/product/VISION.md) — the two product
  lines and the three personas
- [ADR-093](../../../docs/decisions/ADR-093-declare-a-requirement-state-rather-than-derive-it.md)
  — why `state` is declared, and what that costs
- the `refactor-verified` skill — an issue's §6 is the bar for one change; a
  requirement is the bar that outlives it
