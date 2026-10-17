---
'@lcabrera/vite-config': minor
---

Both eslint factories now configure `perfectionist/sort-imports` to treat a block comment as a partition. The sort's autofix used to count a file's leading block comment as part of the first import, so sorting that import further down moved the file header into the import list. A block comment is now left where it is, and the imports above and below it are sorted separately. Line comments still move with the import they sit on.
