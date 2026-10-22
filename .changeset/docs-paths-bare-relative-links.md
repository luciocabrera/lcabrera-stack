---
'@lcabrera/repo-standards': patch
---

`repo-verify-docs-paths` now resolves every markdown link target that carries no URL scheme. A bare relative target with a non-markdown extension, such as a sibling `.json` file, used to pass when the file was missing, because only `./` and `../` targets, root-anchored targets and `.md` targets were resolved. Targets with any scheme (`https:`, `mailto:`, `tel:`) and in-page anchors are still skipped.
