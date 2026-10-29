# @lcabrera/repo-standards

## 0.10.0

### Minor Changes

- 73e7edb: `repo-verify-commands` now fails a `vp run` in a root `package.json` script or a workflow `run:` step that passes `--filter` (or `-F`) without `--fail-if-no-match`. Without that flag, a filter that matches no package warns and exits 0. The check reads only the options before the task name, because anything after it goes to the task. It runs only when `commands.run` names Vite+; other runners spell their filters differently. A repository with a bare filtered run will see this check fail after upgrading. Add the flag before the task name.

  `repo-test-changed`, `repo-run-changed`, `repo-merge-coverage` and `repo-coverage-report` now pass `--fail-if-no-match` whenever they filter. Each filter names a workspace read from the workspace graph or from `devkit.config.json`, so a filter that matches nothing means the graph or the config has drifted. None of these commands relies on an empty match passing. When a diff touches no workspace, the change-scoped runners start no filtered run at all. `repo-merge-coverage` now exits 1 on a roster entry that matches no package. `repo-coverage-report` stays best-effort and warns about that entry.

- f22a9c1: `repo-housekeeping-prune` now judges a dirty worktree by content. Its line in the plan counts the changed files whose content matches the default branch's history, the worktree's own history, or neither, plus its untracked files. With `--apply --include-superseded` it removes a dirty worktree only when none match neither and nothing is untracked; no flag removes one holding a change found in neither history. A dirty worktree on a branch whose pull request is open, or with no pull request data, is kept even when every change is in history. A change to a file's mode counts as matching neither history. An uncommitted deletion counts as matching only where that history once held the path and no longer does, and a detached worktree is removed as superseded only when a branch, tag or remote that this run does not delete contains its commit. Without the flag a dirty worktree is still only reported.

  A clean worktree detached on a commit the default branch contains is now removed, a locked worktree is kept, a worktree whose status, HEAD or history lookup cannot be read is kept and names the failed read, and a branch is deleted in the same run only when every worktree on it is removed as clean, so a kept or superseded worktree keeps its branch. `--apply` runs `git worktree prune` before deleting any branch, so a branch a stale entry still names is deleted as planned, and the dry run lists those stale entries under their own heading. The checkout the command runs from is never touched.

  The plan also lists containers labelled `devkit.throwaway`, whose value names the worktree that started them. `--apply` removes an exited, dead or created one, and one whose worktree is gone; a restarting, paused or removing one is kept, naming its state; a running one whose worktree is still there is listed under KEEPING with that reason. A running container whose worktree this plan removes is removed after it. The label is read whole, so a path holding a comma or an equals sign is matched as written, and a container whose label cannot be read is kept. Without Docker it lists none and says so; `REPO_STANDARDS_NO_DOCKER` set to any non-empty value turns the container checks off, and `REPO_STANDARDS_DOCKER` names the docker executable by absolute path. When no pull request list arrives on stdin, every worktree whose verdict needs one is listed as kept, with a note saying why.

  New `--hint [--threshold <n>] [--advice "<text>"]` mode: one line when more than `n` worktrees (ten by default) look removable from local refs alone. The line ends with the advice text; without `--advice` it names `gh pr list --state all --json number,headRefName,state --limit 400 | npx --no -- repo-housekeeping-prune`, which prints the full plan in a repository that installed this package. It reads no stdin, calls neither `gh` nor Docker, and removes nothing, so a session-start hook can run it.

- 9628270: `repo-verify-harness` reports a skill or subagent description that claims every task as a "Vague description" finding. The finding quotes the phrase that triggered it. The phrases it looks for are a quantifier over a generic noun ("any task", "every request", "all work", "any file") with no word introducing a scope after it (such as "in", "to", "for", "under", "about" or "that"), "anything else", "everything else", "at all" where it ends a clause (not "at all files"), "no matter what", and "whatever you" or "whatever the user". A quantifier over something specific still passes: "any code change", "any change to packages/ui", "any file under docs/", "any file that a workspace ships", "anything new". A noun joined to the next word by a hyphen or an apostrophe ("any file-scoped rule", "any file's frontmatter") modifies that word rather than heading the phrase, so it is not reported either. Before this change, a description that met the word floor, named a concrete token and used a trigger word was accepted even when it applied to every task.
- 926e832: `repo-verify-lint-plugins` now parses each workspace `vite.config.ts` to find a `fmt`, `lint` or `staged` key, instead of matching one at the start of a line. It reads every object the default export resolves to, however the export is written (`export default`, `export default function`, `export { config as default }`), and every object passed to `defineConfig`, including an aliased or namespace-qualified one. To find them it follows:

  - a call's callee and arguments, so `makeConfig({ fmt })`, `defineConfig(merge({ fmt }))` and an immediately invoked function are checked
  - every `return` of a function it reaches, sync or async, including one inside an `if`
  - both branches of a conditional, both sides of `??` and `||`, and the right side of `&&`
  - `satisfies`, `as`, `!` and `await` wrappers
  - spreads

  Identifiers are resolved with the TypeScript checker in whatever scope declares them, module or function body. The gate reads the initializer, every later `=` assignment and a function declaration's body. A shorthand property (`{ fmt }`), an inline object (`defineConfig({ fmt: f })`) a quoted key and a computed key whose value is the key's name all fail the gate, where before the shorthand and inline forms passed.

  These are still not flagged:

  - a key on a nested object, such as `test.fmt`
  - a key inside an object that a destructured binding was taken from, as in `const { base } = { base: { fmt } }` spread as `...base`. The binding is not traced back to that object, though its own name still counts as a shorthand key, so `const { fmt } = shared` passed as `{ fmt }` is flagged
  - a key added by mutating an object after it is built (`config.fmt = x`)
  - a default re-exported from another module
  - a computed key whose value is not a string literal type, such as one held in a `let`
  - anything reached only through an imported binding

  **Action needed:** a repository whose workspace config declared one of these keys in a form the line match missed now fails the gate. Move the block to the root config, then run `repo-verify-lint-plugins` again.

- 61bcb92: `repo-verify-lint-plugins` now also plants a `.tsx` component whose effect lists a prop it never reads, and fails unless Oxlint reports `react(exhaustive-effect-dependencies)` for it. No other Oxlint rule reports that case, so the gate proves this rule fires, not only that the `react` family loads. A repository whose root lint config turns `react/exhaustive-effect-dependencies` off now fails the gate until it turns it back on. Probe files are now named after their rule as well as their family, so two probes in one family write two files.
- 6751902: `repo-verify-lint-plugins` now plants a probe for every rule the root lint config turns on by name, at the top level and in each `overrides` entry, and fails unless Oxlint reports that rule in that probe's own file. A top-level rule's probe goes in the probe directory. An override rule's probe goes at a path one of the override's `files` globs matches, inside a directory the gate creates and removes. This proves an override rule live, which reading the config cannot: an override that names a rule without loading its plugin still loads, and the rule reports nothing.

  A rule set to anything other than `off`, `allow` or `0` with no probe fails the gate. Probes ship for the rules `@lcabrera/vite-config/lint` names, for `unicorn/no-array-sort`, and for `vitest/expect-expect`, `valid-expect`, `no-conditional-expect`, `no-standalone-expect` and `require-to-throw-message`. A rule id is matched to a probe the way Oxlint resolves it: `@typescript-eslint`, `react-hooks`, `import-x` and `jsx-a11y-x` count as `typescript`, `react`, `import` and `jsx-a11y`, and an id with no prefix, such as `no-console`, matches the `eslint` probe of that name, or another plugin's when `eslint` has none. A `files` glob with no `/`, such as `*.test.ts`, is placed as `**/*.test.ts`, since Oxlint matches it at any depth. When Oxlint refuses the config, as it does for a rule id it does not know, the gate prints Oxlint's message instead of a list of silent probes.

  **Action needed:** a repository whose root lint config names any other rule now fails the gate on it. Export `LINT_RULE_PROBES` from the root `vite.config.ts`: an array of `{ code, plugin, rule }`, with optional `ext` (`ts` by default) and `scope`, whose code that rule reports. An override whose every `files` glob uses braces, a character class, a partial directory wildcard, a `..` or absolute path, or a file name without exactly one `*` also fails, because the gate cannot place a probe there. Write one of its globs in a form the gate can fill, such as `**/*.test.ts` and `**/*.test.tsx` in place of `**/*.test.{ts,tsx}`.

- 0f18c43: `repo-verify-lint-plugins` now also plants a `.tsx` component whose effect reads a prop and passes an empty dependency array. It fails unless Oxlint reports `react-hooks(exhaustive-deps)` for it. The existing `react` probe proves only that the family loads. Once the `@lcabrera/vite-config` ESLint config turns its two copies of the rule off, Oxlint is the only engine that reports a missing hook dependency, so an upgrade or a root `rules` entry that silenced it would otherwise pass every gate. A repository whose root lint config turns `react-hooks/exhaustive-deps` off fails the gate until it turns it back on. A probe entry can now carry a `scope`, the diagnostic prefix Oxlint prints when it differs from the plugin family, and the success line counts distinct families rather than probes.
- 8372fc7: `repo-verify-react-doctor` now fails on the severity that `doctor.config.jsonc` names in `blocking`: `error` blocks errors, `warning` blocks errors and warnings, and an absent key falls back to the deprecated `failOn` and then to `error`, exactly as the CLI resolves it. Before this, the gate failed on errors whatever the key said, so a config that already sets `"blocking": "warning"` will now fail on warnings it used to pass. A config that sets `"blocking": "none"` now fails the gate, which refuses to run at a level that blocks nothing; use `--report` for an advisory run. An unknown `blocking` value also fails the gate instead of falling back; `--report` ignores `blocking` and still never fails on findings.

  The gate also fails, naming the file, when a `doctor.config.{ts,mts,cts,js,mjs,cjs,json}` sits beside an existing `doctor.config.jsonc`. React Doctor loads any of those in preference to the `.jsonc`, so the scan would otherwise run on rules the gate never read.

- d15e7a8: `repo-verify-lint-plugins` now fails when a workspace `vite.config.ts` declares `fmt` or `staged`, as it already did for `lint`. Vite+ applies a package's own `fmt` block when `vp fmt` runs from that package's directory, but `vp check` never does, so the same file could be formatted two ways depending on where the command ran. `vp staged` reads only the `vite.config.ts` in its working directory, so a package `staged` block replaces the root chain for a run started there. Each failure names its remedy: a `lint` rule goes in the root `lint.overrides`, a path `fmt` must skip goes in the root `fmt` `ignorePatterns`, and a staged command goes in the root `staged` chain. A repository whose workspace configs carry either block fails the gate until it moves them to the root config. The root `vite.config.ts` is still exempt.
- e8b3e35: `repo-verify-harness` reads the directories named in `gates.harness.additionalRoots` in `devkit.config.json`, as well as `.github/skills`, `.claude/rules` and `.claude/agents`. Each entry pairs a `kind` (`skill`, `rule` or `subagent`) with a `dir`, and the artifacts found there get the same frontmatter, reference and description checks. A copy of a harness kept for distribution can be held to the checks its original passes. If an entry names a directory that does not exist, that is reported as a finding. If an entry has an unknown `kind` or no `dir`, the config is refused and the error names the key. `checkConformance` and `collectArtifacts` accept the same list as an optional `additionalRoots` argument. When the argument is absent, `checkConformance` reads the list from the config, and `collectArtifacts` reads only the conventional roots. A repository that sets no key gets the same results as before.

### Patch Changes

- d757879: `repo-verify-docs-paths` now resolves every markdown link target that carries no URL scheme. A bare relative target with a non-markdown extension, such as a sibling `.json` file, used to pass when the file was missing, because only `./` and `../` targets, root-anchored targets and `.md` targets were resolved. Targets with any scheme (`https:`, `mailto:`, `tel:`) and in-page anchors are still skipped.
- e32cfb9: `repo-verify-docs-paths` now resolves the target of a reference-style link definition (`[label]: target`) the same way it resolves an inline link target, so a definition pointing at a missing file fails the gate. It reads the target past an optional title, inside angle brackets, on the line after the colon and inside a blockquote. It skips footnote definitions, lines indented as code, targets with a URL scheme and in-page anchors, and, like inline links, anything inside fenced code.
- 7d83218: When `repo-verify-eslint-pass` finds that a rule threw, its hint now covers both ways a plugin fails on TypeScript 7: the `isExternalModuleNameRelative` TypeError and typescript-eslint's "does not support TS 7.0" error. It says the ESLint toolchain needs TypeScript 6. It no longer names a `packageExtensions` entry in a `pnpm-workspace.yaml`, which an installing repository may not have.
- d021bbd: `runGitStatus`, the git runner in the `git-exec` module, now returns `stderr` beside `status` and `stdout`: what git wrote to its error stream, trimmed, and an empty string when the command succeeded or git could not be found. A caller can now say why a git command failed instead of only that it did. Callers that read only `status` and `stdout` see no change.
- 81fc330: `repo-verify-react-doctor` now blocks only the findings that `react-doctor --blocking <level>` would block. Before it checks severity, it applies the CLI's `ciFailure` surface filter, as the CLI does. By default that filter lets `design`-tagged findings and findings in test or story files through, and `surfaces.ciFailure` in `doctor.config.jsonc` promotes or excludes findings by rule (written `<plugin>/<rule>`, for example `react-doctor/no-array-index-as-key`), category, tag or file context. As in the CLI, a configured category outside `Accessibility`, `Bugs`, `Maintainability`, `Performance` and `Security` is ignored. Before this change, the gate blocked those findings even though the CLI would pass them. A config whose only blocking findings were of these kinds now passes. A finding whose `fileContext` is set to anything other than `test` or `story` fails the gate, which names the value, instead of being exempted. The report still lists every finding.
- c1faee8: Internal modules no longer export bindings that nothing outside their own file imports. No subpath named in any package's `exports` changes, and every published entry point keeps the same surface.

  - `@lcabrera/devkit`: the internal git runner that throws on failure is now `runGitOrThrow`, so its name says how it differs from `@lcabrera/repo-standards`' `runGit`, which returns `undefined` on failure. The peer-status constants, the profile-flag literal and two closure-artifact predicates are module-private.
  - `@lcabrera/repo-standards`: the finding formatters behind `repo-verify-conflict-markers` and `repo-verify-departed-names` are `formatConflictMarker` and `formatDepartedName`. Several module-level constants and helpers are module-private, and `conformance-triggers.cjs` no longer exports `MINIMUM_DESCRIPTION_WORDS`. That file is not one of the package's `exports` subpaths.
  - `@lcabrera/eslint-plugin`: `ruleDocsUrl` is private to `create-rule.ts`; rule documentation URLs are unchanged.
  - `@lcabrera/ui`: internal Table barrels stop re-exporting a selector, a fold utility and three types that every caller imports from the defining file, and the unused `DesignSystemStyle` type is gone. None of them was reachable from the package's public entry points.

- 907447a: The lint-report generator orders the eslint results with `toSorted()` and writes the sorted copy, instead of sorting the collected results array in place. The written report is unchanged.
- 52b5562: `repo-verify-viteplus-block` now explains a refilled Vite+ region differently. The upstream template's review checklist is content the agent document did not write, and it names a gate other than the one that document defines. The old message said `vp test` was forbidden. The gate still behaves the same way: it passes when the markers are absent or the region renders nothing, and it fails otherwise.

## 0.9.0

### Minor Changes

- b3da006: `repo-verify-eslint-pass` can now probe a root eslint pass. Set `gates.eslintPass.rootPassDir` to a directory outside every workspace that the root package's `lint:eslint:check` lints. The gate then plants its misordered import there, runs `vp run -r lint:eslint:check` from the root, and fails unless that run reports the import. That catches a root `lint:eslint:check` script that has been removed or renamed, and a root config that no longer loads the rule. Left absent or set to an empty string, the key leaves the root pass unprobed, as before.
- b03cca9: `repo-test-changed` now selects every root test suite from configuration. `gates.affectedTests.rootSuites` lists each test task that lives in no workspace, with the path patterns whose change can fail it, and a changed file matching one adds that task as its own group. A suite that reads root config can now be selected by a change to that config alone. Root suites are matched before `lintOnlyPatterns` drops a file, so a lint-only file a root suite reads still selects that suite. Left unset, the only root suite is `test:scripts` over the `.mjs`, `.cjs` and `.js` files under `scripts/`, which is the previous behaviour.

  Breaking, for code importing `@lcabrera/repo-standards/affected-tests`: `resolveAffected` and `resolveTestGroups` take a `rootSuites` argument and return `suites`, the selected task names, in place of the `scripts` flag; `renderSelectionMarkdown` takes `suites` in place of `scripts`; and `SCRIPTS_TEST_TASK` is removed. Pass `rootSuites` from `readGates(root).affectedTests` and read `suites` where you read `scripts`.

### Patch Changes

- cd29a22: `repo-eslint-staged` names a config at the repository root `.` in its summary. It used to print an empty bullet, because the root's path relative to itself is the empty string.
- 4bf2cc6: The coordination register checks (`repo-verify-claims` and the claim-close step), `repo-worktree-env` argument parsing and the conformance script-path check state their conditions positively. They report the same results for every input as before.

## 0.8.0

### Minor Changes

- 3a654d6: `repo-verify-harness` now fails a skill, path rule or subagent whose frontmatter does not parse as YAML, and names the file line the parser stopped at. Before this, its reader went line by line and accepted frontmatter that a YAML parser rejects. The common case is an unquoted `description` holding a colon followed by a space. Claude Code loads such a file anyway, so nothing showed the problem until a stricter harness read it.

  `parseFrontmatterContent` and `parseFrontmatter` from `./conformance-frontmatter` return one more field, `yamlError`: the parser's message, or `undefined` when the block parses. The package now depends on `yaml`.

  **Action needed:** quote any `description` (or other value) that contains `: `, then run `repo-verify-harness` again.

- 19e7fc5: `repo-test-changed` and `repo-run-changed` now fail when a `vp run` group they spawn is killed by a signal. Node reports that child's exit code as `null`, and the runner used to count it as exit 0, a pass.

  `parseCommitHeader` from `./commit-convention` now declares its parameter as an optional `string` instead of `any`. Its runtime behaviour is unchanged: a missing header, and a `null` one, still return `null`. A TypeScript caller that passed some other type now gets a type error.

## 0.7.0

### Minor Changes

- e4eced1: New bin: `repo-verify-conflict-markers`. It reads every tracked text file and
  exits 1 on a line that is a merge-conflict marker, printing the file and line of
  each one. It matches the markers git writes at the start of a line (seven `<`,
  `|` or `>` followed by a space or the line's end, and seven `=` alone) and the
  forms a Markdown formatter rewrites them into: a closing marker reprinted as
  seven nested block quotes, a marker folded into a table as its first cell, a
  marker indented inside a list item, and a separator escaped with a backslash.
  `git diff --check` and a search for the raw marker miss all of these, and the
  formatter usually runs before any gate does.

  Seven `=` alone is also a Markdown or reStructuredText heading underline. In a
  file that holds an opening, base or closing marker, every marker line is
  reported. Without one, a separator is reported unless it is shaped like a
  heading: below a text line and above a blank line or the end of the file, or an
  overline whose title has a matching underline. A separator left between the two
  sides of a resolved conflict sits between text lines, so it is reported. The
  backslash-escaped separator is reported on its own, since a formatter prints it
  only for a line that is not a heading.

  It reads nothing from `devkit.config.json`. It reads one file at a time and
  skips a file holding a NUL byte without decoding it. A test that needs a marker
  as content can build the string at runtime rather than commit it. It exits 1
  when a tracked file cannot be read (deleted locally, or left out of a sparse
  checkout), and when `git ls-files` lists nothing, so a run that did not read
  every tracked file does not pass.

## 0.6.0

### Minor Changes

- 49d794e: `repo-verify-commands` reads how this repository runs a task instead of assuming
  one toolchain. It takes the spelling from `commands.run` in `devkit.config.json`
  — the same key that answers the placeholder a materialised file carries — and
  holds your command reference to that spelling, so a repository documenting
  `npm run <task>` is no longer told that every task in the file is undocumented
  with a remedy it has already carried out. The key also decides where the task
  list comes from: a runner that runs manifest scripts and nothing else is read
  from the manifests, while a toolchain that resolves a task from more than them is
  asked for its list.

  The spelling is matched from its left edge, so a longer runner name ending in
  the configured one — `pnpm run` where the key says `npm run` — is not read as
  yours. Unanchored it was, which both accepted an undocumented task as documented
  and reported a documented command the file does not contain.

  Nothing changes for a repository that has not set the key: it defaults to the
  spelling this gate assumed before the key existed, and a failure now names the
  spelling to write in.

## 0.5.0

### Minor Changes

- ea0bcdf: `looksLikeAdr` is now `isAdrFilename`, on the `./adr-registry` subpath. It
  returns a boolean and now says so, which is what the repository asks of every
  other predicate. Update the import; nothing about the behaviour changed.
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

- 2db6a3b: `repo-eslint-staged` lints a list of files with the ESLint config that governs
  each one, and fixes what ESLint can fix. A monorepo keeps one flat config per
  workspace and none at the root, so a single `eslint` invocation has nothing to
  point at, and the ESLint pass ends up running only after a commit exists — in a
  pre-push gate or in CI, where a finding that would have fixed itself costs a
  round trip instead.

  Each path resolves to the nearest directory above it holding an
  `eslint.config.mjs`, and each group runs from that directory with that config.
  A path with no config above it is skipped rather than assigned to a config that
  is some other workspace's: a repository's root scripts and its docs sit outside
  every workspace. Paths ESLint does not lint are dropped too, so a staged-files
  runner can hand it a whole changeset without filtering first.

  A path the governing config itself ignores is left alone rather than failed.
  Naming an ignored file is a warning, and at `--max-warnings 0` a staged `dist/`
  or `build/` path would otherwise block a commit for being ignored — while a
  whole-tree `eslint .` never visits it at all.

  `--check` reports without writing. It exits 1 while findings remain, so it
  gates as well as fixes.

- c6d7b74: The tree-reading gates are bins now, alongside the commit, branch, pull request
  and register gates that were already here. `repo-verify-commands`,
  `repo-verify-deps-audit`, `repo-verify-departed-names`,
  `repo-verify-renamed-mentions`, `repo-verify-doc-registers`,
  `repo-verify-script-exits`, `repo-verify-eslint-pass`,
  `repo-verify-viteplus-block`, `repo-verify-inventory`,
  `repo-verify-lint-plugins`, `repo-verify-package-refs`,
  `repo-verify-react-doctor`, `repo-verify-route-artifacts`,
  `repo-verify-harness` and `repo-verify-review-threads` fail a build; the
  change-scoped runners `repo-test-changed` and `repo-run-changed`, the coverage
  pair `repo-merge-coverage` and `repo-coverage-report`, and the reports and
  tools `repo-lint-report`, `repo-usage-report`, `repo-product-distance`,
  `repo-docs-for-package`, `repo-pr-threads`, `repo-housekeeping-prune` and
  `repo-worktree-env` do the rest. Each finds the repository by walking up from
  its own location, the way the existing bins do, so it runs from an install as
  well as from a checkout.

  The repository facts these gates read are keys in `devkit.config.json` rather
  than constants: `registers.requirementsDir` and `registers.planningDir`, and
  under `gates` the blocks `commandsDoc`, `depsAudit`, `departedNames`,
  `inventory`, `coverage`, `eslintPass`, `affectedTests`, `lintReport`,
  `reactDoctor`, `usageReport` and `vitePlusBlock`. Every file-path key
  defaults to the conventional location and is validated as repo-relative. The
  workspace rosters (`coverage.mergeWorkspaces`, `coverage.reportWorkspaces`,
  `eslintPass.probeWorkspaces`, `inventory.trees`) default to nothing, and a gate
  handed an empty roster refuses to pass rather than passing over no workspaces.
  `affectedTests.globalPackages` joins them: it names the shared config packages
  whose change must force the full run, and an empty one is refused because a
  scoped run in their place leaves the dependents untested while still reporting a
  plausible subset. Its two neighbours are accepted empty on purpose —
  `affectedTests.lintOnlyPatterns` (regular-expression sources for the paths the
  linters already gate, whose absence only over-selects) and
  `affectedTests.coverageTaskPackage` (one workspace, whose absence means no task
  substitution).

  Two of the bins read their input rather than resolving it: under `--changed`,
  `repo-merge-coverage` and `repo-coverage-report` take the changed-file list on
  stdin, so a repository wiring either into a task feeds that list itself and gets
  a full run when it does not.

  The modules a repository's own scripts may need beside the bins are exported:
  `affected-tests`, `gh-exec`, `jsonc`, `merge-queue`, `public-package-dirs`,
  `review-gate-reconcile`, `review-gate-status`, `review-threads`,
  `route-artifacts`, and the `conformance-*` readers behind the harness gate.

- ea0bcdf: `./gh-exec` gains `parsePullRequests`. It turns the JSON `gh pr list` writes on
  stdout into an array. Output that is not JSON, or is JSON that is not an array,
  is unusable in the same way and takes the same path: the warning the caller
  passes goes to stderr and the result is an empty array. No output at all is an
  empty array and no warning — the command printed nothing, and there is nothing
  to say about it. Callers that previously parsed that output themselves no longer
  have to decide what an unusable response means.

### Patch Changes

- a5a9e32: `repo-coverage-report` no longer fails on a workspace whose suite covers no file
  of its own. Istanbul's json-summary writes `"pct": "Unknown"` — a string — for a
  total with nothing in it, and the report formatted every percentage with
  `toFixed`, so one such workspace ended the run after every other had already
  been measured.

  A metric is normalised as it is read now, and an empty total reads as complete —
  which is the rule the monorepo aggregate already applied to itself, so the
  per-workspace rows and the total no longer answer the same question two ways.

## 0.4.0

### Minor Changes

- d15da5e: Make `repo-adr --dry-run` report the decision it reached instead of printing the
  template it read.

  The dry run used to write the whole rendered record to stdout: the ADR template,
  with its instruction comment stripped and its heading filled in. The template is
  not the package's file. Its directory is `registers.adrTemplateHome`, which the
  installing repository sets, so a preview echoed the bytes of a file at a path
  chosen outside the package to the terminal and to whatever collects the
  terminal's output.

  It now prints one line — the path it would write, the number it took and the
  title you gave it:

  ```
  would write docs/decisions/ADR-107-a-decision.md as ADR-107 — A decision
  ```

  That is what the flag exists to confirm. The number and the home are the two
  things a new record gets wrong, and both are in the path; the body under them is
  a file you already have.

  The template is still rendered on this path, so a dry run against a template that
  has lost its `# ADR-NNN — …` heading still fails with the same message rather
  than passing and failing on the write.

  `scaffoldSummary` is new on the `./adr-scaffold` subpath, alongside `renderAdr`,
  for anyone building a different front end over the same scaffold.

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

### Patch Changes

- ad03a24: Make the published READMEs readable with only the installed package on disk.
  Every relative link that escaped the package directory is now the absolute URL
  the other READMEs already use, the two-package split states its reasoning
  instead of only citing the ADR that holds it, and the three references to files
  that travel in the repository but not in an install say so.
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

## 0.3.0

### Minor Changes

- 4f2e1ae: The ADR duplicate-number exemption is configuration, and defaults to none.

  `GRANDFATHERED_DUPLICATES` was a module constant holding `001`–`005` and `008` —
  one repository's historical overlap from when each of its ADR homes ran its own
  sequence from 001, baked into a shared package. It exempted five numbers that
  most consumers never duplicated, and a number the gate permits twice is a
  citation that can silently point at the wrong document.

  It is now `registers.adrGrandfatheredDuplicates`, alongside `adrHomes` and the
  rest, and it defaults to `[]` for the same reason `publicPackageDirs` does: an
  overlap is the host repository's own history and cannot be guessed.

  **Migration.** A repository whose homes genuinely reuse a number — it passed
  `vp run adr:verify` before and now fails with "ADR-0NN is used by 2 documents" —
  declares those numbers:

  ```json
  { "registers": { "adrGrandfatheredDuplicates": [5] } }
  ```

  Entries that are not positive integers are dropped. A repository with no overlap
  declares nothing and gets a stricter gate: numbers that were silently exempt are
  now checked like every other, and any new repeat is rejected.

- 0834cac: New `parseThreadId` export on `./cli-input`, alongside `parsePullNumber` and
  `parseRepository`. It accepts a GitHub GraphQL node id in either format still in
  circulation and refuses anything a spawned CLI would parse as a flag rather than
  a value — see ADR-089.

### Patch Changes

- 6293d32: `adrFindings` accepts the grandfathered-duplicate set as an option, defaulting to
  the configured register.

  Behaviour is unchanged for every caller: omit the option and it reads
  `registers.adrGrandfatheredDuplicates` exactly as before.

  The reason is coverage, not flexibility. The set is read from config and is empty
  by default, so in a repository that declares no overlaps the `> 2` branch of the
  duplicate check is unreachable from a test — deleting it left the whole suite
  green. It is not dead code: the register exists so a consuming repository can
  declare its own overlaps, which makes that branch live product behaviour. It is
  now driven from a synthetic set, and both cases — a grandfathered number passing
  twice, and failing on a third use — are asserted.

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

- eb13e5e: Two application-specific crosscutting commit scopes are no longer recognised.
  They named applications in one particular repository, which is not something a
  shared standard should carry. An unrecognised scope has always been a
  non-blocking hint rather than a failure, so no commit that passed before starts
  failing — either one now prints the same "not a known workspace or area" line
  any other unknown scope gets.

## 0.2.0

### Minor Changes

- 9b28dc6: The repository gates are now a published package, `@lcabrera/repo-standards`.

  They keep a repository's commits, branches, pull requests, issues, coordination
  register, architecture decisions and published packages to one enforced shape —
  and they ship as commands, so a repository runs them from its own hooks and CI
  without vendoring a script.

  ```bash
  npm install --save-dev @lcabrera/repo-standards
  npx repo-verify-commit .git/COMMIT_EDITMSG
  ```

  **Every repository fact these gates need is configuration, not a constant.**
  `devkit.config.json` supplies the default branch, the shared-branches directory,
  the ADR homes and the public-package roster; the package hardcodes none of them.
  A gate that told a repository to "retarget to `main`" when its default branch is
  named something else would be reporting a failure that is not one, so it reads
  the name instead. The file is shared with `@lcabrera/devkit` — it is the
  consumer's data, and two files invite drift between them — but each package
  reads only the block it owns.

  Like `@lcabrera/devkit`, this package ships `.mjs` and does not build: the
  `exports` map and the `bin` entries name the source files directly.
