---
id: a-column-says-how-its-cells-look
lines:
  - application
persona: application-developer
state: unmet
packages:
  - ui
requires: []
issues:
  - 1318
evidence:
  - type: code
    ref: packages/ui/src/components/Table/Table.types.ts
  - type: code
    ref: packages/ui/src/components/Table/TableBodyCell/utils/renderCellContent.util.tsx
  - type: code
    ref: packages/ui/src/components/Table/TableBody/utils/buildTableBodyCellDescriptor.util.tsx
  - type: test
    ref: apps/showcase/src/routes/enterprise-orders/enterprise-orders.loader.test.ts
  - type: doc
    ref: docs/decisions/ADR-009-serializable-filter-options-descriptors.md
---

# A column says how its cells look, even when the server sends it

## Statement

My columns come from the server, and some of them should look like more than
text: a score as a coloured pill, a change as a signed arrow, a name in a fixed
width font. I want to say that in the column definition the server sends and
have the grid draw it. When I need a look the library does not ship, I want to
register it once on the client, without rewriting columns the server already
sent.

## Acceptance

- `TableColumn` has a `cell` field whose type has no function member, and the
  no-function-path assertion in `enterprise-orders.loader.test.ts` still passes
  with `cell` set on a column.
- `@lcabrera/ui` renders the `badge`, `delta` and `text` kinds, and unit tests
  cover each one, including threshold edges and a categorical miss.
- A `cell` of an unknown kind, or with malformed params, renders the column's
  `dataType` default, and a test shows neither throws.
- A renderer registered on the client by kind replaces the built-in of the same
  name, and a test covers it.
- A showcase route renders each built-in kind from columns its loader returns.
- A badge shows its value as text, so colour is never the only signal.

## Notes

![A skills grid: monospace names, score pills coloured by value, a bold overall and a signed change](../assets/custom-cells-reference.png)

The screenshot is the target. Every column in it can be described as data: the
name is `text` with a monospace flag, each score is a `badge` with numeric
thresholds, the overall is bold `text` over a one-decimal number, and the change
is a `delta`. The proposed descriptor shapes, the open questions and the scope
are on #1318.

`render` already exists and does not answer this. It is a function, and
single-fetch replaces a function with `undefined` on the client, which is the
trap ADR-009 recorded for filter options. The same answer applies here: the
server sends a `{ kind, params }` descriptor and the client owns the
implementation. The client merges renderers by kind, never by column key, so
the server stays the one place that decides how a column looks.
