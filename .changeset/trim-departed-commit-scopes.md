---
'@lcabrera/repo-standards': patch
---

`cqms` and `admin` are no longer recognised crosscutting commit scopes. Both
named applications that left the repository this package was extracted from, so
they were consumer-visible traces of one repo's history in a shared tool. An
unrecognised scope has always been a non-blocking hint rather than a failure, so
no commit that passed before starts failing — a message scoped `cqms(...)` now
prints the same "not a known workspace or area" line any other unknown scope
gets.
