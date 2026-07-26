---
'@lcabrera/ui': minor
---

**Breaking:** the Table renders **square corners by default**. The
`borderRadius.lg` it always applied to its outer card is now opt-in behind a new
`isRounded` meta flag, so a table drops into a surrounding card, panel or split
pane without a rounded edge floating inside a square one — the case that
previously had no answer short of overriding the package's styles.

Consumers that want the previous look pass the flag through `metaState`:

```tsx
// before — always rounded
<TableLayout columnsState={columnsState} metaState={{ persistenceKey: 'orders' }} />

// after — opt in to keep the rounded card
<TableLayout
  columnsState={columnsState}
  metaState={{ isRounded: true, persistenceKey: 'orders' }}
/>
```

`isRounded` joins `isBordered` and `isStriped` as a presentation flag on
`TableMetaState`, readable anywhere in the tree via the new
`useGetTableIsRounded` selector (`@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors`).
It is not persisted to the cookie: it is a consumer-chosen layout decision, not
a user preference the table lets you toggle at runtime.
