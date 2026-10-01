---
'@lcabrera/devkit': patch
---

A repository `devkit create` makes declares `@lcabrera/devkit` from the version of the kit that created it, read from the kit's own manifest, and every `@lcabrera/*` range the shipped workspace declares now starts at the version released with it. A repository created by a release can no longer resolve a package older than that release.
