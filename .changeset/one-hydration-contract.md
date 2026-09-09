---
'@lcabrera/ui': patch
---

Sync a store provider from a later snapshot of the same instance, and abort an
initial list fetch when the provider unmounts so a closed list cannot write the
next open's first page.
