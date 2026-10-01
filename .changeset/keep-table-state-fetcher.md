---
'@lcabrera/ui': patch
---

Closing the settings panel no longer cancels the request that stores a grid query change. The write that records the closed panel travels on that same request. A later write of that same closed flag is skipped, so it cannot abort the reload onto the updated filters, sorting, or grouping.
