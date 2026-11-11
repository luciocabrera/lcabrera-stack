---
id: table-density-follows-my-default
lines:
  - application
persona: data-user
state: met
packages:
  - ui
requires:
  - the-settings-panel-fits-the-way-i-work
issues: []
evidence:
  - type: command
    ref: vp run test:ci
  - type: test
    ref: packages/ui/src/components/Table/Table.densityDrawer.test.tsx
  - type: test
    ref: packages/ui/src/components/Settings/Settings.component.test.tsx
  - type: test
    ref: packages/ui/src/components/Table/TableSettingsDrawer/DisplaySettingsSection/DisplaySettingsSection.test.tsx
  - type: doc
    ref: docs/decisions/ADR-148-table-density-falls-back-from-the-table-to-its-prop-to-the-global-default.md
---

# Table density follows my default

## Statement

I read some tables packed tight and others with room to breathe, and the header
row is often the one I want taller or shorter than the rest. I want to say how
dense a table is once, in Settings, and have every table I open start there. On
one table I should still be able to pick something else, header and rows apart,
and then go back to my default without guessing what it was.

## Acceptance

- The table settings drawer has a Display tab, after Details, holding the
  column-width presets, the row density and the header density. Decided by
  `TableSettingsDrawerBody.test.tsx` → "puts Columns after General and Grouping
  after Sorting" and `DisplaySettingsSection.test.tsx` → "holds the width
  presets, the row density and the header density".
- The header level changes the header row apart from the body and survives a
  reload. Decided by `Table.densityDrawer.test.tsx` → "sets the header row apart
  from the body, and persists it".
- Each density group leads with a default option that names the level it falls
  back to, and choosing it drops the table's own level. Decided by
  `DisplaySettingsSection.test.tsx` → "names the level a cleared row density
  falls back to", and by `Table.densityDrawer.test.tsx` → "drops the table level
  on Default, so the rows fall back to the global default".
- With nothing set on the table or its props, a table takes the global default;
  a `density` prop outranks it. Decided by `Table.densityDrawer.test.tsx` →
  "takes the global default when neither the table nor the prop names a level"
  and "lets the density prop outrank the global default".
- Settings carries a Table Display tab holding both defaults, Accept persists
  them, and choosing the shipped default clears the preference rather than
  storing it. Decided by `Settings.component.test.tsx` → "persists the table
  density defaults from the Table Display tab" and "clears a table density
  default that returns to the shipped one".
- A tab order stored before the Display tab existed still shows it. Decided by
  `TableSettingsDrawerBody.test.tsx` → "appends the Display tab to an order
  stored before it existed".

## Notes

The `command` pointer was checked against two plants. Dropping the global
fallback from `TableGridContent` fails "drops the table level on Default…" and
"takes the global default…"; dropping `headerDensity` from
`getPersistedUiState` fails "sets the header row apart from the body, and
persists it".
