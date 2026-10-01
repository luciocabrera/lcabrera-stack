---
'@lcabrera/devkit': minor
---

A repository `devkit create` makes declares `@lcabrera/devkit` from the version of the kit that created it, read from the kit's own manifest, and every `@lcabrera/*` range the shipped workspace declares now starts at the version released with it. A repository created by a release can no longer resolve a package older than that release.

**Action needed within a day of a release:** pnpm installs no version younger than its minimum release age, a day by default. Until this release is a day old, no version the created tree's floors admit can be installed, so the tree's first install fails. Run it as `pnpm_config_minimum_release_age=0 pnpm install`. After the day has passed, a plain install works.
