# create-lcabrera-stack

## 0.4.1

### Patch Changes

- Updated dependencies [6a48007]
- Updated dependencies [0ae748a]
- Updated dependencies [9ac517f]
  - @lcabrera/devkit@0.8.0

## 0.4.0

### Minor Changes

- ada2dc2: `pnpm create lcabrera-stack <directory>` now creates the `full` rung and installs it, then starts and seeds its local database when Docker is running, because it runs `devkit create` with the arguments it was given. `--no-install` and `--no-db` reach `devkit create` unchanged. The README shows the one command that lifts pnpm's minimum release age for both the create and the install it now runs.

### Patch Changes

- fc1738d: The README says why `pnpm create lcabrera-stack` runs the previous release for a day after one ships, and how to lift pnpm's minimum release age for the create and the first install.
- Updated dependencies [ada2dc2]
- Updated dependencies [fc1738d]
- Updated dependencies [72cc8c9]
- Updated dependencies [955f68d]
- Updated dependencies [b4d6b92]
  - @lcabrera/devkit@0.7.0

## 0.3.0

### Minor Changes

- 5898a4f: `devkit create` with no `--profile` now places the `monorepo` rung instead of
  `agent`. A flagless run leaves a workspace with an application, its configs and
  its tasks, ready to install. The created `devkit.config.json` records
  `"profile": "monorepo"`, so a later `sync` or `doctor` without the flag keeps to
  that rung. `pnpm create lcabrera-stack` forwards to `devkit create` and gets the
  same default. Pass `--profile agent` for the previous tree.

  `devkit init` and `devkit sync` are unchanged: with no flag they use the
  `profile` in `devkit.config.json`, and `agent` when the config names none.

### Patch Changes

- Updated dependencies [5ca7b6a]
- Updated dependencies [60e1d19]
- Updated dependencies [7e8d034]
- Updated dependencies [5898a4f]
- Updated dependencies [4867b22]
- Updated dependencies [05b5e85]
- Updated dependencies [d00a8d8]
- Updated dependencies [9af96cf]
  - @lcabrera/devkit@0.6.0

## 0.2.2

### Patch Changes

- Updated dependencies [02f0092]
- Updated dependencies [827c977]
  - @lcabrera/devkit@0.5.1

## 0.2.1

### Patch Changes

- Updated dependencies [49d794e]
- Updated dependencies [c0fc143]
- Updated dependencies [01100d3]
- Updated dependencies [95817db]
  - @lcabrera/devkit@0.5.0

## 0.2.0

### Minor Changes

- a5a9e32: `pnpm create lcabrera-stack <directory>` starts a repository on this toolchain
  without having to know the toolchain's package name first.

  It is a shim: it resolves `@lcabrera/devkit` and runs `devkit create` with the
  arguments it was given. It exports nothing, parses no argument and holds no
  default of its own, so every option and every refusal is that command's. Read
  its changelog for what a run does; this package's records only the wrapper.

- fce7e03: The initializer declares `engines.node`. It ships a bin, and a bin is handed to
  your Node straight out of `node_modules/.bin` with none of this toolchain in
  front of it, so the runtime it was written for is something your installer can
  act on instead of something you find out from a syntax error on the first run.
  The floor is a floor and not a band: no upper bound, so the next Node major will
  not refuse an install nobody has looked at.

  `files` excludes a colocated test by name rather than by extension, so a test
  beside the shim never reaches your install regardless of what it is written in.

### Patch Changes

- Updated dependencies [fce7e03]
- Updated dependencies [b0320db]
- Updated dependencies [4744b8a]
- Updated dependencies [a5a9e32]
- Updated dependencies [ac9ef21]
- Updated dependencies [1510ddd]
  - @lcabrera/devkit@0.4.0

## 0.1.0

Published by hand, to create the package on the registry. npm attaches a trusted
publisher to a package that already exists, so the first publish of one cannot
come from the workflow that publishes every release after it.

The shim is the same as 0.2.0's; only the version differs.
