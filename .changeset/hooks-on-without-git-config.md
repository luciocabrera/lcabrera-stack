---
'@lcabrera/devkit': minor
---

The hooks a created repository ships now run without a manual `git config`.
`devkit create` sets `core.hooksPath` to the hooks directory it placed, after
the initial commit, and its summary says so instead of printing the command.

From the `monorepo` rung up, `prepare` also runs a `hooks-path.mjs` script,
which the rung now places. After a clone and one install, git runs the hooks. The
script reads the hooks directory from `devkit.config.json`. It does nothing
outside a repository whose work tree starts at the install root, when the hooks
directory is missing, when the clone already set `core.hooksPath` to another
directory, or when `CI` is set, so a workflow that commits or pushes from its
checkout runs no hook. In each of those cases the install still exits 0. The script imports
only Node's own modules. It runs git from the fixed install directories first,
then from PATH, and skips any `node_modules` directory on PATH, so a
dependency's `git` bin never runs in its place.

The task block is reconciled key by key, so `sync` updates an untouched
`prepare` in a repository already at the rung. `devkit init` and `devkit sync`
still never change git config themselves.

`paths.hooks` in `devkit.config.json` must now be a non-empty path inside the
repository, relative to its root. An absolute path, one that climbs out with
`..`, or one starting with a prefix git expands (`~`, `%(prefix)`,
`:(optional)`) was materialised under the repository but read by git somewhere
else, and an empty or non-string value placed the hooks where the `prepare`
script did not look, so in each case the shipped hooks never ran. Every command
and the `prepare` script now refuse such a value with an error naming the key. A
config that already names a plain relative directory is unaffected.

The `prepare` script also leaves the hooks off when the hooks directory resolves
outside the repository through a symlink, and unsets `core.hooksPath` if it
already pointed there.
