---
id: express-a-read-through-one-entry-point
lines:
  - application
persona: application-developer
state: unmet
packages:
  - server
requires: []
issues:
  - 997
evidence:
  - type: doc
    ref: packages/server/src/db/query-builder/ARCHITECTURE.md
  - type: code
    ref: packages/server/src/db/query-builder
  - type: code
    ref: packages/server/src/db/group-query-builder
---

# One entry point expresses a read

## Statement

I want to say what I am reading — fields, filters, sorting, pagination,
aggregation, grouping — and get back a query I can run. I do not want to learn
a menu of builders first, work out which one covers the combination I have, and
then discover that my case needs two of them composed in the right order.

## Acceptance

- One exported function accepts every dimension of a read in a single argument.
- A grouped, filtered, sorted and aggregated read is one call.
- Exactly one file is documented as the query entry point, in
  `packages/server/src/db/query-builder/ARCHITECTURE.md`.
- Identifier validation and column allowlisting apply through it unchanged —
  the safety the individual builders carry is not bypassed by the shorter route.
- The change is recorded in the published surface (`vp run api-surface:verify`)
  and carries a changeset.

## Notes

The builders compose rather than compete, so this is a facade over what exists,
not a rewrite of it. The executors are a separate concern: each pairs a builder
with a pool, and folding them in would put connection handling behind the same
door as query construction.
