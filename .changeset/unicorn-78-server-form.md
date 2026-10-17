---
'@lcabrera/server': patch
---

`createTablePageLoader`, and the distinct-value estimate that `resolveColumnCapability` reads from the catalog, now choose between their two branches inside a single call. Both return the same results for every input as before.
