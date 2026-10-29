---
id: render-a-table-from-rows-alone
lines:
  - application
persona: application-developer
state: met
packages:
  - ui
requires: []
issues:
  - 994
evidence:
  - type: command
    ref: vp run test:ci
  - type: test
    ref: packages/ui/src/components/Table/Table.fromRows.test.tsx
  - type: code
    ref: packages/ui/src/public-api.ts
  - type: code
    ref: packages/ui/src/components/Table/Table.component.tsx
  - type: doc
    ref: packages/ui/README.md
  - type: doc
    ref: docs/decisions/ADR-142-a-table-given-rows-keeps-its-state-in-memory-and-the-route-level-layout-supplies-persistence.md
---

# A table renders from rows and columns alone

## Statement

I have an array of rows and the columns I want shown. I want a working table on
the page — scrolling, sorting, styled like the rest of the library — without
standing up a server, writing a loader, or putting the table behind a route.
This is the first thing I try after installing, and it is the claim the package
leads with.

## Acceptance

- One documented export takes the rows and the columns as props and renders a
  table.
- It resolves from the package's entry map **and** from
  `packages/ui/src/public-api.ts`, so reaching it needs no deep import past the
  public surface.
- `vp run api-surface:verify` records it in `reports/api-surface/ui.txt`.
- Deriving columns from untyped rows is documented as an option a caller runs
  and passes in, rather than left as an export a reader has to find.
  **Amended 2026-10-27 by the owner:** this read "the zero-configuration path".
  The columns are the table's metadata, so they stay a required prop and the
  table infers none (#994 §5).
- A test renders it from rows and columns alone — no router, no loader, no
  fetch — and another renders the same rows from a promise of them.
- The first usage example in `packages/ui/README.md` is that call.

## Notes

`Table` is the export. It is on the root barrel and on the `./components/Table`
subpath. It requires `columns` and takes one data input, `response`, which is an
array of rows or a promise of one. The README's usage section opens with that
call, then shows `inferTableColumnsFromJson` as a helper a caller may run on
rows of unknown shape. In `Table.fromRows.test.tsx`:

- one test renders the rows from a plain array with no providers and no router;
- one renders the same rows from a promise of that array;
- one checks with `expectTypeOf` that `columns` is required.

The `command` pointer was checked by breaking the property. Making `Table` skip
mounting its own providers fails the plain-array render and every in-memory case
in that file. Returning the given rows unsorted from `useTableDataState` fails
the sort, clear-sort and filter cases. Making `columns` optional fails the `expectTypeOf` check under `vp run typecheck`. All three were reverted.
