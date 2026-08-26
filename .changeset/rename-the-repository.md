---
'@lcabrera/eslint-plugin': patch
'@lcabrera/repo-standards': patch
'@lcabrera/vite-config': patch
'@lcabrera/tsconfig': patch
'@lcabrera/server': patch
'@lcabrera/devkit': patch
'@lcabrera/utils': patch
'@lcabrera/node': patch
'@lcabrera/api': patch
'@lcabrera/ui': patch
---

Point `homepage`, `bugs` and `repository.url` at the repository's new name.

The old URLs still resolve — GitHub redirects them — but only while the old name
stays unregistered, and a published version's metadata can never be corrected in
place. Every already-published version keeps the old URL permanently, so this is
the first release whose links are right on their own.

`@lcabrera/eslint-plugin` also changes what it prints into a consumer's lint
output. Its `domain-folder-filename` and `filename-convention` rules build a
docs URL that ESLint shows beside each finding, and that URL pointed at
`/rules/<name>` — a path that has never existed in this repository. It now points
at the rule's own section in the package README, which does.
