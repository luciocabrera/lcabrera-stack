---
paths: ['packages/**', '.changeset/**', 'docs/decisions/**']
---

# Public-Package Rationale

Covers the **reason** given for a change to a published `@lcabrera/*` package,
wherever that reason is written. Which workspaces are public is one question with
one answer: `vp run suppressions:packages`. Nothing here constrains `apps/**`,
where an application is described in its own vocabulary because it is the thing
being described.

## The rule

**A public package's rationale is written in the package's own vocabulary, and
never in a consumer's facts.** A grid, a column, a measure, a group key, a layout
cookie, a request, a row: those are the package's terms, and they hold in every
tree that installs it. A consuming application's table names, column names, route
names, cookie keys, fixture values, screen names and product nouns are that
consumer's facts. They are not a reason for anything a package does.

Every consumer installs the same package with different names, so a reason that
rests on one consumer's vocabulary is false for every other reader of it. It is
also unfalsifiable for them: the reader deciding whether the behaviour is still
right cannot check a claim about a table their repo does not have. The apps in
this repository are a harness for the packages, not the audience for them
([ADR-039](../../docs/decisions/ADR-039-duplicate-over-undeclared-edges.md),
[`docs/agents/cross-app-abstraction.md`](../../docs/agents/cross-app-abstraction.md)).

## Where it binds

Prose, not only code. Prose is where it has actually been breached:

- the package's own `README.md`, `ARCHITECTURE.md` and `INVENTORY.md` rows
- ADRs
- changesets, which become the line a consumer reads in a changelog
- PR bodies and issue bodies
- commit subjects and bodies

## What already checks a corner of this

`vp run package-refs:verify` fails a published package whose shipped text
contains an `apps/<name>` path. That is one narrow corner: a path segment, in
files the package ships, in this repository. It does not read an ADR, a
changeset, a PR body or a commit message, and it does not know any consumer's
column or table names — so on everything above, this rule is what holds and
there is no gate behind it. Do not add one: a count of borrowed nouns has no
threshold to assert, and the nouns do not travel to the next consumer.

## Applying it

Two checks on a sentence, either one enough.

**Swap the consumer.** Put a different installing application into the sentence,
one with different names. If the sentence goes false, or stops meaning anything,
it was citing a consumer. Rewrite it as the capability the package now has.

**Delete the citation.** Strike every clause naming something outside the
package. If no reason survives, the change has not been justified yet, and
finding the package-level reason is the work.

The shape, with the consumer's facts left as placeholders rather than borrowed
from anyone:

- Not: "so `<app>` keeps `<their_table>.<their_column>` on screen after a
  collapse" — names two facts the next reader's tree does not contain.
- Instead: "so a grid keeps a pinned column visible while its group is
  collapsed" — checkable by anyone holding the package.

Naming a consumer as the **place an observation was made** is not a rationale and
stays allowed: reproduction steps, the harness a defect appeared in, the fixture
a test loads. The bar is that the reason the change is right still stands with
that sentence deleted.
