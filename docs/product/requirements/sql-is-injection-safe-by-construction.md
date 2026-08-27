---
id: sql-is-injection-safe-by-construction
lines:
  - application
persona: application-developer
state: met
packages:
  - server
requires: []
issues: []
evidence:
  - type: test
    ref: packages/server/src/db/query-builder/assert-safe-identifier.util.test.ts
  - type: test
    ref: packages/server/src/db/query-builder/quote-identifier.util.test.ts
  - type: test
    ref: packages/server/src/db/query-builder/assert-column-allowed.util.test.ts
  - type: command
    ref: vp run test:ci
  - type: doc
    ref: packages/server/src/db/query-builder/ARCHITECTURE.md
---

# A query built from request data cannot be injected into

## Statement

The column names and the filter values I pass came from a query string. I want
an injected string to be impossible **by construction** — not conditional on my
having remembered to escape something, and not conditional on my reading the
right paragraph before I typed the call. If I hand the layer something it cannot
prove safe, I want it to throw before any SQL exists, not to build the query and
hope.

## Acceptance

- Every identifier is syntax-checked before it reaches SQL, and a name that is
  not a bare identifier is refused — the accepted and rejected sets are pinned
  in `packages/server/src/db/query-builder/assert-safe-identifier.util.test.ts`.
- An identifier that passes is quoted, with an embedded quote doubled rather
  than dropped (`quote-identifier.util.test.ts`).
- A column that came from outside is checked against a caller-supplied allow
  list and throws **before** any SQL is built
  (`assert-column-allowed.util.test.ts`).
- No code path concatenates a value into SQL: every value becomes a `$n`
  parameter.
- Those tests run in CI on every change, through `vp run test:ci`.

## Notes

The guarantee is narrow on purpose, and knowing its edge matters more than
knowing it exists: it covers **identifiers and values**, and it holds for the
single-table reads and writes the builder covers. Anything that widens the shape
of a query — a join, a subquery, a raw fragment — widens exactly the surface
this rests on, which is why
[`express-a-join-and-an-aggregate-filter`](./express-a-join-and-an-aggregate-filter.md)
carries the safety model as part of its decision rather than as a follow-up.
