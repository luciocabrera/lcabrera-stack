---
'@lcabrera/repo-standards': patch
---

`repo-verify-viteplus-block` now explains a refilled Vite+ region differently. The upstream template's review checklist is content the agent document did not write, and it names a gate other than the one that document defines. The old message said `vp test` was forbidden. The gate still behaves the same way: it passes when the markers are absent or the region renders nothing, and it fails otherwise.
