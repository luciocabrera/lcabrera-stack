# create-lcabrera-stack

## 0.2.0

### Minor Changes

- a5a9e32: First release. `pnpm create lcabrera-stack <directory>` starts a repository on
  this toolchain without having to know the toolchain's package name first.

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
