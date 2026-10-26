# @lcabrera/repo-standards

The gates that keep a repository's commits, branches, pull requests, issues,
coordination register, architecture decisions and published packages to one
enforced shape — as commands, so a repository that installs this package can run
them.

Published from
[`lcabrera-stack`](https://github.com/luciocabrera/lcabrera-stack),
which is also its first consumer
([ADR-081](https://github.com/luciocabrera/lcabrera-stack/blob/main/docs/decisions/ADR-081-ship-the-repo-setup-as-two-packages.md)).

## Why a package rather than scripts

The skills that describe how work gets done shell out to these gates. A consumer
who materialises `commit-and-pr` and has no `commit-convention.mjs` gets prose
whose first instruction names a file they do not have. This is the half that has
to be **resolved** from `node_modules` rather than copied — it is code, invoked
by name, and copying it would put it outside node's resolution graph where no
upgrade can reach it.

## Why the setup is two packages

The other half is `@lcabrera/devkit`, and the split is by **how a consumer gets
the file** rather than by topic. Prose is discovered by path — an agent reads a
directory — so it has to be copied into your tree, and a package sitting in
`node_modules` puts nothing where any agent looks. Code is the opposite, for the
reason above. Either mechanism applied to both halves gets one of them wrong.

Versioning separates them again. These gates carry machine contracts their
callers pin on, while skill prose changes constantly, so a single package would
make every wording fix a version bump for contract consumers and every contract
break a major for the package that ships a paragraph.

## Installing

```bash
npm install --save-dev @lcabrera/repo-standards
```

Every entry in the table below is a bin, so it is on the path once installed and
is invoked by name — from a task, from a git hook, from a workflow step. There is
nothing to import and nothing to copy.

It pairs with
[`@lcabrera/devkit`](https://www.npmjs.com/package/@lcabrera/devkit), which
materialises the prose that invokes these gates and, with `devkit init`, writes
the tasks that reach them. Neither needs the other to be useful: this package is
gates without the prose, and `devkit` alone is prose that names commands you
would supply yourself.

To install an unreleased change, or to see what a consumer actually receives,
install the packed tarball instead — and pack with **pnpm**, because
`publishConfig` and `catalog:` are pnpm rewrites and an `npm pack` tarball is not
the artifact a consumer receives:

```bash
pnpm pack --pack-destination /tmp/kit    # in this package's directory
npm install --save-dev /tmp/kit/*.tgz    # in the consumer
```

## Syncing and diverging

This package is **resolved**, not materialised — it is code, invoked by name, so
it stays in `node_modules` where an upgrade can reach it. That means there is
nothing here to diverge from: `npm update` is the whole story, and a local change
to a gate is a change to a file inside `node_modules` that the next install
discards.

Where a gate needs to behave differently for your repository, the answer is
`devkit.config.json` below rather than an edit. Divergence as a supported state
belongs to the half that gets copied into your tree — see
[`@lcabrera/devkit`](https://www.npmjs.com/package/@lcabrera/devkit), where a
materialised file you edit is left alone on every subsequent sync and reported
until you acknowledge it.

## Commands

| Bin                                                                 | Checks                                                                                                                                                            |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo-verify-commit <file>`                                         | a commit message against the Conventional Commit spec                                                                                                             |
| `repo-verify-branch [name]`                                         | a branch name against the same type vocabulary                                                                                                                    |
| `repo-verify-pr --title <t> --body-file <f>`                        | a pull request's title and every required section                                                                                                                 |
| `repo-verify-issue --body-file <f>`                                 | an issue body's required sections                                                                                                                                 |
| `repo-verify-claims`                                                | the coordination register's integrity, overlap and staleness                                                                                                      |
| `repo-verify-adrs`                                                  | every ADR home, and every record's block and sections (`--adopt` once on an existing home)                                                                        |
| `repo-verify-publish`                                               | the tarball each built package would publish, by packing it                                                                                                       |
| `repo-verify-api-surface`                                           | each published package's exported surface against a snapshot                                                                                                      |
| `repo-verify-types`                                                 | that a built package's published types resolve for a consumer                                                                                                     |
| `repo-verify-shipped-docs`                                          | that every document in the packed tarball reads with only that package on disk                                                                                    |
| `repo-audit-release`                                                | every version already on the registry, after the fact                                                                                                             |
| `repo-plan-release`                                                 | which packages have a version the registry does not have                                                                                                          |
| `repo-adr "<title>"`                                                | — scaffolds an ADR in the home you name                                                                                                                           |
| `repo-claim-board`                                                  | — renders the live claims, including ones on other branches                                                                                                       |
| `repo-close-claim --pr <n>`                                         | — deletes the task file a merged pull request closes                                                                                                              |
| `repo-verify-commands`                                              | the command document against what the runner lists, its links and counts, and that a filtered Vite+ run fails on no match                                         |
| `repo-verify-deps-audit --minimum <level>`                          | the audit report on stdin against the allowance register, refusing one that walked nothing                                                                        |
| `repo-verify-departed-names`                                        | that nothing names a product or workspace on the departed roster                                                                                                  |
| `repo-verify-renamed-mentions [--base <ref>]`                       | that no document names a file the diff renamed away                                                                                                               |
| `repo-verify-doc-registers`                                         | the requirement and planning registers' entries, pointers, cycles and `met` claims                                                                                |
| `repo-verify-script-exits`                                          | that no script calls `process.exit()`                                                                                                                             |
| `repo-verify-eslint-pass`                                           | that the eslint pass reports a planted violation, so a crashed rule cannot read as clean                                                                          |
| `repo-verify-viteplus-block`                                        | that the runner's managed region in the agent document renders nothing (`--write` repairs)                                                                        |
| `repo-verify-conflict-markers`                                      | that no tracked file carries a merge-conflict marker, raw or reshaped by a Markdown formatter                                                                     |
| `repo-verify-inventory [--write]`                                   | that every util export is named in its tree's inventory, with a baseline                                                                                          |
| `repo-verify-lint-plugins`                                          | that each plugin family and each rule the config turns on by name fire on a planted violation, each workspace is classified once, none sets `fmt`/`lint`/`staged` |
| `repo-verify-package-refs`                                          | that no published package's shipped text names an application directory                                                                                           |
| `repo-verify-react-doctor [--report]`                               | React Doctor's findings at the config's `blocking` severity, after the CLI's `ciFailure` filter (`none` refused), asserting the run completed                     |
| `repo-verify-route-artifacts`                                       | that a route folder's shared modules are named for an artifact the folder holds                                                                                   |
| `repo-verify-harness`                                               | every skill, path rule and subagent, in the conventional roots and any `gates.harness` adds: frontmatter, resolving paths, a description that says when           |
| `repo-verify-review-threads --pr <n>`                               | — publishes how many review threads still hold a pull request, as a commit status                                                                                 |
| `repo-pr-threads [--pr <n>] [--resolve <id>]`                       | — lists the unresolved review threads, or resolves one                                                                                                            |
| `repo-test-changed`, `repo-run-changed <task>`                      | — run a task only for the workspaces the diff on stdin touched, plus their dependents                                                                             |
| `repo-merge-coverage`, `repo-coverage-report`                       | — merge the coverage lanes into one report, and summarise them per workspace                                                                                      |
| `repo-lint-report`                                                  | — writes the analysers' JSON reports on demand                                                                                                                    |
| `repo-usage-report`                                                 | — reports how the harness is used, from stores that already retain it                                                                                             |
| `repo-product-distance`, `repo-docs-for-package <dir>`              | — read the requirement register: distance from intent, and the documents one workspace owes                                                                       |
| `repo-housekeeping-prune [--apply] [--include-superseded] [--hint]` | — deletes merged branches, clean worktrees and stale throwaway containers, reporting anything that might be work; see [Housekeeping](#housekeeping)               |
| `repo-worktree-env`                                                 | — links the primary checkout's gitignored env files into a linked worktree                                                                                        |
| `repo-eslint-staged [--check] [--] <file>…`                         | — lints the files named with the flat config that governs each, fixing unless `--check`                                                                           |

In the repository this is published from they are the root `vp run` tasks of the
same name — `commit:verify`, `pr:verify`, `coordination:verify`,
`publish:verify`, `api-surface:verify`, `attw:verify`, `release:audit`,
`release:plan` and the rest, and its
[COMMANDS.md](https://github.com/luciocabrera/lcabrera-stack/blob/main/COMMANDS.md)
is the authority on which is which.

The publishing gates answer different questions, and none substitutes for
another: `repo-verify-publish` packs the tarball and checks what is in it,
`repo-verify-types` asks whether the types in it resolve,
`repo-verify-shipped-docs` asks whether the documents in it still read once the
repository they were written in is gone, `repo-verify-api-surface` asks whether
the surface changed without a changeset, and `repo-audit-release` asks what is
already on the registry — the only one that can see a hand-publish, and the only
one that cannot prevent anything.

`repo-verify-lint-plugins` parses each workspace `vite.config.ts` and reads the
top-level keys of every object the default export resolves to (written
`export default`, `export default function` or `export { config as default }`),
and of every
object passed to `defineConfig`, including an aliased or namespace-qualified
one. To get there it follows:

- a call's arguments and its callee, so `makeConfig({ fmt })`,
  `defineConfig(merge({ fmt }))` and an immediately invoked function count
- every `return` of a function it reaches, sync or async, including one
  inside an `if`
- both branches of a conditional, both sides of `??` and `||`, and the right
  side of `&&`, so `...(ci && { fmt })` counts
- `satisfies`, `as`, `!` and `await` wrappers
- a spread of an object it can resolve

Every identifier is resolved with the TypeScript checker, in whatever scope it
is declared, the module or a config function's body. The checker supplies the
binding's initializer, every later `=` assignment to it (so a `let` or `var`
reassigned before use counts) and the body of a function declaration. A
`fmt`, `lint` or `staged` key fails the gate whether it is written `fmt: x`, as
the shorthand `fmt` (including `const { fmt } = shared` passed on as
`{ fmt }`), quoted, or computed. A computed key is read by its value, so
`{ [name]: x }` counts when `name` is a constant holding `'fmt'`, and not when
the variable is merely called `fmt`.

These are not flagged:

- A key on a nested object, such as `test.fmt`, which is not a root block.
- An object a nested function returns, unless that function's result is
  itself followed, as in `return helper()`.
- A key inside an object that a destructured binding was taken from, as in
  `const { base } = { base: { fmt } }` spread as `...base`. The binding is not
  traced back to that object, though its own name still counts as a shorthand
  key, so `const { fmt } = shared` passed as `{ fmt }` is flagged.
- A key added by mutating an object after it is built, as in
  `config.fmt = x`.
- A default re-exported from another module (`export { x as default } from`).
- A computed key whose value is not a string literal type, such as one held
  in a `let`.
- Anything reached only through an imported binding, whether spread, called
  or passed along. That object's keys live in another module, so a key reached
  only that way passes.

`repo-verify-lint-plugins` also reads `lintConfig` from the root
`vite.config.ts` and collects every rule it turns on by name: each `rules` key
not set to `off`, `allow` or `0`, at the top level and in each `overrides`
entry. Each needs a probe, matched the way Oxlint resolves the id. A
`<plugin>/<rule>` id matches a probe of that plugin, with Oxlint's aliases read
as the plugin they name: `@typescript-eslint` as `typescript`, `react-hooks` as
`react`, `import-x` as `import` and `jsx-a11y-x` as `jsx-a11y`. An id with no
prefix, such as `no-console`, matches the `eslint` probe of that name, or
another plugin's when `eslint` has none, as `no-array-sort` resolves to
`unicorn`. A rule with no probe fails the
gate, so a rule added to the config, or a rule id renamed in it, cannot pass
unproven. The package ships probes for the rules `@lcabrera/vite-config/lint`
names, and for `unicorn/no-array-sort` and the `vitest` assertion rules; the
`RULE_PROBES` export of `lint-plugins.mjs` is the list. For
any other rule, the root config exports `LINT_RULE_PROBES`, an array of
`{ code, plugin, rule }` with optional `ext` (`ts` by default) and `scope` (the
prefix Oxlint prints, when it differs from `plugin`). Each probe's code must be
something its rule reports.

A top-level rule's probe is written to the probe directory at the root. An
override rule's probe is written to a path one of that override's `files` globs
matches, inside a directory the gate creates and removes. The gate fills a `*`
or `**` directory segment with that directory and the one `*` in the file name
with the probe's name, and the name must end in the probe's extension. A glob
with no `/`, such as `*.test.ts`, matches at any depth, so it is read as
`**/*.test.ts`. A glob
with braces, a character class, a partial wildcard in a directory, a `..` or
absolute path, or a file name without exactly one `*` cannot be filled, and an override with no glob the
gate can fill fails it. The gate then fails unless Oxlint reports each probe's
rule in that probe's own file. That catches an override that names a rule
without loading its plugin, a later entry that turns the rule off for that
path, and an upgrade after which the rule no longer reports the planted case.
When Oxlint refuses the config outright, as it does for a rule id it does not
know, the gate prints Oxlint's message and fails.

## Housekeeping

`repo-housekeeping-prune` reads `gh pr list --state all --json number,headRefName,state`
on stdin and prints a plan. It changes nothing until `--apply`, which carries
out that plan in order: it removes the planned worktrees, runs
`git worktree prune` for entries whose directory is gone, and only then deletes
branches, so a branch a stale entry still names can be deleted. It never
touches the main checkout or the checkout it runs from.

- A local branch is deleted when its pull request merged or closed, or when it
  holds no commit the default branch lacks. One with unique commits and no pull
  request is reported.
- A clean worktree is removed when its branch's pull request merged or closed,
  or when it is detached on a commit the default branch contains. A branch
  is freed for deletion in the same run only when every worktree on it is
  removed this way. A worktree kept on it, or removed as superseded (below),
  keeps the branch, so `git branch -D` is never planned against a branch a
  worktree still holds, and content that matched only the branch's history is
  never left only in the reflog.
- A worktree whose status, HEAD or history lookup cannot be read is kept
  under every flag, and its line names the read that failed.
- A dirty worktree is reported with a count of its changed files whose content
  matches a blob in the default branch's history, in its own history (HEAD and
  upstream), or in neither, plus its untracked files. Content rather than
  ancestry, because a squash-merge leaves a branch's commits off the default
  branch. `--include-superseded` removes it only when "neither" and "untracked"
  are both zero. Nothing removes one with a change found in neither. A
  dirty worktree on a branch whose pull request is open, or with no pull
  request data, is kept even when every change is in history. A
  change to a file's mode, staged or not, matches neither history. An
  uncommitted deletion matches a history only when that history once held the
  path and its tip no longer does. A detached worktree is removed as superseded
  only when a branch, tag or remote-tracking ref contains its commit, and one
  this run does not delete, so its HEAD is never the only thing holding that
  commit.
- Containers labelled `devkit.throwaway` are listed; the label's value is the
  path of the worktree that started the container. `--apply` removes one that
  is exited, dead or created, and one in any state whose worktree is gone or
  is removed by the same plan (after that worktree). A running one whose
  worktree is still there is listed under KEEPING, and so is one that is
  restarting, paused or removing, naming its state. The label is read whole,
  through `docker ps --format` with `.Label`, so a path holding `,` or `=` is
  matched as written. A container whose label cannot be read is kept. Without
  Docker it lists none and says so. Docker is looked up in the fixed install directories, never on
  `PATH`; `REPO_STANDARDS_DOCKER` names the executable by absolute path
  instead. `REPO_STANDARDS_NO_DOCKER` set to any non-empty value, `0`
  included, turns the container checks off even where Docker is installed, so
  a run never reaches it.

With nothing on stdin, because `gh` is missing or cannot sign in, every
worktree whose verdict needs a pull request state is kept and listed, and a
`note:` line says why.

`--hint [--threshold <n>] [--advice "<text>"]` reads no stdin and calls neither
`gh` nor Docker. It
prints one line when more than `n` worktrees (ten by default) look removable
from local refs: clean and detached on a commit the default branch contains, or
clean on a branch whose upstream is gone after a pruning fetch. The line names
the count and ends with the advice. Without `--advice` the advice is the pipe
that prints the full plan in a repository that installed this package:
`gh pr list --state all --json number,headRefName,state --limit 400 | npx --no -- repo-housekeeping-prune`.
Pass `--advice` to point the reader somewhere else, such as a skill your
repository has. It removes nothing, so a session-start hook can run it. For
Claude Code:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/node_modules/.bin/repo-housekeeping-prune --hint --advice \"run the housekeeping plan before starting\""
          }
        ]
      }
    ]
  }
}
```

## Configuration

`devkit.config.json` at the repository root, all of it optional:

```json
{
  "commands": {
    "run": "npm run"
  },
  "conventions": {
    "defaultBranch": "main",
    "sharedBranchesDir": "docs/coordination/branches"
  },
  "registers": {
    "adrGrandfatheredDuplicates": [],
    "adrHomes": [
      { "dir": "docs/decisions", "tier": "repo", "title": "…", "blurb": "…" }
    ],
    "adrContentBaseline": "scripts/adr-content-baseline.json",
    "adrDraftDir": "docs/agents/planning/adr-drafts",
    "adrTemplateHome": "docs/decisions",
    "coordinationBoardDoc": "docs/coordination/BOARD.md",
    "coordinationTasksDir": "docs/coordination/tasks",
    "planningDir": "docs/agents/planning",
    "requirementsDir": "docs/product/requirements"
  },
  "publishing": {
    "publicPackageDirs": [],
    "packagesDir": "packages",
    "workspaceDirs": ["apps", "packages"],
    "apiSurfaceDir": "reports/api-surface",
    "releaseWorkflow": ".github/workflows/release.yml"
  }
}
```

`commands.run` is how this repository runs a task by name, and the materialiser
owns that block — one key, one home, since the same value answers the placeholder
a shipped file carries. `repo-verify-commands` reads it to know how a task is
spelled in your command reference, and to know where the list of tasks comes
from: a runner that runs manifest scripts and nothing else is read from the
manifests, while a toolchain that also resolves a config's own tasks is asked for
its list. It defaults to the spelling that gate assumed before the key existed,
so a repository that has never set it is read exactly as it was.

`adrContentBaseline` is where the ADR gate keeps the records it grandfathers.
It is held to the same containment rule as every other path here, and its default
sits beside the other two baselines this package writes rather than inside the
config, because it is a list of your filenames and a register of policy is not
where those belong.

**Adopting the gate on a home that already has records takes two commands, and
the gate is red until you run them.** Every existing record predates the metadata
block, so each one fails on first run:

```bash
npx repo-verify-adrs --adopt   # write the baseline once, from today's failures
npx repo-verify-adrs --write   # regenerate the index
```

`--adopt` refuses to overwrite a baseline that is already there, so running it
blind either writes the first one or fails; afterwards only NEW records are held
to the content rules. It is not a claim that nothing can grandfather afresh —
deleting the file and adopting again is an ordinary thing to be able to do, and
what holds either way is the bound: at most `maxEntries` records escape the
content rules. `--write` prunes the baseline as you classify records, and never
adds to it.

Each `publicPackageDirs` entry is a **directory name under `packagesDir`** —
`ui`, not `<packagesDir>/ui`. Spelling it the second way is a valid repo-relative
string, so it passes validation and fails at the read; the gate names the config
key and the rule rather than reporting an ENOENT for a directory that was never
meant to exist. The two spellings are not both accepted, because that would put
two names on one location, which is what every other key here refuses.

`adrGrandfatheredDuplicates` defaults to nothing for the same reason, one register
up. It lists the ADR numbers a repository already lets mean two things, because
two of its homes each started a sequence at 001, and that overlap is the
repository's own history — a default carrying any number would exempt one a
consumer never duplicated, and a number the gate permits twice is a citation that
can silently point at the wrong document. Declaring one licenses an existing pair;
it never licenses a new collision, because a third use of the same number is still
rejected.

`publicPackageDirs` is the exception that defaults to nothing useful: the roster
of packages under the API-surface ratchet is the repository's own data, and
guessing it would point the gate at directories a consumer does not have. Empty
is the honest default, and it is safe because `repo-verify-api-surface` and
`repo-verify-types` both **refuse** an empty roster rather than reporting a clean
pass over nothing — the same reason neither of them treats an unbuilt package as
a skip. Naming a package here is the second half of publishing it: the manifest
says it ships, and this puts its surface under the ratchet.

`workspaceDirs` is what the release commands scan for non-private manifests, and
it is the one key where configuring too little is the dangerous direction:
`changeset publish` walks every non-private workspace regardless of directory,
so a directory left out here under-reports what a release would publish.

The `gates` block carries the rosters the measuring gates would otherwise
hardcode:

```json
{
  "gates": {
    "scriptSize": {
      "ceiling": 350,
      "baselineFile": "scripts/script-size-baseline.json",
      "skipDirs": [],
      "guideDoc": ""
    },
    "strayConfigs": {
      "unreadNames": [],
      "unreadPrefixes": [],
      "skipDirs": [],
      "configuredIn": ""
    },
    "docsPaths": {
      "repoRoots": [],
      "ignoredDocs": [],
      "expectedAbsent": [],
      "expectedAbsentPrefixes": [],
      "onDemandReportDirs": [],
      "baselineFile": "scripts/docs-paths-baseline.json"
    },
    "shippedDocs": {
      "repoOnlyDirs": ["apps", "docs", "packages", "scripts"]
    },
    "commandsDoc": { "file": "COMMANDS.md" },
    "depsAudit": { "allowanceFile": "docs/agents/dependency-advisories.json" },
    "departedNames": { "rosterFile": "scripts/departed-names.json" },
    "inventory": {
      "baselineFile": "scripts/inventory-drift-baseline.json",
      "trees": [
        {
          "inventory": "packages/ui/src/INVENTORY.md",
          "root": "packages/ui/src"
        }
      ]
    },
    "coverage": {
      "mergedFile": "reports/fallow/coverage/coverage-final.json",
      "summaryFile": "coverage/monorepo-coverage-summary.json",
      "mergeWorkspaces": [{ "dir": "packages/ui", "name": "@scope/ui" }],
      "reportWorkspaces": [
        { "dir": "packages/ui", "name": "@scope/ui", "run": true }
      ]
    },
    "eslintPass": { "probeWorkspaces": ["packages/ui"], "rootPassDir": "" },
    "harness": {
      "additionalRoots": [{ "kind": "skill", "dir": "vendor/skills" }]
    },
    "affectedTests": {
      "coverageTaskPackage": "",
      "globalPackages": ["@scope/tsconfig", "@scope/vite-config"],
      "lintOnlyPatterns": ["(^|/)eslint\\.config\\.mjs$"],
      "rootSuites": [
        { "task": "test:scripts", "patterns": ["^scripts/", "^[^/]+$"] }
      ]
    },
    "lintReport": { "reportsDir": "reports" },
    "reactDoctor": { "reportFile": "reports/react-doctor/full-latest.json" },
    "usageReport": { "outDir": "reports/usage" },
    "vitePlusBlock": { "agentDoc": "AGENTS.md" }
  }
}
```

The blocks from `commandsDoc` down carry what the tree-reading gates read. Each
file-path key defaults to the conventional location shown and is held to the
same containment rule as every other path here. The workspace rosters —
`inventory.trees`, `coverage.mergeWorkspaces`, `coverage.reportWorkspaces`,
`eslintPass.probeWorkspaces` and `affectedTests.globalPackages` — default to
nothing, for the reason `publicPackageDirs` does: which workspaces a gate visits
is the repository's own data. `repo-verify-inventory`, `repo-merge-coverage`,
`repo-coverage-report`, `repo-verify-eslint-pass` and the change-scoped runners
refuse an empty roster rather than passing over no workspaces.

`eslintPass.rootPassDir` names a directory outside every workspace that the
root package's own `lint:eslint:check` lints. When it is set,
`repo-verify-eslint-pass` plants its probe under that directory and runs
`vp run -r lint:eslint:check` from the root, and fails unless the fan-out reports
the probe. That catches a root task that has left the fan-out as well as a root
config that no longer loads the rule. An empty string, the default, and an
absent key both mean the repository has no root pass to probe.

`harness.additionalRoots` names more directories of agent-facing artifacts for
`repo-verify-harness` to hold to the same checks as `.github/skills`,
`.claude/rules` and `.claude/agents`, which it always reads. Each entry is a
`kind` — `skill`, `rule` or `subagent` — and a `dir` laid out the way that
kind's conventional root is: a directory per skill holding its `SKILL.md`, or
flat markdown files. A copy of the harness kept for distribution belongs here,
since a broken copy is installed by whoever receives it while the original
stays green. An entry naming a directory that does not exist is a finding, not a
skip, and an entry with an unknown `kind` or no `dir` is refused by name. It
defaults to nothing.

Besides `globalPackages`, `affectedTests` carries keys that are not rosters of
workspaces to visit.
`globalPackages` names the shared config packages whose change must force the
full run instead of a scoped one — that is the refusing one, because scoping a
run that was due in full leaves the dependents untested and still reports a
plausible subset. `lintOnlyPatterns` holds regular-expression sources matched
against changed paths, and a file matching one is dropped before selection
because the linters gate it on every pull request anyway; an empty list only
ever over-selects, so it is accepted. An empty `coverageTaskPackage` means no
workspace runs a separate coverage task under `repo-test-changed --ci`, which is
likewise a valid answer rather than a refusal.

`rootSuites` lists the test tasks that live in no workspace, so no workspace
selection reaches them. Each entry names a root `task` and the `patterns`
(regular-expression sources, like `lintOnlyPatterns`) of every path whose change
can fail it, and `repo-test-changed` runs the task as its own group when a
changed file matches one, including a file `lintOnlyPatterns` drops, since the
linters passing says nothing about a suite that reads it. A suite that reads
root config belongs here with that config's path, or a change to the config
alone selects nothing and the suite first fails after the merge. Unset, the one root suite is `test:scripts` over
the `.mjs`, `.cjs` and `.js` files under `scripts/`; an empty list means none.

Four things about it are easy to get wrong.

`strayConfigs` has **no useful default**, for the same reason `publicPackageDirs`
does not: which config filenames are decoys is a per-toolchain answer, and
`.prettierrc` is a decoy in a repository formatted by something else and the live
policy in one formatted by Prettier. So an empty roster is **refused** rather than
passed — comparing every file against an empty list reports the same success as a
clean tree.

`docsPaths.repoRoots` empty means "derive them from the tree", not "check
nothing": the gate reads the top-level directories instead. Every other list in
that block is an exemption, so empty is the _strict_ end of the range and a
repository that configures nothing gets the gate at its most demanding.

`shippedDocs.repoOnlyDirs` runs the other way to every list above it. It is the
gate's **reach**, not an exemption: each entry names a directory whose name, seen
inside an installed document, is an instruction to open something the reader does
not have. So it defaults to the conventional monorepo layout rather than to
nothing, and declaring it empty falls back to that default instead of switching
the check off — a roster nobody wrote is the one state that must not read as a
clean pass. Put a directory in it when your repository has one and a consumer
would not; leave out anything a consumer's own tree plausibly holds, or the gate
will report a document for naming a path that is fine.

Every `skipDirs` **extends** the built-in list rather than replacing it. A
repository that declared its own and forgot `node_modules` would not get a
narrower gate; it would get one walking its whole dependency tree, which reads as
slowness rather than as misconfiguration.

The built-in list is deliberately the smallest defensible one — version control,
installed dependencies, build output — because the gates do **not** agree about
the rest, and a shared list is a silent way to narrow all of them at once. This
repository's two differ exactly where they should:

| Gate           | Also skips                               | Why                                                                                                                                                                                                                          |
| -------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scriptSize`   | `reports/`, `.react-router/`, `.claude/` | The first two are generated. `.claude/` is skipped because an isolation worktree placed under it is a whole second copy of the repository, so every script in it would be measured twice.                                    |
| `strayConfigs` | `.react-router/`                         | Generated. It **walks** `reports/` and `.claude/` on purpose: a config file no engine reads is exactly the sort of thing that turns up in a repo-authored agent directory, and skipping it would drop the coverage silently. |

That asymmetry is worth preserving whenever one of these gates is copied to
another: a gate reading fewer files reports the same clean pass as a clean tree,
so nothing will ever tell you the coverage was dropped.

Note which of these are **paths** and which are **match fragments**.
`baselineFile`, `expectedAbsent` and `onDemandReportDirs` are repo-relative paths
and are validated as such. `ignoredDocs`, `expectedAbsentPrefixes`, `unreadNames`,
`unreadPrefixes`, `repoRoots` and `skipDirs` are compared as substrings, prefixes
or bare names against paths already collected, so they are kept exactly as
written — nothing joins them onto a root, and canonicalising them would strip a
trailing slash that carries the meaning. `reports/` excludes a directory;
`reports` excludes every document whose _name_ contains the word.

Every path here is relative to the repository root and must stay inside it: an
absolute value or one that climbs out is refused by name rather than normalised,
because these gates write and delete — the ADR scaffolder writes a file, the
index and the board are overwritten, and the claim closer unlinks.

`adrHomes` defaults to **one** home, because that is all a repository is assumed
to have. A repository keeping a second — decisions internal to one app, say —
declares both, and the order it declares them in is the order they are reported.
The register is the only definition of a home: `ADR_HOMES` is read from it, and
the stray check derives its known directories from `ADR_HOMES`, so opening or
closing a home is a register edit rather than a gate change. This repository
declared two until its app-home ADRs were refiled against what they govern, and
closing that home was that entry plus the `adrGrandfatheredDuplicates` number
that existed only to tolerate the two homes colliding. The failure runs the
opposite way to what you might expect: a declared home is never reported
homeless, but an `ADR-NNN-*.md` in a directory you have **not** declared is
reported as a stray, naming every home you did declare.

Only these are repository data: a gate that says "retarget to `main`" tells a
repository with a differently-named default branch something false, and one that
names a register directory names a path a consumer may not have. Everything else
— the type vocabulary, the required sections, the grammar — is the standard
itself and travels unchanged.

The file is shared with `@lcabrera/devkit`, because it is the consumer's data and two
files would drift. The readers are separate: each package reads only the block it
owns, so neither depends on the other to answer a question about its own
behaviour.

## How this repository consumes it

Two ways, deliberately:

- **Through the package** — the root `commit:verify` / `branch:verify` /
  `pr:verify` / `issue:verify` tasks call the bins, so the resolution a consumer
  gets is exercised on every use.
- **By path** — the pull-request, issue, labeler, changelog, coordination-close
  and review-gate workflows do not install. They must be able to check a pull
  request whose install is broken, which is when a malformed message is most
  likely. Those, and the root scripts they run, reach the modules by path.

Every module reachable **by path** imports nothing but node builtins and its own
siblings, which is what makes the second form possible. Keep it that way: a
dependency added to one of those silently breaks the workflows that never run
`install` — including `release.yml`, which runs `release-publish-plan.mjs` with
plain `node` precisely to decide whether installing is worth it.

The package does have runtime dependencies — `@arethetypeswrong/core` and
`ts-morph` — and the boundary is what keeps that safe: only the three gates that
read build artifacts reach them (`repo-verify-publish`, `repo-verify-types`,
`repo-verify-api-surface`), plus `repo-verify-script-exits`, which parses every
script with `ts-morph`, and none of those is ever run before an install, because
a build or a full gate has already had to happen. Adding a dependency to anything
else here is the change to think twice about.

`declared-imports.test.mjs` enforces both halves — every bare import declared,
and a module a consumer runs restricted to `dependencies`. It exists because
neither is observable from inside this monorepo: Node resolves a bare specifier
by walking up from the module, so an undeclared import quietly finds the
repository root's `node_modules` and every gate passes. The same walk from
`node_modules/<name>/scripts/` reaches the consumer's tree instead, which under
pnpm carries nothing nobody declared. `ts-morph` sat undeclared exactly that way.

## What stays behind, and why

Not every gate belongs here. A gate travels when its **rule** is a property of
repositories and only its **names** are local — that is what configuration is
for. A gate stays when its whole subject is one repository's toolchain, because
parameterising it would mean shipping an abstraction over "which analysers you
run", and a consumer could not use the result without reproducing this
repository's exact setup.

| Gate                      | Why it stays                                                                                                                                                                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verify-suppressions.mjs` | Which of four analysers wrote a suppression, in which file format, and whether the public-package register argues for it. The register is one repository's, and publishing is a flag rather than a rung, so the gate reads it by path from the repository that owns it and imports `public-package-dirs` and `jsonc` from here. |

The analyser gates that read a runner and a config a consumer of the same
toolchain also has — `repo-verify-lint-plugins`, `repo-verify-eslint-pass`,
`repo-verify-react-doctor` — travel, on the rung that has workspaces or React
source to point them at; [devkit's classification table](https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/devkit/CLASSIFICATION.md)
places each one.

## The one thing to know before moving a file here

These gates find the repository by walking up from their own location, not by
counting directories. Counting worked while they lived at the repository root and
broke the moment they moved into a workspace — the guard that refuses to read a
file outside the repository began treating the package directory as the
repository and refused every legitimate path. See `host-root.mjs`.
