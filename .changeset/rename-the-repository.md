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
output. ESLint shows `meta.docs.url` beside every finding, and none of the ten
rules had a URL that resolved: eight emitted `https://example.com/rule/<name>`,
the placeholder the first rule was scaffolded from, and two pointed at a
`/rules/<name>` path this repository has never had. All ten now link to the
rule's own section in the package README, which does exist, and they build that
link from one shared factory instead of ten copies — the copies are what let
eight of them drift.
