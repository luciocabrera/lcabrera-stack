---
id: the-grid-is-keyboard-operable
lines:
  - application
persona: data-user
state: met
packages:
  - ui
requires: []
issues: []
evidence:
  - type: test
    ref: packages/ui/src/components/Table/Table.gridFocus.test.tsx
  - type: test
    ref: packages/ui/src/components/Table/Table.groupedGridSemantics.test.tsx
  - type: command
    ref: vp run test:ci
  - type: doc
    ref: docs/decisions/ADR-062-grid-semantics-roving-focus-and-row-identity.md
---

# The table is operable from the keyboard, and honest to a screen reader

## Statement

I work through the table with a keyboard, and some of us have it read aloud. I
want to arrive at one stop rather than tabbing through every cell, move around
with the arrow keys, and be told how many rows there are and which one I am on —
even though the page is only holding a slice of them. A group should behave like
a row I can open, and tell me where it sits and what is under it. Keys the table
has no use for should still do what they do everywhere else.

## Acceptance

- The grid declares its roles on the elements that carry them, and becomes a
  tree grid once the rows are a tree.
- Exactly one tab stop exists as focus enters, moves through and leaves the
  table; the arrow keys move it without wrapping at an edge; Home and End move
  within the row, the range modifier moves across the grid, and PageUp/PageDown
  move by a viewport of rows.
- A key the grid does not claim is left to the page.
- The row count reported is the whole dataset and each row's index is absolute,
  so virtualization is invisible to a screen reader — and the spacer rows that
  make virtualization work are hidden from the accessibility tree.
- A group row states its own level and its position within its parent set rather
  than within the whole grid, and exposes whether it can be expanded.
- Both test files above run in CI through `vp run test:ci`.

## Notes

Written in the data user's vocabulary because they are who this fails for, but
it is a claim about `packages/ui` and is tested there — the tests assert the
semantics the assistive technology reads, not a rendering. The model and why
focus roves over data-derived rows rather than DOM position is
[ADR-062](../../decisions/ADR-062-grid-semantics-roving-focus-and-row-identity.md).
