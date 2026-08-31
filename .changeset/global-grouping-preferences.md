---
'@lcabrera/ui': minor
---

Add a **Grouping** tab to Global Settings, holding three preferences that apply
to every table: the totals mode, the totals position, and the default group
fold.

Each is stored only when it differs from the shipped default, so choosing the
default clears the member rather than pinning it — which is what keeps a later
change to a default from being overridden by a cookie written before it moved.
The settings cookie version is deliberately **not** bumped: a v1 payload carries
no `grouping` key, which already reads as an empty preference set, so bumping
would discard everyone's navigation and pinning for nothing.

**Where each one applies, because they do not share a seam.**

- **Totals position** resolves in the loader, behind the two channels that
  already answer it: the search param wins over this table's cookie, which wins
  over the preference. A shared link still opens the way its author saw it.
- **Totals mode** applies at the interaction that **creates** a grouping from no
  keys, not in the loader. The codec drops a `flat` mode rather than emitting
  it, so a link whose author chose flat and one whose author chose nothing are
  the same string; a preference read from the param would reinstate itself every
  time the reader switched back.
- **Default group fold** seeds the expansion store, so a `collapsed` preference
  lands on the first paint rather than one paint later.

Both reach the Table through the loader's meta rather than through
`GlobalSettingsContext`, so a Table still renders outside the settings provider.

**Breaking, and why it is `minor`:** `TableGroupExpansionState` renamed
`collapsedGroupPaths` to **`toggledGroupPaths`** and gained a required
`defaultFold`. The set now holds the groups folded the _other way from the
default_ — identical to the old model under the shipped `expanded` default,
where membership still means collapsed and empty still means fully open. The
selector `useGetTableCollapsedGroupPaths` is now
`useGetTableToggledGroupPaths`, and `areAllGroupsCollapsed` is replaced by
`countCollapsedGroups`. If you read the store you are unaffected; if you
construct the state or call those two, rename. `GlobalSettingsState` also gained
a required `grouping` slice. These packages are `0.x`, so a break ships as a
`minor` (ADR-103).
