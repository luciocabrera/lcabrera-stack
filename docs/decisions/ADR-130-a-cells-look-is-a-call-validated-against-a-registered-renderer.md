---
governs:
  - ui
---

# ADR-130 — A cell's look is a call validated against a renderer the client registers

**Status:** Accepted

## Context

A `TableColumn` could say what its value is (`dataType`) but not how its cell
looks. The `dataType` default is a fixed formatter, and the only other way in was
`render?: (row) => ReactNode`. A function does not cross a React Router loader:
single-fetch replaces it with `undefined` on the client, which is the trap
[ADR-009](./ADR-009-serializable-filter-options-descriptors.md) recorded for
filter options. So a grid whose columns are built on the server, from a route
constant today or from the catalogue later, could only draw plain formatted
text.

A closed set of looks would not have fixed that. One score column can need more
colour steps than the design system's five tone names, and any list the library
fixes is one tone short for the next grid.

## Decision

A column carries `cell?: TableCellCall`, which is `{ kind, params }` and nothing
else. It is plain data and crosses the loader unchanged, the way
`filterOptionsDescriptor` does. The shape mirrors a tool call to a model: the
server sends a name and arguments, and the client owns the implementations.

**The client registers renderers.** A `TableCellRenderer<TParams>` is
`{ kind, params, render }`. `params` is a
[Standard Schema](https://standardschema.dev), so an application brings whatever
validator it already uses (Zod, Valibot, ArkType) and `@lcabrera/ui` takes no
validator dependency. The package carries its own structural copy of the
Standard Schema type in `Table.types.ts`, which the specification allows, and the
built-in renderers implement it with hand-written parsers. The copy holds only
what the package reads: `validate`, `vendor`, `version` and each issue's
`message`. The specification's `types` and issue `path` members are optional and
declared `| undefined` by the vendors; copying them without that `undefined`
makes a Zod schema unassignable for a consumer compiling with
`exactOptionalPropertyTypes`, and copying them with it is redundant under this
repository's settings. Leaving them out is assignable both ways, and a parser
names the offending key in its message instead. `render` is typed
bivariantly so that a list of renderers with different parameter types is one
`readonly TableCellRenderer[]`; the schema is what guarantees each renderer
receives its own params.

`badge`, `delta` and `text` are built in. `TableLayout` and `Table` take
`cellRenderers`, merged over the built-ins by `kind`, so an application can
replace a built-in as well as add a kind. Nothing is merged per column key: the
server decides which column gets which call.

**Validate, then run.** For each painted column that carries a call, the body
looks the kind up and validates `params` once per render of the row window, not
once per cell. A cell then resolves in this order: the structural group cell,
`render`, the call, the `dataType` default. The call falls through to the default
when its kind is not registered, when its params fail validation, when the
validator answers asynchronously (the render path cannot wait), or when the
validator throws. Any thenable counts as asynchronous, not only a native
`Promise`, and its settlement is caught, so a validator that rejects cannot
become an unhandled rejection in a server render. Each case logs one development-only warning per column per
grid. A malformed call is never executed. A loading placeholder row and a group
row's aggregate cell draw the plain default; a pill around an averaged score
would read as a single score.

A renderer receives the raw `value`, the `row`, its validated `params`, the
column's `dataType` default rendering as `formatted`, and `tone(name)`. An
exception thrown by a renderer's own `render` is not caught, the same contract
`render` on a column has.

**Colours are tone names.** A call names a tone; `tone(name)` resolves it to a
`{ background, text }` pair for the active theme by walking the palettes from
the one closest to the grid outwards, then the built-in tones, and answering
`neutral` for a name found nowhere. The layers, nearest first: the `Table`
`cellPalette` prop, the `TableLayout` `cellPalette` prop, and
`columnsState.cellPalette` from the loader, which `createTableRouteLoader` sends
when the route declares one. The application therefore has the last say over how
a tone the server names looks. The layering is carried by a static context,
`TableCellRenderingProvider`, which each of the two components renders and which
appends to its parent's layers.

A palette entry is `{ light: { background, text }, dark: { background, text } }`.
An entry counts only when all four values are colours; otherwise it is missing
from its layer, so a lower layer or a built-in shows through. On the client the
check is `CSS.supports('color', value)`. A server render has no `CSS` object, so
it checks the value's syntax instead, and `useSyncExternalStore`'s server
snapshot is what lets the client re-check after hydration without a mismatch.

The light or dark pair is chosen by reading the theme context, not with CSS
`light-dark()`. The themes are applied as a StyleX theme class and do not set
`color-scheme`, which is what `light-dark()` follows. Every colour reaches the
cell through a StyleX dynamic style.

The built-in tones map onto the theme tokens: `success`, `warning`, `error` and
`info` pair the solid semantic colour (`colors.success`) with its text token
(`colors.successText`), and `neutral` pairs `backgroundTertiary` with
`textSecondary`. The `*Background` tokens are translucent tints, and the `*Text`
tokens are drawn to sit on the solid colour, so pairing the tint with the text
token gives text that cannot be read. `delta` draws its signed value in a pill
of the tone for the same reason: a tone is a pair, and only the pair is legible.

## Consequences

A server-built grid can draw badges, signed changes and styled text, in colours
the library does not ship, with no function crossing the loader. An application
adds a look by registering a renderer and a palette entry, and is checked the
same way the built-ins are.

The costs:

- `cell` is validated only on the client. A server can send a call no client has
  registered; the grid draws the default and warns in development, and nothing
  fails at build time.
- A palette value that is valid by syntax but not by `CSS.supports` renders
  transparent in the server HTML and as `neutral` after hydration. A palette
  value that is valid but uses a colour function the syntax check does not know
  renders `neutral` in the server HTML and correctly after hydration.
- Validation runs per column on each render of the row window. A renderer whose
  schema is expensive pays for it there.
- `render` remains, and wins over `cell`, so the two can disagree on one column
  and the function silently takes it.

## Alternatives considered

- **A function on the column.** It is what `render` already is, and single-fetch
  drops it. Re-attaching functions on the client by column key is what ADR-009
  removed for filter options, and it does not work for columns built at runtime.
- **A closed union of kinds and params in the type.** It would make each call
  type-checked on the server, and it would make every new look a library
  release. The renderer an application registers is the authority on its own
  params.
- **A Zod schema for params.** It would add a runtime dependency to every
  consumer and choose their validator for them. Standard Schema is a type every
  common validator already implements.
- **A fixed set of colours in the library.** The fourth step of a score column is
  already outside the five built-in names. Tones are arguments, and a palette
  defines them.
- **Raw CSS in params.** Styling would become a second, unbounded surface to
  validate. Colour goes through tones only.

## References

- [ADR-009](./ADR-009-serializable-filter-options-descriptors.md) — the
  serializable descriptor this follows.
- [ADR-039](./ADR-039-duplicate-over-undeclared-edges.md) — if the server package
  ever builds columns, it carries its own copy of the call shape.
- [ADR-118](./ADR-118-split-tablemetastate-into-capability-grouping-query-and-chrome.md) — why the
  loader palette sits on `columnsState` rather than on the meta.
- Issue #1318.
