---
'@lcabrera/ui': minor
---

The table settings panel gains a **Display** tab, after Details, holding the
column-width presets, the row density and a new header density control. General
keeps only the clear and reset actions.

Each density group leads with a default option named for the level it falls
back to. Choosing it clears the table's own level, which the panel could not do
before. The header level is persisted in the UI-flags cookie beside the row
level.

Settings gains a **Table Display** tab with a default row density and a default
header density. A table resolves each level in this order: its own setting, its
`density` / `headerDensity` prop, the Global Settings default, then `compact`
(rows) or the row level (header). A table rendered without a
`GlobalSettingsProvider` resolves as if no default were set.

**Breaking for a consumer that builds `GlobalSettingsState` by hand**, for
example to pass `initialSettings` or `globalSettings`: the type has a new
required `tableDisplay` member. Add `tableDisplay: {}` to keep today's
behaviour. `TableSettingsTabRole` gains `'display'`, so an exhaustive `switch`
over it needs a new case.
