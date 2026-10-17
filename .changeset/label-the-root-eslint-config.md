---
'@lcabrera/repo-standards': patch
---

`repo-eslint-staged` names a config at the repository root `.` in its summary. It used to print an empty bullet, because the root's path relative to itself is the empty string.
