---
id: render-a-small-read-only-table-that-sizes-to-its-rows
lines:
  - application
persona: application-developer
state: met
packages:
  - ui
requires:
  - render-a-table-from-rows-alone
issues:
  - 1560
evidence:
  - type: test
    ref: packages/ui/src/components/Table/Table.staticLayout.test.tsx
  - type: code
    ref: packages/ui/src/components/Table/Table.component.tsx
  - type: code
    ref: packages/ui/src/components/Table/Table.types.ts
  - type: doc
    ref: docs/decisions/ADR-146-build-application-ui-from-the-component-library.md
  - type: command
    ref: vp run test:ci
---

# A small read-only table sizes to its rows

## Statement

Some of my tables are a handful of rows inside a card or a section of a page: a
summary, a comparison, a short list with links in it. I want each one to show
every row and be as tall as its rows, wherever I put it, with a caption that
says what it is and numbers lined up where I want them. I do not want a scroll
viewport, a toolbar, a settings panel or column menus on a table nobody needs to
configure, and I do not want to learn a second table component to get there.

## Acceptance

- The same `Table` export renders it, selected by a prop. No second table
  component is exported, and `vp run api-surface:verify` records the new prop
  in `reports/api-surface/ui.txt`.
- A test renders it from rows and columns inside a parent with no set height,
  and finds as many body rows in the DOM as there are rows given, a non-zero
  table height, `role="table"` and the caption as the table's `<caption>`.
- With its defaults it renders no settings button, no column menu and no resize
  handle, and a test asserts each is absent.
- A column sets its alignment to start, center or end, and a column that sets
  none aligns as its `dataType` gives. A test covers an explicit alignment and
  the default.
- A link inside one of its cells is reachable with Tab, and a test shows it.
- The existing virtualised `Table` tests pass unchanged.

## Notes

ADR-146 (b) holds the decision that this is a `layout` of `Table` rather than
a component of its own, and why. It leans on
`render-a-table-from-rows-alone` for the data input: the rows arrive the same
way in both layouts.
