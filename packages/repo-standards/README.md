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

| Bin                                                    | Checks                                                                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `repo-verify-commit <file>`                            | a commit message against the Conventional Commit spec                                                       |
| `repo-verify-branch [name]`                            | a branch name against the same type vocabulary                                                              |
| `repo-verify-pr --title <t> --body-file <f>`           | a pull request's title and every required section                                                           |
| `repo-verify-issue --body-file <f>`                    | an issue body's required sections                                                                           |
| `repo-verify-claims`                                   | the coordination register's integrity, overlap and staleness                                                |
| `repo-verify-adrs`                                     | every ADR home, and every record's block and sections (`--adopt` once on an existing home)                  |
| `repo-verify-publish`                                  | the tarball each built package would publish, by packing it                                                 |
| `repo-verify-api-surface`                              | each published package's exported surface against a snapshot                                                |
| `repo-verify-types`                                    | that a built package's published types resolve for a consumer                                               |
| `repo-verify-shipped-docs`                             | that every document in the packed tarball reads with only that package on disk                              |
| `repo-audit-release`                                   | every version already on the registry, after the fact                                                       |
| `repo-plan-release`                                    | which packages have a version the registry does not have                                                    |
| `repo-adr "<title>"`                                   | — scaffolds an ADR in the home you name                                                                     |
| `repo-claim-board`                                     | — renders the live claims, including ones on other branches                                                 |
| `repo-close-claim --pr <n>`                            | — deletes the task file a merged pull request closes                                                        |
| `repo-verify-commands`                                 | the command document against what the runner lists, and its links and counts                                |
| `repo-verify-deps-audit --minimum <level>`             | the audit report on stdin against the allowance register, refusing one that walked nothing                  |
| `repo-verify-departed-names`                           | that nothing names a product or workspace on the departed roster                                            |
| `repo-verify-renamed-mentions [--base <ref>]`          | that no document names a file the diff renamed away                                                         |
| `repo-verify-doc-registers`                            | the requirement and planning registers' entries, pointers, cycles and `met` claims                          |
| `repo-verify-script-exits`                             | that no script calls `process.exit()`                                                                       |
| `repo-verify-eslint-pass`                              | that the eslint pass reports a planted violation, so a crashed rule cannot read as clean                    |
| `repo-verify-viteplus-block`                           | that the runner's managed region in the agent document renders nothing (`--write` repairs)                  |
| `repo-verify-inventory [--write]`                      | that every util export is named in its tree's inventory, with a baseline                                    |
| `repo-verify-lint-plugins`                             | that every configured lint plugin family reports a planted violation and every workspace is classified once |
| `repo-verify-package-refs`                             | that no published package's shipped text names an application directory                                     |
| `repo-verify-react-doctor [--report]`                  | React Doctor's error-severity findings, asserting the run completed                                         |
| `repo-verify-route-artifacts`                          | that a route folder's shared modules are named for an artifact the folder holds                             |
| `repo-verify-harness`                                  | every skill, path rule and subagent: frontmatter, resolving paths, a description that says when             |
| `repo-verify-review-threads --pr <n>`                  | — publishes how many review threads still hold a pull request, as a commit status                           |
| `repo-pr-threads [--pr <n>] [--resolve <id>]`          | — lists the unresolved review threads, or resolves one                                                      |
| `repo-test-changed`, `repo-run-changed <task>`         | — run a task only for the workspaces the diff on stdin touched, plus their dependents                       |
| `repo-merge-coverage`, `repo-coverage-report`          | — merge the coverage lanes into one report, and summarise them per workspace                                |
| `repo-lint-report`                                     | — writes the analysers' JSON reports on demand                                                              |
| `repo-usage-report`                                    | — reports how the harness is used, from stores that already retain it                                       |
| `repo-product-distance`, `repo-docs-for-package <dir>` | — read the requirement register: distance from intent, and the documents one workspace owes                 |
| `repo-housekeeping-prune [--apply]`                    | — deletes merged branches and clean worktrees, reporting anything that might be work                        |
| `repo-worktree-env`                                    | — links the primary checkout's gitignored env files into a linked worktree                                  |

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

## Configuration

`devkit.config.json` at the repository root, all of it optional:

```json
{
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
    "eslintPass": { "probeWorkspaces": ["packages/ui"] },
    "affectedTests": { "coverageTaskPackage": "" },
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
`eslintPass.probeWorkspaces` and `affectedTests.coverageTaskPackage` — default
to nothing, for the reason `publicPackageDirs` does: which workspaces a gate
visits is the repository's own data. `repo-verify-inventory`,
`repo-merge-coverage`, `repo-coverage-report` and `repo-verify-eslint-pass`
refuse an empty roster rather than passing over no workspaces, and an empty
`coverageTaskPackage` means no workspace runs a separate coverage task under
`repo-test-changed --ci`.

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
| `verify-suppressions.mjs` | Which of four analysers wrote a suppression, in which file format, and whether the public-package register argues for it. The register is one repository's, and publishing is a flag rather than a rung, so the gate reads it by path from the repository that owns it and imports `coverage-workspaces` and `jsonc` from here. |

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
