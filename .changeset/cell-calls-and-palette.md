---
'@lcabrera/ui': minor
---

A column can now say how its cells look, in data a loader can send. `TableColumn.cell` takes a call, `{ kind, params }`, with no function in it, so it crosses the loader boundary the way `filterOptionsDescriptor` does.

The client runs a call only after checking it. It looks the `kind` up among the registered renderers and validates `params` against that renderer's [Standard Schema](https://standardschema.dev). If the kind is not registered, the params fail validation, or the validator answers asynchronously, the cell renders its `dataType` default, and a development build warns once per column.

- **Built-in renderers.** `badge` puts the formatted value in a pill and picks its tone from `rules`, an ordered list of `{ gte?, lt?, equals?, tone }` where the first match wins, falling back to `fallbackTone`. Both params are optional: with no `rules` the pill takes `fallbackTone`, which defaults to `neutral`. `delta` shows `▲`, `▼` or `±` and the absolute value, rounded to `precision` decimals and toned by `increase`, `decrease` or `unchanged` (defaults `success`, `error`, `neutral`). `text` draws the formatted value; `monospace: true` sets a fixed-width font and `weight: 'bold'` a bold one.
- **Your own renderers.** `TableLayout` and `Table` take `cellRenderers`, merged over the built-ins by `kind`, so you can replace a built-in as well as add a kind. A renderer's `params` is any Standard Schema, from Zod, Valibot, ArkType or one you write. This package adds no validator dependency.
- **Colours are tone names.** `success`, `warning`, `error`, `info` and `neutral` follow the theme tokens. A `cellPalette` defines any other name, or redefines a built-in one, with a light pair and a dark pair of CSS colours. It can come from the loader as `columnsState.cellPalette` (`createTableRouteLoader` takes a `cellPalette` option), and from a `cellPalette` prop on `TableLayout` or `Table`, which wins. A tone found nowhere, or an entry with an invalid colour, renders as `neutral`.

New types in `./components/Table/Table.types`: `TableCellCall`, `TableCellRenderer`, `TableCellRenderArgs`, `TableCellPalette`, `TableCellPaletteEntry`, `TableCellToneColors`, `StandardSchemaV1`, `StandardSchemaV1Issue` and `StandardSchemaV1Result`. `TableColumnsStateInput` gains an optional `cellPalette`. Nothing existing changes. `render` still works and takes precedence over `cell`.
