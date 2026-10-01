# @lcabrera/devkit

## 0.6.0

### Minor Changes

- 5898a4f: `devkit create` with no `--profile` now places the `monorepo` rung instead of
  `agent`. A flagless run leaves a workspace with an application, its configs and
  its tasks, ready to install. The created `devkit.config.json` records
  `"profile": "monorepo"`, so a later `sync` or `doctor` without the flag keeps to
  that rung. `pnpm create lcabrera-stack` forwards to `devkit create` and gets the
  same default. Pass `--profile agent` for the previous tree.

  `devkit init` and `devkit sync` are unchanged: with no flag they use the
  `profile` in `devkit.config.json`, and `agent` when the config names none.

- 05b5e85: Adding a dependency with `vp add` no longer makes `devkit doctor --check` report
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

- d00a8d8: The hooks a created repository ships now run without a manual `git config`.
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

- 9af96cf: The `monorepo` rung's root manifest now has `dev`, `build` and `start` tasks. Each one hands off to the application workspace's task of the same name, so `vp run dev`, `vp run build` and `vp run start` work from the repository root. The shipped `COMMANDS.md` documents all three, which keeps `commands:verify` green. A repository already on the rung picks them up on its next sync, next to its own tasks. A root task of the same name that the repository already declares is reported and left alone.

### Patch Changes

- 5ca7b6a: A `monorepo`-rung tree now installs with no unmet peer. Its catalog pinned
  `@babel/preset-typescript` to a major newer than the `@babel/core` that
  `vite-plugin-babel`, which runs the preset, peers on. The install resolved one
  `@babel/core` for both, and `pnpm peers check` reported every Babel package
  under the preset. The catalog now pins the preset to the major that matches
  that core, and the web application's Vite config passes that major's options
  (`allExtensions` and `isTSX` in place of `ignoreExtensions`), so every file the
  Babel pass includes still parses as TSX.

  This needs a `@lcabrera/vite-config` whose peer range admits that preset major.
  The blueprint's range for that package picks the release up once it is
  published.

- 60e1d19: Every command in the `commands` map of a tree `devkit create` makes at the
  `monorepo` profile now runs in that tree. Under Vite+, `test` and `audit` stand
  for tasks: `test` runs `vp run test:all` and `audit` runs `vp run deps:audit`
  wherever the manifest holds that task after the run. Where it does not, `test`
  stays `vp run test` and `audit` is `vp pm audit --level moderate`, which
  any Vite+ repository can run.

  `deps:audit` is a new gate task at the `monorepo` profile:
  `vp pm audit --json | repo-verify-deps-audit`. It is wired only where the
  blueprint is, like `commands:verify`, and only where `repo-verify-deps-audit` is
  installed or declared. It fails on an advisory at `moderate` or above, and on a
  report that walked no dependencies, so an unreachable registry fails it.

  Previously the map named `vp run test` and `vp run deps:audit`, and a created
  tree defined neither task, so the check workflow, the dependency-audit workflow
  and the pre-push hook all failed.

  A tree created by an earlier version keeps the commands it has. `devkit init
--upgrade` wires `deps:audit`, which makes its `audit` command run, and prints
  `test: kept "vp run test" (would infer "vp run test:all")` so you can correct
  `test` by hand.

- 7e8d034: `devkit create` now declares the toolchain the created tree calls. The root
  manifest lists `@lcabrera/devkit` and `@lcabrera/repo-standards` at every rung,
  each as a floor with a bound below the next major. Every gate task the rung owns
  is wired in the same run, because the manifest declares its binary. After one install, the hooks, the workflows and the gate tasks
  find what they call, and `devkit init --upgrade` has nothing left to add.

  Previously the manifest declared neither package. The hooks and workflows
  failed on a missing binary, and the closing message sent you to
  `devkit init --upgrade`, where no `devkit` binary was installed to answer it.
  That message is gone.

  `devkit init` in an existing repository is unchanged: it still wires a gate task
  only when its binary is installed.

- 4867b22: `devkit create` now ends with the commands that start the new repository: `cd`
  into it, a plain install with the repository's package manager, and the `dev`
  task when the profile wires one. The install is not `commands.install`, which
  is the lockfile-bound CI form and fails in a repository that has no lockfile
  yet. A directory name that is not a plain path is named rather than printed as
  a `cd` command, because no single quoting is read literally by every shell. When
  the runner is Vite+, the summary says `vp` is installed once per machine and
  where to get it. It also says `devkit` is a dev dependency, not a global
  command, and names the `devkit:check` and `devkit:sync` tasks that run it.

  `devkit init --upgrade` no longer tells you to run `git config core.hooksPath`
  when git already runs the hooks from that directory, however the path is
  spelled (`./.githooks`, `.githooks/`, absolute, or through a symlink). It still says so when the key
  is unset or names another directory.

## 0.5.1

### Patch Changes

- 02f0092: `create` now pins `pnpm@12.6.0` in the root manifest it writes, the release the
  rest of the toolchain is verified against; it wrote a pnpm one major behind. The
  Node and pnpm pins it emits are now held to the toolchain's own by test, so a
  future refresh cannot leave either behind.
- 827c977: `@lcabrera/server` now declares `zod` at `^4.6.5`, and `@lcabrera/eslint-plugin`
  declares `@typescript-eslint/utils` at `^8.70.1`. `@lcabrera/devkit` pins Node
  26.10.0 in the `.node-version` it writes into a new repository, and the CI
  workflow it writes sets up Vite+ with `voidzero-dev/setup-vp` at the v1.21.1
  commit.

## 0.5.0

### Minor Changes

- 49d794e: Reconcile the whole task block in a consumer's root manifest instead of writing
  it once. Every run now merges it key by key — the gate tasks and, from the
  `monorepo` profile up, the blueprint's — against the record of what this kit last
  wrote there: a task it wrote and you have not touched is updated in place, a task
  you changed is reported and kept as you have it, a task it no longer ships is
  removed, and one it has added since arrives, beside your own tasks, which it
  never touches. Wiring a task where the manifest holds none is still only `init`'s
  job for the gate tasks and `create`'s for the blueprint's, and a task whose
  binary is not installed is still never written into a manifest that lacks it. The
  record lives in a new `tasks` block in `.devkit-manifest.json`.

  A task the run left alone counts as divergence, so `doctor --check` fails on a
  block that has diverged. It reports what it counts either way; counting only the
  tasks a run would write would have made a check that names your changed task and
  then exits zero.

  The shipped `COMMANDS.md` now documents every task the kit wires, and
  `commands:verify` is wired from the `monorepo` profile up so a consumer's own gate
  holds the two together.

  **Configure `commands.run`** — the prefix your repository runs a task by, such as
  `npm run`. It is new, the shipped command reference carries a placeholder for it,
  and a file whose placeholders cannot all be answered is not written: without the
  key `COMMANDS.md` is reported as `unresolved` rather than materialised. `devkit
init --upgrade` adds it and keeps everything else you set — and `sync` and
  `doctor --check` now say so themselves, instead of sending you to the one command
  that cannot write a config key.

- c0fc143: The workspace rung now emits a running application, not an empty directory
  where one should be.

  `create --profile monorepo` places a React Router application in framework mode
  — root, a page route, an action route, error boundaries, entry files and route
  config — whose page renders a table from rows the module holds. There is nothing
  behind that page to ask for a second one, so the set is sized to the one page
  the loader reads and the row count the table reports is the row count it can
  show. It has no server, no database and no fetch, so the rung it belongs to is
  falsifiable on its own: the tree it produces builds, serves a page, and passes
  its own typecheck, test, lint and format tasks.

  Every column that page declares turns sorting and filtering off. Both are
  resolved by whatever answers the read rather than in the browser, and a page
  assembled from a module answers the same rows to every request — so a header
  offering a sort would take a click and change nothing. The grid offers what this
  rung can answer instead: pinning, hiding, column widths, column order, the
  settings panel and the theme. Deleting the two flags from a column is what turns
  them back on, and it belongs with a loader that reads a page it can sort.

  The action route answers the fixed path the component library submits a grid's
  persisted state to — a sort, a column width, a pin, a global preference, the
  theme — and the page route exports the library's revalidation predicate beside
  its loader. Without that route the application still builds and serves, and the
  first pin or column resize then submits to a path the router cannot match: the
  not-found lands on the page and its error boundary takes the place of the
  table.

  Every stack package the application names is declared as a semver range resolved
  from the registry, and the packed tarball gate now fails any produced file
  carrying a `workspace:` specifier — one of those resolves a directory of the
  workspace it was written in, so it installs where it was authored and nowhere
  else. The ranges are written as a floor bounded at the next major rather than as
  a caret, because below 1.0.0 a caret admits no minor above the one it names: a
  release would fall outside the range on the day it shipped, with every gate
  still green.

  Three settings in the emitted Vite config follow from the component library
  publishing TypeScript source rather than a build, and none of them is optional.
  StyleX is given an alias resolved from the installed package so it can see the
  library's own files, the client bundler is told not to pre-bundle them past that
  plugin, and the server build is told not to externalise them — Node refuses to
  strip types under `node_modules`, so that last one fails when the server starts
  rather than when it builds.

### Patch Changes

- 01100d3: `@lcabrera/server` now declares `zod` at `^4.6.1`; a consumer installing it
  resolves that release or later. `@lcabrera/devkit` pins Node 26.8.2 in the
  `.node-version` it writes into a new repository, and derives the install band
  from that pin.
- 95817db: The workspace the monorepo profile places now catalogs `@lcabrera/vite-config`
  and `@lcabrera/tsconfig` as `>=<current> <1.0.0` rather than a caret. Below
  1.0.0 a caret range ends at the next minor, so a repository created after either
  package released one resolved the version before it — an install that succeeded
  and quietly left the release behind. A repository created now resolves what is
  current on the day it is created, and keeps doing so as those packages release.

## 0.4.0

### Minor Changes

- fce7e03: Both packages now declare `engines.node`. A bin is executed by your Node
  straight out of `node_modules/.bin`, with none of this toolchain in front of it,
  so the runtime it was written for is something your installer can act on instead
  of something you find out from a syntax error on the first run. The floor is a
  floor and not a band: no upper bound, so the next Node major will not refuse an
  install nobody has looked at.

  The size ceiling follows the file rather than the extension, and so does the
  mid-stream-exit gate. `repo-verify-script-size`
  measured `.mjs` and `.cjs` alone, which meant a tooling script left the ceiling
  by being renamed and nothing reported it — a gate reading fewer files passes
  exactly like a clean tree. It now also measures a `.js`, `.ts`, `.mts` or `.cts`
  under a `scripts/` directory. `repo-verify-script-exits` had the same narrow
  selection and now shares the one predicate, so the two select the same
  extensions. They still keep separate directory skip lists, and only the size gate
  reads `gates.scriptSize.skipDirs`. Expect a finding on a repository that keeps an oversized script
  there under one of those extensions, or one that calls `process.exit()`; nothing
  else changes about what either gate decides.

  `files` in both packages excludes a colocated test by name rather than by
  extension, so a test beside a script never reaches your install regardless of
  what it is written in. `repo-standards` does the same for its fixture modules.

- b0320db: `closure` now reads the shipped files that are not markdown. A workflow's
  actions, its step scripts and its secret expressions; the executables any shipped
  file invokes out of the install's bin directory; and the paths a definition in
  your `paths.agents` directory names in its frontmatter or its plain prose are all
  resolved against what the package places.

  Until now a file with no markdown structure had nothing for `closure` to read, so
  it reported the same clean pass as a file that was genuinely self-contained.
  Expect new findings on a tree that has such files: a step running a script the
  install does not carry, a local action that does not travel, an executable no
  gate task places, and a secret only a repository's own settings could supply. A
  secret that something after its own `||` answers is not one of them, and neither
  is the token the platform sets itself.

  Two new escape kinds appear in the report, `bin` and `secret`, alongside `link`,
  `command`, `import` and `requires`. Reading a workflow file is unconditional, and
  that is the release. The two new `analyseClosure` options widen what else it can
  answer, and each is inert when omitted: `allowedBins` is the roster of
  executables the install places, and without it no invocation is resolved;
  `agentDirectory` names the directory whose definitions are read as prose, and
  without it none is.

- a5a9e32: `devkit create <directory> [--profile <name>]` makes a repository that does not
  exist yet. It creates the directory, runs `git init` on the trunk branch the
  shipped gates expect, writes a minimal manifest, materialises the selected
  profile through the same plan `sync` and `doctor` read, and leaves an initial
  commit.

  `init` is unchanged, including both of its refusals. `create` mirrors them from
  the other side: it refuses a target that is not empty, a target nested inside an
  existing git repository, and a profile that is not on the ladder — each naming
  what to run instead.

  No gate task is wired by a `create` run, because nothing is installed in a
  repository made a second ago. Install, then run `devkit init --upgrade` there to
  add the tasks whose binaries have arrived.

- ac9ef21: **The `monorepo` rung places a workspace, not a description of one.**

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

  A tree that already holds a `pnpm-workspace.yaml`, a `vite.config.ts` or a
  `biome.jsonc` of its own sees each reported as `conflict` and left alone, and
  that is the end of it: nothing the rung places stops working because your file
  was kept. Acknowledge one with
  `devkit doctor --accept <path> --reason "<why>"`, or move yours aside and let
  `sync` place the seed. The `typescript-config` workspace the rung writes under
  your `packages/` directory pins its own dependencies outright rather than through
  `catalog:`, so it installs whether or not your workspace file declares the
  catalogs. The catalog is for the packages you author.

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

- 1510ddd: **Breaking, landing as a `minor` because this package is pre-1.0: the profile
  that placed the harness is now called `repo`, and `full` names a larger rung.**

  The profiles are a ladder of four rungs, each containing the one below it:
  `agent` (what an agent reads), `repo` (adds what CI and git run: the workflows,
  the hooks, the templates and `COMMANDS.md`), `monorepo` and `full`. `repo`
  places exactly what `full` placed before. `monorepo` and `full` are accepted,
  and in this version place what `repo` places; a run under either prints the
  line saying so, and the line goes away when the rung places a group of its own.

  A config with `"profile": "full"` still resolves, to the top rung, so nothing
  breaks and nothing different is materialised today. It will widen when the
  rungs above `repo` fill in. If the harness is what you wanted, set
  `"profile": "repo"`: that is the rename. No runtime notice singles the old name
  out beyond the placement line every rung above `repo` prints, because the name
  is still valid and its meaning is what changed.

  The `decisions` group, the ADR template and its home README, moves down to
  `agent`: a record template and the README describing its home are prose a
  directory holds, needing neither git nor a runner. A repository on `agent` that
  already holds its own copies of both sees them reported as `conflict` on the
  next `doctor`; acknowledge each with
  `devkit doctor --accept <path> --reason "<why>"`, or let `sync` place the seeds
  where the directory is empty.

  `PROFILE_LADDER`, `includesRung`, `rungPlacedAs` and `placementNotice` are new
  exports of `./config`; `PROFILES` now has four keys.

### Patch Changes

- 4744b8a: `create` writes the root manifest in the order the formatter sorts a manifest
  into, so the repository it leaves passes its own `format:check` before anything
  has been edited in it. The keys were previously written alphabetically, which
  made the first task a consumer runs fail on the file `create` had just written.

  The order cannot be delegated to the formatter — `create` runs before anything
  is installed in the target, so there is none there to call — and it is now
  stated in one place rather than emerging from object literals in two modules. A
  field with no place in it is refused rather than written somewhere.

## 0.3.0

### Minor Changes

- 9b58238: Make the ADR gate read the record rather than only its name.

  Every ADR now opens with a `---` block declaring `governs` — workspace directory
  names, or the single value `repository` when the decision constrains no one
  workspace — and `repo-verify-adrs` fails a record that omits it, names a
  workspace the roster does not answer to, or is missing `## Context`,
  `## Decision`, `## Consequences` or one of the two alternatives sections. A
  heading whose only content is a template prompt counts as missing. The gate does
  not judge what a section says, and its success line says so.

  `repo-verify-adrs --list --package <workspace>` prints the decisions governing
  one workspace, separated from the repository-wide ones it inherits.

  **Upgrading an existing decision home takes two commands, and the gate is red
  until you run them.** Every record already in the home predates the block, so on
  first run each one fails on `no metadata block` and on whichever sections it
  lacks. `repo-verify-adrs --adopt` writes the baseline once from exactly those
  failures, grandfathering them; `repo-verify-adrs --write` then regenerates the
  index. After that the gate is green, and only NEW records are held to the rules.
  `--adopt` refuses to overwrite a baseline that is already there, so running it
  blind either writes the first one or fails — it will not quietly replace yours.
  That is not a claim that nothing can grandfather afresh: deleting the file and
  adopting again is an ordinary thing to be able to do. What holds either way is
  the bound above.

  Records written before the block are grandfathered in that baseline rather than
  edited into shape. The gate guarantees one thing about it: the list
  may hold at most `maxEntries` entries, and every exemption beyond that count
  fails. A count rather than a number window, because a sequence has gaps and a
  record taking a retired number falls inside any window. `--write` only prunes,
  lowers the bound to what it kept, and refuses to rewrite a baseline that has
  already grown; it regenerates the indexes and then still fails on any record
  finding it cannot fix, so the command the gate names never reports a tree clean
  that a plain run rejects.

  It is not proof against an editor, and it exempts filenames rather than records:
  the list pins how many records escape the content rules, not which. A slot freed
  by classifying one record can be spent on another, and a record can be rewritten
  under a name already on the list without the list moving. Review the records'
  diffs alongside the register's. The path is `registers.adrContentBaseline`.

  `@lcabrera/devkit` ships the template carrying the block with generic
  placeholders, so a scaffolded record fails the gate until its author says what
  the decision governs.

### Patch Changes

- ad03a24: Make the published READMEs readable with only the installed package on disk.
  Every relative link that escaped the package directory is now the absolute URL
  the other READMEs already use, the two-package split states its reasoning
  instead of only citing the ADR that holds it, and the three references to files
  that travel in the repository but not in an install say so.
- 62bb601: Stop shipping documents a consumer cannot read, and gate the recurrence.

  `@lcabrera/ui`, `@lcabrera/server` and `@lcabrera/utils` shipped the whole
  markdown set beside their source — every `ARCHITECTURE.md`, the artifact
  inventory, the pattern guide. Those are written for a reader who has the
  repository cloned: in an install they are pages of relative links to a decisions
  directory that is not in the tarball, plus decision citations by bare number.
  `files` now carries `"!src/**/*.md"`, so the source arrives without them and the
  README states what a consumer needs, linking the rest by absolute URL.

  Every other published package carries the same negation for whichever directory
  it publishes its source from — `src`, or `scripts` for the two `.mjs` packages.
  It is inert in each of them today and changes nothing that ships, which a
  before/after comparison of every packed file list confirms. It is there
  because it is the only guard that makes a newly added `src/ARCHITECTURE.md`
  fail to ship outright, rather than merely be likely to trip the content gate on
  its way out. `@lcabrera/devkit`'s `assets` are the deliberate exception: that
  markdown is what the package exists to copy.

  `@lcabrera/repo-standards` adds `repo-verify-shipped-docs`, which packs each
  package named in `publishing.publicPackageDirs` and reads the markdown back out
  of the tarball — `files` decides its corpus, not the working tree, which is the
  only way to see a negated pattern at all. It reports a relative link that leaves
  the package, a link to a file the package does not ship, a path anchored at one
  of the author repository's own directories (`gates.shippedDocs.repoOnlyDirs`,
  defaulting to the conventional monorepo layout), and a decision cited with no
  absolute URL on the line. An empty package roster, and any package that ships no
  readable document, are refused rather than passed.

  The remaining published READMEs stop naming the repository's own tree in
  passing: the source directory each package lives in is now a link a reader can
  open.

- a26ff71: Remove the comments a declaration's name, signature and types already state,
  from every package source.

  Nothing about behaviour changes, but the removal is visible in an editor: a
  declaration's JSDoc is carried into the published `.d.mts`, so a tooltip that
  used to show a paragraph now shows the signature. What the paragraph said lives
  where it is dated — the ADR that owns the decision, or the pull request that
  made it — and the annotations a build reads (`@param`, `@returns` and the rest,
  in the JavaScript sources that ship them) are untouched, as are the one-line
  notes on a member of an exported type, which reach an installer and state what
  the member's own type cannot.

  Four declarations changed shape rather than only losing prose, because their
  only body was a comment and removing it left an empty block: `getApiBaseUrl`
  resolves a request URL through a helper instead of swallowing the parse in an
  empty `catch`, `parseVersionedPayload` and `collectPersistedStateSlices` return
  and `continue` explicitly, and the logger's no-op is an expression. Each behaves
  as it did. `collectPersistedStateSlices` also drops its `transformRaw`
  parameter, which every caller filled with the percent-decode
  `parseVersionedPayload` already performs.

  Two union member orders moved with them — `TableResponseError`'s arms and
  `AggregateItem`'s intersection — because the sort those rules apply reads the
  member's source text, and the text no longer carries a comment. A union is
  unordered to a consumer.

## 0.2.1

### Patch Changes

- 24d1643: The generated ADR index now says something true for the number of homes the
  repository actually declares.

  `adrHomes` defaults to **one**, and the index rendered a paragraph about "two of
  them" and "no two homes" regardless — not false, but vacuous, and it reads as
  though the reader has missed a second directory. The cross-home sentence is still
  rendered when several homes are declared, because that is where the invariant it
  states is load-bearing. A single-home index now carries the fact that is
  load-bearing there instead — and its limit: `nextFreeNumber` takes the highest
  number in use and adds one, so a gap is never filled and a retired number stays
  retired, **unless** the retired ADR was the highest, in which case the next one
  takes that number back. That exception is stated rather than glossed because the
  index is generated into repositories whose readers will act on it without
  re-deriving it (#974 is about closing the hole).

  `renderIndex` gains an optional `homeCount` option defaulting to the configured
  register, so every existing caller renders exactly as before.

  `@lcabrera/devkit`'s seeded `docs/decisions/README.md` is regenerated to match,
  so a freshly initialised repository's index does not fail its own `adr:verify` on
  the first run.

  The uniqueness sentence is also conditioned on `adrGrandfatheredDuplicates`. The
  duplicate check is home-agnostic, so a declared exemption lets one number name two
  ADRs inside a single home — a repository that declares one was being handed a
  generated page that contradicted its own directory.

- 6070e1f: The shipped `react-19` seed now teaches compiler-first memoization (not an
  absolute ban) and no inline `onClick={() =>`. It stays self-contained — project
  law is restated rather than linked — so a consumer repository gets no dead
  pointers.
- 0be6483: Shipped documentation names React Router rather than the major it is on.

  `@lcabrera/devkit`'s seeded `rules/routes-data.md`, `@lcabrera/ui`'s Form
  `ARCHITECTURE.md` and `INVENTORY.md`, and a `SelectField` comment all stated a
  major version as a present fact — as the shorthand `RR7` in most cases — and every
  one was a full major out of date, because the catalog has pinned the next one for
  some time.
  Nothing checks a version written into prose, which is why it went wrong quietly
  and why the wording is now the framework's name and its mode ("React Router
  framework mode"), which stays true across a major.

  A version still belongs in prose where it is a floor a reader must clear, such as
  the middleware reference's `requires v7.9.0+`; those are unchanged.

- 55211d7: Point `homepage`, `bugs` and `repository.url` at the repository's new name.

  The old URLs still resolve — GitHub redirects them — but only while the old name
  stays unregistered, and a published version's metadata can never be corrected in
  place. Every already-published version keeps the old URL permanently, so this is
  the first release whose links are right on their own.

  `@lcabrera/eslint-plugin` also changes what it prints into a consumer's lint
  output. ESLint shows `meta.docs.url` beside every finding, and none of the ten
  rules had a URL that resolved: eight emitted `https://example.com/rule/<name>`,
  the placeholder the first rule was scaffolded from, and two pointed at a
  `/rules/<name>` path this repository has never had. All ten now link to the
  rule's own section in the package README, which does exist, and they build that
  link from one shared factory instead of ten copies — the copies are what let
  eight of them drift.

## 0.2.0

### Minor Changes

- 0596ec7: The shipped CI workflows can now install on every runner, not just two of five.

  A shipped workflow starts on an empty runner, and the install step named
  whatever `init` inferred — which is right in your terminal and wrong there. On
  GitHub's `ubuntu24` image, after `actions/setup-node`, only `npm` and `yarn` are
  on PATH. `pnpm` and `bun` are not, and neither is `vp`, which is the sharper
  case: it is a project dependency, so installing it is the step that was about to
  run. Every workflow failed at that step with `exit 127`.

  Two changes fix it:

  - **Every workflow now enables corepack** before installing, which supplies the
    package manager `packageManager` pins, at that exact version. This is
    unconditional and harmless where Node already ships the manager.
  - **A new optional `ci.setup`** in `devkit.config.json` carries the extra steps a
    runner needs that corepack cannot supply. `init` fills it in for vite-plus and
    bun — pinned to a commit sha — and leaves it out for everyone else, so most
    repositories never see the key.

  The value is YAML lines, indented into place wherever a workflow carries
  `{{ci.setup}}`. An absent value resolves to no steps rather than to a missing
  key, so no file is ever held back for it — but a `ci.setup` that is present and
  is not an array of strings now fails when the config is read, naming the entry,
  rather than resolving to no steps and taking the hook out of every workflow.

  **If you already ran `init`,** the upgrade path is now one command:

  ```bash
  devkit init --upgrade && devkit sync
  ```

  `--upgrade` gets past the already-initialised refusal and adds only what is
  missing — here, the `ci` block your runner needs — while keeping every command
  you corrected and every block another package owns. It reports which of your
  values it left alone, printing what it would have inferred beside them — which is
  how a bumped action sha reaches a consumer who keeps their own `ci` block.

  Use `--upgrade`, not `--force`. `--force` also gets past the refusal, but it
  rewrites the config from the current inference: it would re-guess the commands
  this same command told you to check and correct.

- 9b28dc6: The agent-setup materialiser is now a published package, `@lcabrera/devkit`.

  It copies one repository's agent setup — skills, path rules, subagent
  definitions and the contracts they bind to — into another, and reports what has
  diverged since. `devkit init` turns an empty repository into a working one;
  `devkit sync` takes an upstream update without discarding a local edit;
  `devkit doctor` reports the difference.

  ```bash
  npm install --save-dev @lcabrera/devkit
  npx devkit init --profile agent
  ```

  Two properties are worth knowing before you install it.

  **It ships `.mjs` and does not build.** The `exports` map names the source files
  directly, because an `.mjs` file loads from `node_modules` as it is. There is no
  `dist`, and nothing to build before you can read what you installed.

  **`@lcabrera/repo-standards` is an optional peer.** A skill can declare a `peer:`
  range in its frontmatter; `sync` refuses to materialise that skill when the
  declared peer is absent or out of range, and reports it rather than writing a
  file whose instructions would not resolve. Skills with no such declaration
  materialise regardless, so the peer is only needed for the ones that name it.
