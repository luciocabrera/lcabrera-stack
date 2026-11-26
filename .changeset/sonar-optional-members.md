---
'@lcabrera/ui': minor
'@lcabrera/server': minor
---

Three optional members whose type allowed `undefined` now accept only defined values: `NavbarLinkConfig['variant']` and `Sorting['direction']` (reached through `SortingState`) in `@lcabrera/ui`, and `TableLoaderPageArgs['totalsPlacement']` in `@lcabrera/server`. The defined values each member accepts are unchanged. A consumer compiling with `exactOptionalPropertyTypes` can no longer pass an explicit `undefined` to any of them. Leave the member out instead.
