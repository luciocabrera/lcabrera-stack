---
'@lcabrera/devkit': minor
---

**The `monorepo` rung places a workspace, not a description of one.**

`devkit create <dir> --profile monorepo` now emits the workspace itself: a pnpm
workspace file with a catalog and `engineStrict`, the exact Node pin beside the
band an install may proceed in, the root Vite+ lint and format config, a Biome
config, and a tsconfig roster with the generator wired to it. After one install
the tree lints, formats, type-checks and tests, and the install is what writes
every tsconfig — none of them is written by hand.

**Breaking, landing as a `minor` because this package is pre-1.0.** A repository
whose config says `"profile": "monorepo"` or `"profile": "full"` receives files
it did not receive before, and `sync` will place them on the next run. A tree
that already holds a `pnpm-workspace.yaml`, a `vite.config.ts` or a `biome.jsonc`
of its own sees each reported as `conflict` and left alone; acknowledge one with
`devkit doctor --accept <path> --reason "<why>"`, or move yours aside and let
`sync` place the seed. Set `"profile": "repo"` to keep receiving exactly what
you received before.

The root manifest is the one file the rung does not materialise, because it
carries the repository's own name: its task block, engine band, package manager
pin and dependencies are written by `create`, once, and are never rewritten
afterwards. `init` leaves an existing repository's manifest alone, as it always
has.

An asset named `gitignore` now lands as `.gitignore`. A file spelled that way in
the package is dropped from the tarball by the packer, so it reached nobody while
reading, in a source checkout, exactly like one that shipped.

`analyseClosure` takes a new optional `allowedPackages`: from this rung up a
shipped file may import a package the tree it is emitted into declares, and such
an import is no longer reported as an escape.
