---
'@lcabrera/ui': patch
'@lcabrera/server': patch
---

Optional members whose type already allowed `undefined` now name the defined type with `NonNullable<…>`: `NavbarLinkConfig['variant']` in `@lcabrera/ui` and `TableLoaderPageArgs['totalsPlacement']` in `@lcabrera/server`. Each accepts the same values as before.
