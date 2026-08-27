---
id: connect-a-grid-to-a-table-by-name
lines:
  - application
persona: application-developer
state: unmet
packages:
  - ui
  - api
  - server
requires: []
issues:
  - 996
  - 999
evidence:
  - type: code
    ref: packages/ui/src/routing/loaders/createTableRouteLoader.util.ts
  - type: code
    ref: packages/api/src/http/http.types.ts
  - type: test
    ref: apps/showcase/src/routes/enterprise-orders/filterContract.test.ts
---

# A grid connects to a table by naming it

## Statement

I have a Postgres table and a column set. I want to name the schema, the table
and the columns, and get a grid a user can filter, sort, group and page
through. I do not want to write the parameter parsing, the loader wiring or the
serialisation of a filter between my client and my server — that is plumbing
every consumer would write identically, and none of us can check that our copy
agrees with what the server expects.

## Acceptance

- One documented entry point takes a schema name, a table name and a column set.
- The filter wire shape is typed by a package: `packages/api/src/http/http.types.ts`
  no longer types the filter field as `unknown`.
- The parse of that wire shape is exported from a package, and a malformed
  payload comes back as a typed failure rather than being trusted.
- The showcase consumes the entry point instead of its own composition — the
  round-trip parse does not live in application code.
- `apps/showcase/src/routes/enterprise-orders/filterContract.test.ts` still fails
  when the two ends disagree.

## Notes

The two column-filter shapes stay duplicated across `@lcabrera/ui` and
`@lcabrera/server` on purpose ([ADR-039](../../decisions/ADR-039-duplicate-over-undeclared-edges.md));
what is missing is the **serialised form between them**, which is a third thing
and belongs to neither copy.
