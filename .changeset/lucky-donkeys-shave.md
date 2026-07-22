---
'@lcabrera/utils': patch
'@lcabrera/api': patch
'@lcabrera/ui': patch
---

Add and update package READMEs.

npm renders `README.md` as the package page, and `@lcabrera/api` and
`@lcabrera/ui` had none — both pages were empty. Each now covers what the package
is, how to install it, every subpath export, and worked examples.

`@lcabrera/ui`'s leads with the constraint a consumer hits first: it ships
TypeScript source rather than a compiled bundle, so the bundler must compile it
and run StyleX over it.

`@lcabrera/utils`'s install step told readers to use `workspace:*`, which only
resolves inside this repo; its export table had also drifted four entries behind
the `exports` map.

A README only reaches npm with a release, so this is a patch across the three.
