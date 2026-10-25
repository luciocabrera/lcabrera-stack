---
'@lcabrera/repo-standards': patch
---

`repo-verify-docs-paths` now resolves the target of a reference-style link definition (`[label]: target`) the same way it resolves an inline link target, so a definition pointing at a missing file fails the gate. It reads the target past an optional title, inside angle brackets, on the line after the colon and inside a blockquote. It skips footnote definitions, lines indented as code, targets with a URL scheme and in-page anchors, and, like inline links, anything inside fenced code.
