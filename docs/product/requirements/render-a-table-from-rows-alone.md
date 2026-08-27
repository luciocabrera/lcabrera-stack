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
  - 994
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

`StaticTable` has this props shape today and is exported from neither the entry
map nor the public surface, so the only documented route in is `TableLayout`,
whose props are a columns-state object and a promise. Whether the answer is to
export the one that exists or to build a different one is the issue's business,
not this file's — the requirement is the shape a consumer needs, not the
implementation that satisfies it.
