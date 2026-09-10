---
'@lcabrera/ui': minor
---

The grouping settings now separate their three subjects into sub-tabs, and the
top-level Advanced tab is gone.

The Grouping tab paints its own strip — **Group Keys**, **Aggregates**,
**Advanced** — so configuring the dimensions a read groups by no longer means
scrolling past the measures it aggregates. Advanced holds the totals mode and the
totals position, and is painted only when one of the two can render: a locked,
non-rollup grouping shows two sub-tabs.

The settings drawer's own strip is now General, Columns, Filters, Sorting,
Grouping, Details.

**Breaking, for a consumer that names the tab role.** `TableSettingsTabRole` no
longer includes `'advanced'`. Code that writes that role — a stored tab order, a
literal in a test, an exhaustive switch over the union — stops compiling and
should drop it. A stored order that names it needs no migration: the value is
sanitised on read, so the name is dropped and the remaining roles keep their
positions. A reader whose last-selected tab was `advanced` lands on the first tab
once, and one click corrects it.

`Tabs` takes an optional `label` for the tab strip's accessible name, defaulting
to what it used to hardcode. Pass it wherever a page paints more than one strip:
two `tablist` elements sharing a name are ambiguous to a screen reader and to a
role query alike.
