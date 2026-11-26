---
'@lcabrera/repo-standards': patch
---

`runGh` takes an optional second argument, `{ input }`, which it writes to `gh`'s stdin. Without it, stdin stays closed as before. The coverage, merged-coverage and lint-report scripts produce the same output as before.
