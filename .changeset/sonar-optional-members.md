---
'@lcabrera/ui': minor
'@lcabrera/server': minor
---

Optional members whose type already allowed `undefined` now name the defined type with `NonNullable<…>`: `NavbarLinkConfig['variant']` in `@lcabrera/ui` and `TableLoaderPageArgs['totalsPlacement']` in `@lcabrera/server`. The defined values each member accepts are unchanged. A consumer compiling with `exactOptionalPropertyTypes` can no longer pass an explicit `undefined` to either member. Leave the member out instead.
