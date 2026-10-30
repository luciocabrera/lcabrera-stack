---
'@lcabrera/ui': minor
---

`Table` density now has four levels: `'dense' | 'compact' | 'comfortable' | 'spacious'`. Each level sets the row height (24, 32, 40 and 48px), the body font (`fontSizeXs`, `fontSizeSm`, `fontSizeSm`, `fontSizeMd`) and the cell inline padding (`spacing.xxs`, `spacing.xs`, `spacing.sm`, `spacing.md`). The header font is `fontSizeXs` at `dense` and `fontSizeSm` at every other level.

- `Table` takes `density` and `headerDensity` props for both data sources. They set the level when the meta state holds none. A level in the meta state, whether passed in or chosen in the settings drawer, wins over them.
- `headerDensity` sets the header row's level on its own and defaults to `density`.
- The level gives the default row height, and the virtualizer and the rows read that same value. A `rowHeight` set in the meta state still wins.
- The table settings drawer lists all four levels and applies a choice at once.
- Cells no longer set their own padding or font size. They read CSS variables that `<table>` sets from the level.

The one visible change to a table that keeps the default `compact` level: cell inline padding goes from a fixed `6px` to `spacing.xs`. Row height, body font and the `fontSizeSm` header stay as they were.

A meta state saved with `density: 'comfortable'` loads unchanged, with no migration, and now renders at 40px instead of 32px with `spacing.sm` padding. Set `compact` to keep the old look.

`TableChromeState.density` and `TableChromeState.rowHeight` are now optional, and `getInitialMetaState` leaves both unset, so the density and the `Table` props can resolve them. Code that reads either field from a meta state should expect `undefined`. Code that switches on `TableDensity` exhaustively must handle `dense` and `spacious`.
