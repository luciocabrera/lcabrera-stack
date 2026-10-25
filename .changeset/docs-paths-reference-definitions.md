---
'@lcabrera/repo-standards': patch
---

`repo-verify-docs-paths` now resolves the target of a reference-style link definition (`[label]: target`) the same way it resolves an inline link target, so a definition pointing at a missing file fails the gate. It reads the target past an optional title and inside angle brackets, and skips footnote definitions, targets with a URL scheme and in-page anchors. Fenced code is now found line by line, so a tilde fence, a fence longer than three backticks and an inline ` ``` ` mention no longer change which text counts as prose.
