---
'@lcabrera/repo-standards': patch
---

The lint-report generator orders the eslint results with `toSorted()` and writes the sorted copy, instead of sorting the collected results array in place. The written report is unchanged.
