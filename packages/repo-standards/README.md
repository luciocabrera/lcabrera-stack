# @repo/repo-standards

The gates that keep a repository's commits, branches, pull requests, issues,
coordination register and published packages to one enforced shape — as
commands, so a repository that installs this package can run them.

Private while the first family is being proved here. It publishes as
`@lcabrera/repo-standards`
([ADR-081](../../docs/decisions/ADR-081-ship-the-repo-setup-as-two-packages.md)).

## Why a package rather than scripts

The skills that describe how work gets done shell out to these gates. A consumer
who materialises `commit-and-pr` and has no `commit-convention.mjs` gets prose
whose first instruction names a file they do not have. This is the half that has
to be **resolved** from `node_modules` rather than copied — it is code, invoked
by name, and copying it would put it outside node's resolution graph where no
upgrade can reach it.

## Commands

| Bin                                          | Checks                                                        |
| -------------------------------------------- | ------------------------------------------------------------- |
| `repo-verify-commit <file>`                  | a commit message against the Conventional Commit spec         |
| `repo-verify-branch [name]`                  | a branch name against the same type vocabulary                |
| `repo-verify-pr --title <t> --body-file <f>` | a pull request's title and every required section             |
| `repo-verify-issue --body-file <f>`          | an issue body's required sections                             |
| `repo-verify-claims`                         | the coordination register's integrity, overlap and staleness  |
| `repo-verify-adrs`                           | every ADR home, and regenerates the index                     |
| `repo-verify-publish`                        | the tarball each built package would publish, by packing it   |
| `repo-verify-api-surface`                    | each published package's exported surface against a snapshot  |
| `repo-verify-types`                          | that a built package's published types resolve for a consumer |
| `repo-audit-release`                         | every version already on the registry, after the fact         |
| `repo-plan-release`                          | which packages have a version the registry does not have      |
| `repo-adr "<title>"`                         | — scaffolds an ADR in the home you name                       |
| `repo-claim-board`                           | — renders the live claims, including ones on other branches   |
| `repo-close-claim --pr <n>`                  | — deletes the task file a merged pull request closes          |

In this repository they are the root `vp run` tasks of the same name —
`commit:verify`, `pr:verify`, `coordination:verify`, `publish:verify`,
`api-surface:verify`, `attw:verify`, `release:audit`, `release:plan` and the
rest. [COMMANDS.md](../../COMMANDS.md) is the authority on which is which.

The four publishing gates answer four different questions, and none substitutes
for another: `repo-verify-publish` packs the tarball and checks what is in it,
`repo-verify-types` asks whether the types in it resolve, `repo-verify-api-surface`
asks whether the surface changed without a changeset, and `repo-audit-release`
asks what is already on the registry — the only one of the four that can see a
hand-publish, and the only one that cannot prevent anything.

## Configuration

`devkit.config.json` at the repository root, all of it optional:

```json
{
  "conventions": {
    "defaultBranch": "main",
    "sharedBranchesDir": "docs/coordination/branches"
  },
  "registers": {
    "adrHomes": [
      { "dir": "docs/decisions", "tier": "repo", "title": "…", "blurb": "…" }
    ],
    "adrDraftDir": "docs/agents/planning/adr-drafts",
    "adrTemplateHome": "docs/decisions",
    "coordinationBoardDoc": "docs/coordination/BOARD.md",
    "coordinationTasksDir": "docs/coordination/tasks"
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

Every path here is relative to the repository root and must stay inside it: an
absolute value or one that climbs out is refused by name rather than normalised,
because these gates write and delete — the ADR scaffolder writes a file, the
index and the board are overwritten, and the claim closer unlinks.

`adrHomes` defaults to **one** home, because that is all a repository is assumed
to have. A repository keeping a second — decisions internal to one app, say —
declares both, and the order it declares them in is the order they are reported.
This repository declares two; drop the second from its `devkit.config.json` and
`vp run adr:verify` reports every ADR in the app home as homeless, which is the
check that the config is really driving the gate.

Only these are repository data: a gate that says "retarget to `main`" tells a
repository with a differently-named default branch something false, and one that
names a register directory names a path a consumer may not have. Everything else
— the type vocabulary, the required sections, the grammar — is the standard
itself and travels unchanged.

The file is shared with `@repo/devkit`, because it is the consumer's data and two
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

The package does have one runtime dependency, `@arethetypeswrong/core`, and the
boundary is what keeps that safe: only `repo-verify-publish` and
`repo-verify-types` reach it, and neither is ever run before an install — they
check build artifacts, so a build has already happened. Adding a dependency to
anything else here is the change to think twice about.

## The one thing to know before moving a file here

These gates find the repository by walking up from their own location, not by
counting directories. Counting worked while they lived at the repository root and
broke the moment they moved into a workspace — the guard that refuses to read a
file outside the repository began treating the package directory as the
repository and refused every legitimate path. See `host-root.mjs`.
