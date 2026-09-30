---
'@lcabrera/devkit': patch
---

Adding a dependency with `vp add` no longer makes `devkit doctor --check` report
`pnpm-workspace.yaml` as modified. The package manager writes the new version
under the default `catalog:` key. The kit never ships that key, so the recorded
hash now leaves it out. `devkit sync` still updates the kit's part of the file,
including the named `catalogs:`, and keeps the default catalog as you left it. A
change to anything the kit ships is still reported.

If you acknowledged `pnpm-workspace.yaml` earlier and the file holds a default
`catalog:` block, that acknowledgement no longer matches, because the hash now
leaves the block out. If the default catalog was your only edit, the file is
simply up to date. Otherwise it is reported again. Acknowledge it once more
with:

```bash
devkit doctor --accept pnpm-workspace.yaml --reason "<why this edit is deliberate>"
```

An acknowledgement of a file with no default catalog still matches.
