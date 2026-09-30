---
'@lcabrera/devkit': patch
---

Adding a dependency with `vp add` no longer makes `devkit doctor --check` report
`pnpm-workspace.yaml` as modified. The package manager writes the new version
under the default `catalog:` key. The kit never ships that key, so the recorded
hash now leaves it out. `devkit sync` still updates the kit's part of the file,
including the named `catalogs:`, and keeps the default catalog as you left it. A
change to anything the kit ships is still reported.

An acknowledgement you recorded for `pnpm-workspace.yaml` earlier no longer
matches. If your only edit was a default catalog, the file is simply up to date.
Otherwise it is reported again, and you need to run `devkit doctor --accept` once
more.
