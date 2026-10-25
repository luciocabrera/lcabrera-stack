# Fallow configuration, output convention, and the coverage lane

Reference for the `fallow-code-checker` skill. Migrated out of AGENTS.md so it
loads on demand rather than in every session.

## Configuration

Fallow is configured once at the repo root (`.fallowrc.json`) and auto-detects
every pnpm workspace — **never add per-app fallow configs or dependencies.**
Scope any command's output with `-w`, e.g.
`vp run fallow:dead-code -w 'apps/showcase'`.

**Entry policy.** Fallow derives most entry points itself: every file a
`package.json` `scripts` block runs with `node` or `bash`, and every package's
`bin`. `vp run fallow:full list --entry-points` prints the resolved roster
(no `--` before `list`; fallow rejects it as an argument). `entry` in
`.fallowrc.json` names only what fallow cannot see:

- a script that a workflow, a Claude hook (`.claude/settings.json`) or a shell
  script under `scripts/` runs with `node`, one line per file;
- the `*.test.mjs` files under `scripts/`, `packages/*/scripts/` and
  `apps/*/scripts/`, as a pattern, because fallow's vitest detection lists a `.test.js` planted in
  `packages/utils/src` and not the `.test.mjs` planted beside it;
- the Vite config fragments in `config/` directories and the Lighthouse config,
  which a tool reads rather than imports.

Never a glob over a source tree. An entry file's exports are all marked used,
so `scripts/**/*.mjs` made every unused export under `scripts/` invisible and
removing it moved the repository from single digits of unused exports to
dozens (#1068, #1095). The CLI scripts stay entry points either way; what
changed is that the library modules beside them are read like any other code.

`scripts/lib/fallow-entries.test.mjs` keeps the hand-listed part honest from
disk. Every `node scripts/...` invocation in a workflow, the Claude hooks or a
root shell script must be a root `package.json` script (fallow sees it) or an
exact `entry`; every exact `entry` under `scripts/` must exist and be invoked
that way; every pattern must name test files or config fragments. Fallow does
not warn about an entry that matches nothing (probed with a path that does not
exist), so that test is the only thing that catches a stale line.

Caution: fallow's `*` glob **crosses `/`**, so a pattern like `apps/*/config/**`
also swallows `src/config/` files and silently masks real findings — keep
config-dir entries as explicit paths and verify with `vp run fallow:dead-code`
that the issue count doesn't drop unexpectedly after editing entries.

## Output convention

`reports/fallow/` is the **single canonical location** for every fallow artifact.
Scripts, skills, agents, docs, and developers all write to and read from it;
never invent another output path.

| Path                                              | Tracked?    | Contents                                                                            |
| ------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------- |
| `reports/fallow/baselines/`                       | **tracked** | Audit baselines — `fallow audit --gate new-only` scores against them                |
| `reports/fallow/*-latest.json`                    | gitignored  | Scan snapshots — run `vp run fallow:full` (or `fallow:dead-code`, …)                |
| `reports/fallow/complexity-threshold-analysis.md` | gitignored  | Human summary — run `vp run fallow:refresh-report`                                  |
| `reports/fallow/coverage/coverage-final.json`     | gitignored  | Merged Istanbul coverage fed to `fallow audit --coverage` (`vp run coverage:merge`) |
| `reports/fallow/runs/<timestamp>/`                | gitignored  | Per-run skill/agent artifacts (`fallow.raw.json`, `report.md`, `report.json`)       |

**Only the baselines are tracked, and the split is a rule, not a habit: a gate
compares against it → tracked; it reports what a tool found → produced on demand**
([ADR-049](../../../docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md)).
So there is no snapshot to read — run the command and read what it writes. A
committed findings snapshot is a measurement in git, accurate when written and
wrong from the next commit onward with nothing to say which; the Sonar one was
wrong across many merges. Same reasoning as the no-changing-numbers rule in
AGENTS.md §7, at file scale.

## The audit gate

The commands live in
[COMMANDS.md §4 → Fallow](../../../COMMANDS.md#fallow-static-analysis). Before a
PR, run `vp run fallow:audit --base main`.

CI runs `fallow audit --gate new-only` on every PR (`check-safe.yml`). It fails
only on newly-introduced findings; inherited ones are attributed to the base
snapshot fallow builds from `--base`. The tracked baselines in
`reports/fallow/baselines/` are a second filter, not the first: the dead-code
baseline records no findings and a clean tree still passes.

That base snapshot is a git worktree fallow keeps in the OS temp dir as
`fallow-audit-base-cache-<hash>-root-<hash>`, one per checkout, and reuses on
every later audit from the same checkout. It is a cache, not a leak, and this
repo leaves it alone (#1440): the next audit from any checkout reclaims entries
whose checkout no longer exists, and an entry idle longer than
`audit.cacheMaxAgeDays` (Fallow's default when unset). `fallow audit-cache
prune` applies that policy at once; `fallow audit-cache remove --root <path>`
drops one checkout's entry.

The verdict fails (exit 1) only for a rule at `error` severity. A `warn` rule
yields verdict `warn` and exit 0, which is how a new unused export passed the
gate until `unused-exports`, `unused-types`, `unused-dependencies` and
`unused-dev-dependencies` were raised to `error` (#1095). New-only attribution
keeps the inherited ones from failing. #1422 raised every further rule that
reported nothing across the tree and could be shown to fire. "Rules raised to
error by #1422" below lists them, and the ones it left alone.

A rule at `error` is still not a gate unless fallow counts its findings.
"Rules at error that fallow does not count" below says how to check that, and
which rules it applies to.

Dead code has a second, whole-tree gate: `vp run fallow:dead-code:verify` runs
`fallow dead-code` with no base and exits 1 on any error-severity dead-code
finding anywhere (#1419). It is what catches an export in an unchanged file
that a change made unreachable, which the audit's changed-file scope cannot
see. It holds only because the tree carries no such finding, so a new one fails
it whether or not the diff touched the file. `check:push`, `check:safe` and
the CI Fallow Audit job run it; the plant that proved it is in the table below.
It passes `--no-cache`: fallow's incremental cache keeps an import it recorded
as unresolved, so a scan run before `typegen:all` would otherwise fail the gate
on generated `+types` imports that now resolve (#1454).

A clone group has no entry in `rules`, so on its own an introduced one is
warn-severity: the audit counts it under `duplication_introduced`, gives
verdict `warn` and exits 0. `duplicates.threshold` is what makes it fail. The
audit measures the groups it attributes to the change against the whole
corpus's line count and ignores inherited ones (probed with a trivial edit to
a test file carrying nine of them: verdict `pass`), so the value has to sit
below one minimal group, `minLines` in two places, over the tree's line count.
`0.001` does; `0` means no limit. `vp run fallow:dupes` reads the same
threshold against the whole tree and exits 1 on the inherited groups; it is
on demand, and `fallow:report` already tolerates that exit.

## What the pull-request gate covers, and the plant that proved it

Each row is a planted violation, observed, reverted and observed clean; the
commands and their output are in the pull request for #1095. Repeat a row when
the config or the fallow version moves. Run the audit as CI does:
`fallow audit --base origin/main --coverage reports/fallow/coverage/coverage-final.json --format json --quiet`.

| Analysis                  | Plant                                                                                                                                                    | Observed                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| unused export             | `export const probeUnused = 1;` appended to `packages/repo-standards/scripts/affected-tests.mjs` and `packages/repo-standards/scripts/config-values.mjs` | `fallow dead-code` reports both; audit `fail`, exit 1                                                                                    |
| unused export, whole tree | `export const plantedUnused = 1;` appended to `packages/repo-standards/scripts/doc-registers.mjs`, no audit run (#1419)                                  | `vp run fallow:dead-code:verify` exit 1; reverted, exit 0                                                                                |
| unused file               | a new one-export module dropped into `scripts/lib/` and into `packages/repo-standards/scripts/`, imported by nothing                                     | `unused_files` for both; audit `fail`                                                                                                    |
| unused dependency         | `probe-unused-dep` added to `devDependencies` in the root and `packages/repo-standards` manifests                                                        | `unused_dev_dependencies`; audit `fail`. Pass `--no-cache` when probing a manifest: the incremental cache once missed the workspace edit |
| cycle                     | `affected-tests.mjs` and `ci-commands.mjs` import each other; same in `config-values.mjs` and `error-message.mjs`                                        | `circular_dependencies` for both pairs; audit `fail`                                                                                     |
| duplication, source files | one identical block appended to the two source files above                                                                                               | `fallow dupes` clone group; audit `fail`, exit 1 under `duplicates.threshold`, and `warn`, exit 0 without it                             |
| duplication, test files   | the same block appended to `packages/repo-standards/scripts/affected-tests.test.mjs` and `packages/repo-standards/scripts/config.test.mjs`               | nothing under `ignoreDefaults: true`; with it `false`, a `fallow dupes` clone group and audit `fail`, exit 1. See the next section       |
| complexity                | a 22-branch function appended to the two source files above                                                                                              | `fallow health` finding; audit `fail`. Under `scripts/**` `exceeded` is `both`, since only CRAP is relaxed there                         |
| coverage gap              | an untested cyclomatic-7 function in `packages/utils`, that workspace's `test:coverage` re-run and fed                                                   | `exceeded: crap`, `coverage_source: istanbul`; audit `fail`. Unfed, the estimate passes it; with a test that covers it, it passes        |

## Rules raised to error by #1422, and the plant that proved each

Each rule below reported nothing across the tree when it was raised. Each row
is a plant, run through the audit as CI runs it (the command above) once with
the rule at its previous severity and once at `error`, then reverted. The
commands and their output are in the pull request for #1422.

| Rule                           | Plant                                                                                                                                                                                | Exit before | Exit at `error` |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | --------------- |
| `stale-suppressions`           | `// fallow-ignore-next-line unused-export -- kept for the package entry` above `isObject` in `packages/utils/src/guards/is-object.util.ts`, an export the package entry keeps in use | 0           | 1               |
| `require-suppression-reason`   | `// fallow-ignore-next-line unused-export`, with no reason, above a new unused export appended to `apps/showcase/src/constants/app.constants.ts` (the rule was `off`)                | 0           | 1               |
| `deprecated-exports-in-use`    | a `@deprecated` export appended to `is-object.util.ts` and imported by `packages/utils/src/strings/empty-to-undefined.util.ts` (the rule was `off`)                                  | 0           | 1               |
| `unused-catalog-entries`       | `left-pad: ^1.3.0` added to the `backend` catalog in `pnpm-workspace.yaml`                                                                                                           | 0           | 1               |
| `empty-catalog-groups`         | `probe: {}` added under `catalogs` in `pnpm-workspace.yaml`                                                                                                                          | 0           | 1               |
| `unused-dependency-overrides`  | `left-pad: 1.3.0` added under `overrides` in `pnpm-workspace.yaml`                                                                                                                   | 0           | 1               |
| `test-only-dependencies`       | the root manifest's `jsdom` moved from `devDependencies` to `dependencies`; only test files import it                                                                                | 0           | 1               |
| `unused-optional-dependencies` | `probe-unused-optional` added to `optionalDependencies` in `packages/repo-standards/package.json`                                                                                    | 0           | 1               |
| `re-export-cycle`              | a barrel in `apps/showcase/src/constants/` that re-exports itself, imported by `app.constants.ts`                                                                                    | 0           | 1               |
| `package-cycle`                | a type-only relative import from `packages/utils/src` into `packages/ui/src`, which already imports `@lcabrera/utils`                                                                | 0           | 1               |

`test-only-dependencies` fired only on the root manifest. The same shape in a
workspace manifest (`@testing-library/react` in `apps/showcase`, a test-only
`isbot` in `packages/ui`, a test-only `zod` in `packages/server`) produced no
finding, so at `error` it guards the root `dependencies` and nothing else.

Six rules that also report nothing were left below `error`, because no plant
made them fail this repository's gate:

- `duplicate-prop-shape` — stays `warn`. Fallow 3.33.1 reports it at `error`
  but leaves it out of the exit gate: two components beside
  `PinAndHideActions` taking `ColumnPinningButtonProps`, with
  `ColumnPinningButton` a group of three, are listed with
  `effective_severity: "error"`, yet `error-severity-findings` observes none,
  the audit's verdict is `pass` and `fallow dead-code` exits 0. At `error` it
  would read as enforced when it is not. It moves to `error` once a fallow
  release enforces it
  ([#1457](https://github.com/luciocabrera/lcabrera-stack/issues/1457)). The
  tree carries none of its findings: Pin Left, Pin Right and Clear Pinning
  were folded into one `ColumnPinningButton`.
- `type-only-dependencies` — fallow computes it only under `--production`. A
  root dependency imported through `import type` alone is reported there and
  by neither the audit nor `fallow dead-code`, and this repository runs
  neither in production mode.
- `unused-component-props` — a destructured prop that the React component never
  reads produced no finding, as an arrow function or a function declaration,
  with a named props type or an inline one.
- `invalid-client-export`, `mixed-client-server-barrel`, `misplaced-directive` —
  fallow runs these only in a project that declares `next`. A `'use client'`
  placed after the imports produced no finding.

## Rules at error that fallow does not count

Fallow can list a finding at `effective_severity: "error"` and still exit 0.
Whether a rule's findings reach the exit gate is the `counts_in_total` field
of its entry in `node_modules/fallow/capabilities.json`, keyed by
`config_key`. Read it for every rule at `error` whenever the fallow version
moves: a `false` there means the rule's findings are not counted under the
rule's own name, and usually that they never fail the run. Fallow 3.33.1 had
it `false` for `prop-drilling`, which sat at `error` here without gating
anything (#1492).

```sh
node -e "for (const t of require('./node_modules/fallow/capabilities.json').issue_types) if (t.config_key && !t.counts_in_total) console.log(t.config_key)"
```

What #1492 found, and the plant behind each (commands and output are in its
pull request):

| Rule                         | Setting | Evidence                                                                                                                                                                                                                                                                                                   |
| ---------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prop-drilling`              | `error` | Counts since fallow 3.34.0. A prop forwarded unread through three components in a new folder under `apps/showcase/src/`, each with a different body, rendered from `App.tsx`: `vp run fallow:dead-code:verify` and the audit exit 1, reverted 0. Fallow 3.33.1 lists the same chain at `error` and exits 0 |
| `thin-wrapper`               | `warn`  | `counts_in_total: false`. A component whose body is only `<Child {...props} />`, as an arrow or a function declaration, produced no finding at all, so the rule neither fires nor gates here                                                                                                               |
| `require-suppression-reason` | `error` | `counts_in_total: false`, yet it gates: its findings have no counter of their own and land in `stale_suppressions`. With `stale-suppressions` at `warn` and this rule at `error`, a reasonless suppression exits 1 from `fallow dead-code` and the audit; with this rule at `warn`, 0                      |
| `duplicate-prop-shape`       | `warn`  | `counts_in_total: false`; see the bullet above                                                                                                                                                                                                                                                             |

So `counts_in_total: false` is a reason to plant, not a verdict: demote the rule
when the plant exits 0, and keep it when the plant fails the gate through
another counter.

Fallow 3.35.0 changed the audit's complexity verdict too. A finding
inherited from the base that grew is `worsened`, and by default it now gives
verdict `warn` and exit 0, where earlier versions failed it as introduced.
`.fallowrc.json` sets `audit.worsened: "error"` to keep the earlier gate: one
more branch in an inherited over-threshold function exits 1 with it and 0
without it. That probe ran with `healthBaseline` taken out of the config,
because a finding the health baseline already counts in its file is absorbed
by the baseline under either setting.

## Test files and duplication

Fallow's built-in duplication ignore list drops test files, and
`duplicates.ignoreDefaults: false` is the switch. The reference documents that
list as generated-output globs (`**/.next/**`, `**/out/**` and the like) and
says nothing about tests, so the exclusion was found by probe, not by
reading: an identical block in two `*.test.mjs` files reports no clone group
with the default and one with the switch off, while the clean tree reports the
same source-file groups either way. `.fallowrc.json` sets the switch off and
restates the documented globs under `duplicates.ignore`, so what is excluded
is written where it can be read. An earlier version of this section
said no key included test files; the fail→pass pair in the pull request for
#1095 is what corrected it.

With the switch off, the inherited test-file clone groups join the full scan
(`vp run fallow:dupes` prints them) and the new-only gate attributes them to
the base, so a clean tree still passes the audit.

The corpus now matches Sonar's. The sensitivity does not, and PR #1090 is the
measure. At `6fa3457b` Sonar failed `new_duplicated_lines_density` on
`scripts/verify-harness-conformance.test.mjs`; with the switch off, fallow
reports no group in that file at the configured `minTokens`, because the
repeated `it()` blocks there are shorter than that floor in tokens.
`fallow dupes --min-tokens 39` is the first setting that reports the pair, and
the group count it prints for the whole tree is what that setting would cost.
Lowering the floor to Sonar's sensitivity is a separate decision. Until it is
made, Sonar's gate is the check for short repeated blocks in any file, and it
stays required on every pull request; do not add a Sonar exclusion to make the
two agree.

## What stays on demand, and why

`fallow health --coverage-gaps` is static and advisory (exit 0). A "test root"
is what the vitest plugin discovered, so it lists `packages/repo-standards/scripts/affected-tests.mjs`
as a gap although `affected-tests.test.mjs` imports it. The gated form of a
coverage gap is the CRAP row above, which reads measured coverage.

`vp run fallow:health` and `fallow:dupes` scan the whole tree and exit 1 on
the inherited findings the new-only gate attributes to the base, so they stay
on demand. Dead code left that list in #1419, which cleared the inherited
findings and made the whole-tree scan the `fallow:dead-code:verify` gate above.

## Always feed the audit real coverage

Pass `--coverage reports/fallow/coverage/coverage-final.json` (produced by
`vp run coverage:merge`; the CI job does this for you).

Fallow scores CRAP as `cyclomatic² × (1 − coverage)³ + cyclomatic` against a
threshold of **30**, and with no coverage data it _estimates_ coverage from
whether a colocated test file merely exists (`none` → 0%, `partial` → 40%,
`high` → 85%). At an estimated 0%, **every function with cyclomatic ≥ 5 breaches
the threshold** — so an unfed audit reports trivially simple code
(`login.action.ts`, cyclomatic 5 / cognitive 2) as `critical`.

When triaging a complexity finding, read its **`exceeded`** field, not
`severity`: `crap` alone means "untested", while `all`/`cognitive` means
genuinely complex. `coverage_source: "mixed"` is expected — files with no tests
at all have nothing to measure and still fall back to the estimate.

## The coverage lane

`vp run coverage:merge` (`packages/repo-standards/scripts/merge-coverage.mjs`) runs `test:coverage` in
the **DB-free** workspaces only and merges their reports — the membership is
`gates.coverage.mergeWorkspaces` in `devkit.config.json`, **not a list here**,
because a copy in prose is a copy nothing checks (this one had gone two
workspaces stale). The PR comment's `gates.coverage.reportWorkspaces` sits
beside it, and `test:scripts` asserts both — dropping a public package from
either lane fails the suite rather than quietly shrinking a report.

On a pull request the task runs as `vp run coverage:merge -- --changed`, and
the changed-file list reaches it on **stdin** via `scripts/changed-files.sh`.
Invoked without that feed, `--changed` resolves no workspace, writes an empty
`coverage-final.json` and exits 0 — the audit then falls back to the estimate
this lane exists to replace, and reports CRAP breaches on simple code.

Coverage must never require Postgres: the first attempt at this lever was
reverted (2026-07-14) because it ran a workspace's real-Postgres `queries/*`
suites in CI, where `getPool()` → `readEnvConfig()` throws on the missing `DB_*`.
That is why a DB-bound workspace splits `test` (full, needs a DB) from
`test:unit` / `test:coverage` (DB-free subset).

**The whole coverage lane hangs off one declaration.** `@vitest/coverage-v8` is
an _optional peer_ of vitest, and pnpm installs an optional peer only while some
manifest declares it. The root manifest does, and that is what makes the provider
resolvable in the workspaces that declare nothing. It reads as an unused
dependency and is not — removing it takes every `--coverage` run down, and the
failure surfaces in the Fallow Audit's coverage step, a long way from its cause.
[ADR-047](../../../docs/decisions/ADR-047-declare-optional-peer-dependencies.md)
records the mechanism and the from-scratch-lockfile proof any such removal now
requires.
