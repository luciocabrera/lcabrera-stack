---
id: express-a-join-and-an-aggregate-filter
lines:
  - application
persona: application-developer
state: unmet
packages:
  - server
requires:
  - sql-is-injection-safe-by-construction
issues:
  - 998
evidence:
  - type: doc
    ref: packages/server/src/db/query-builder/ARCHITECTURE.md
  - type: code
    ref: packages/server/src/db/query-builder/assert-column-allowed.util.ts
  - type: code
    ref: packages/server/src/db/group-query-builder
---

# A read spans more than one table, and can be filtered on its aggregates

## Statement

My data lives in more than one table, and some of the questions I want to ask
are about a group rather than about a row — show me only the customers whose
total is over a threshold. Today each such question costs me a database view
somebody has to create and maintain, or hand-written SQL, which puts me outside
every guarantee the builder gives me for the queries it does cover.

## Acceptance

- A decision records whether joins are adopted, carrying either the safety model
  they need or the reason against, and
  `packages/server/src/db/query-builder/ARCHITECTURE.md`'s "What this does NOT
  do" list says what is then true.
- If adopted: a join and a filter on an aggregate are expressible without
  hand-written SQL, and both are covered by tests.
- The aggregate filter applies to the **grouped result**, not per aggregate —
  the two are different questions and only one of them is available today.
- Identifier validation and column allowlisting reach every table a join touches:
  a joined target is not a way around `assertColumnAllowed`.

## Notes

The exclusion is deliberate and written down rather than an oversight, so this
requirement is a question before it is a feature: **should it still hold?** It is
`unmet` rather than `proposed` because the register has no third state — a
requirement is met when its criteria hold, and the first criterion here is
satisfied by a decision either way, including a decision not to build it.

It leans on
[`sql-is-injection-safe-by-construction`](./sql-is-injection-safe-by-construction.md)
because that guarantee is exactly what a join widens: safety there rests on
validating identifiers and allowlisting columns for one target, and a second
target is a second surface to cover.
