---
id: use-the-grid-without-a-router
lines:
  - application
persona: application-developer
state: met
packages:
  - ui
requires:
  - render-a-table-from-rows-alone
issues:
  - 994
  - 995
evidence:
  - type: command
    ref: vp run test:ci
  - type: test
    ref: packages/ui/src/components/Table/Table.fromRows.test.tsx
  - type: code
    ref: packages/ui/package.json
  - type: code
    ref: packages/ui/src/components/Table/contexts/TableConfig/TablePersistenceContext.context.ts
  - type: doc
    ref: docs/decisions/ADR-142-a-table-given-rows-keeps-its-state-in-memory-and-the-route-level-layout-supplies-persistence.md
---

# The grid works with no router mounted

## Statement

My application does not use React Router, or the grid sits on a page outside the
router's tree. I still want to sort a column, filter, resize and page through the
data. I accept that nothing is written back to a URL when there is no URL to
write to — what I do not accept is an interaction that throws.

## Acceptance

- Every interaction that does not inherently need a server works with no router
  present in the tree.
- State that would be persisted through the router degrades to in-memory rather
  than throwing.
- The peer declarations in `packages/ui/package.json` say what the code actually
  requires: a dependency the grid calls unconditionally is not labelled
  optional, and one it can do without is.
- A test renders the grid outside a router provider and drives a state change
  through it.

## Notes

Persistence is a context that only the route-level `TableLayout` provides. Every
persist action reads it, and without it the action applies the change to the
stores and submits nothing, so no router hook is reached. A `Table` given rows
sorts and filters them in memory. The empty state offers Retry only under the
layout, because outside it there is no loader to revalidate.
`Table.fromRows.test.tsx` sorts, clears a sort, filters to some rows and to none,
and opens the table settings, all with no router and no app providers.

`react-router` stays a required peer, and that is what the code requires: the
package's modules import it unconditionally, so it has to be installed even
where no router is mounted. Grouping and drill-down need a server and are out of
scope here.

The `command` pointer was checked by breaking the property. Rendering the Retry
button whatever the context fails the filter-to-nothing case with
`useRevalidator must be used within a data router`. Reverted.
