---
'@lcabrera/devkit': minor
---

**The `monorepo` rung places a workspace, not a description of one.**

`devkit create <dir> --profile monorepo` now emits the workspace itself: a pnpm
workspace file with a catalog and `engineStrict`, the exact Node pin beside the
band an install may proceed in, the root Vite+ lint and format config, a Biome
config, and a tsconfig roster with the generator wired to it. On that path, one
install leaves a tree that lints, formats, type-checks and tests, and the install
is what writes every tsconfig — none of them is written by hand.

**That last sentence is about `create` and only `create`.** The root manifest is
the one file this rung does not materialise, so `sync` and `init` never write the
task block, the dependencies or the engine pin into a repository that already
exists. What makes the tsconfigs appear is `prepare`, and `prepare` is part of
that manifest.

**Breaking, landing as a `minor` because this package is pre-1.0.** A repository
whose config says `"profile": "monorepo"` or `"profile": "full"` receives files
it did not receive before, and `sync` will place them on the next run. Set
`"profile": "repo"` to keep receiving exactly what you received before.

A tree that already holds a `vite.config.ts` or a `biome.jsonc` of its own sees
each reported as `conflict` and left alone, which is the end of it: nothing else
the rung places depends on either file. Acknowledge one with
`devkit doctor --accept <path> --reason "<why>"`, or move yours aside and let
`sync` place the seed.

**`pnpm-workspace.yaml` is not like that, and a conflict on it leaves the tree
broken rather than unchanged.** The rung places a `typescript-config` workspace,
under your `packages/` directory, whose dependencies resolve through `catalog:` —
against catalogs only that file declares. When your own workspace file is held
back, the workspace package is still written, so if your `packages:` globs cover
it your next install stops with:

```
ERR_PNPM_CATALOG_ENTRY_NOT_FOUND_FOR_SPEC
No catalog entry '@lcabrera/tsconfig' was found for catalog 'stack'.
```

Before installing again, do one of these:

- copy the `catalogs:` block out of the seed into your own
  `pnpm-workspace.yaml`. The seed is in the installed package, at
  `assets/workspace/pnpm-workspace.yaml`; `devkit doctor --verbose` lists the
  conflict so you can see which files this applies to.
- keep the workspace package out of your `packages:` globs, or delete it if you
  do not want the generated tsconfigs.
- stay on `"profile": "repo"`.

**Moving an existing repository up to this rung leaves it half-configured, and
nothing says so.** Flip `"profile": "repo"` to `"profile": "monorepo"` and run
`sync`: every file lands as `added`, `doctor --check` reports everything up to
date, and the install succeeds. There is no conflict here and no warning — that
is what makes this one worth reading twice. But your root manifest still has no
`prepare`, no task block and no `vite-plus`, so nothing runs the generator, and
the workspace the rung just placed carries a `typecheck` task pointing at a
`tsconfig.app.json` that was never written:

```
error TS5058: The specified path does not exist: 'tsconfig.app.json'.
```

The placed workspace's `test` task is broken for the same reason, and reports it
differently — it cannot resolve `@lcabrera/vite-config` or `vite-plus` from the
root `vite.config.ts`, because only the root manifest declares them.

`devkit init --upgrade` does not close this, and the reason is not that the
binaries are missing: with `vp` and `devkit` both installed it still adds only
`devkit:check` and `devkit:sync`. The workspace task block belongs to no rung of
the gate-task table at all, so no set of installed binaries reaches it. Run
`devkit create` into a scratch directory with this profile and copy the
`scripts`, `devDependencies`, `engines` and `packageManager` fields out of its
root `package.json` into yours, then install again; that one step fixes both
tasks.

Neither this nor the catalog case above is something the materialiser can express
yet. Every precondition it understands is a claim about your config or your
installed packages — never about another file in the same plan, and never about
the root manifest, which is not one of the files it places.

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
