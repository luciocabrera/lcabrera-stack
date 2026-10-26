---
id: render-a-table-from-rows-alone
lines:
  - application
persona: application-developer
state: unmet
packages:
  - ui
requires: []
issues:
  - 995
evidence:
  - type: code
    ref: packages/ui/src/public-api.ts
  - type: code
    ref: packages/ui/src/components/StaticTable/StaticTable.component.tsx
  - type: doc
    ref: packages/ui/README.md
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
- Deriving columns from untyped rows is documented as the zero-configuration
  path rather than left as an export a reader has to find.
- A test renders it from rows alone — no router, no loader, no fetch.
- The first usage example in `packages/ui/README.md` is that call.

## Notes

`StaticTable` is that export: it resolves from the entry map and the root
barrel, infers its columns when none are passed, and leads the README's usage
section. The requirement stays `unmet` because it still renders only inside a
data router, and a sort or filter goes through the route-based persistence and a
loader rather than applying to the rows in hand — #995 is the work that removes
the router precondition.

Re-examined against the application `devkit create --profile monorepo` now emits
(#1076), which renders a table from rows the module holds and nothing else. It
does not earn this: reaching the table there still costs a columns list, a
persistence key, a table name, a title and a loader built by
`createTableRouteLoader`, because that is what the published surface offers. The
demonstration this requirement asks for is one call taking rows and columns, and
no export answering that description exists yet.
