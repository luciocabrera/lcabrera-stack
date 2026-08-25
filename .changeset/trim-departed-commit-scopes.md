---
'@lcabrera/repo-standards': patch
---

Two application-specific crosscutting commit scopes are no longer recognised.
They named applications in one particular repository, which is not something a
shared standard should carry. An unrecognised scope has always been a
non-blocking hint rather than a failure, so no commit that passed before starts
failing — either one now prints the same "not a known workspace or area" line
any other unknown scope gets.
