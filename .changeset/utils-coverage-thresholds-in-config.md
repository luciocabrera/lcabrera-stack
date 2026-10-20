---
'@lcabrera/utils': patch
---

The 95% coverage thresholds (statements, branches, functions, lines) now live in the package's Vitest config, so every coverage run enforces them, not only the one command that used to pass them as flags. The README says where they live. No exported module changes.
