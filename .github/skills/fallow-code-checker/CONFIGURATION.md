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
`bin`. `npx fallow list --entry-points` prints the resolved roster (no root
script wraps the `list` subcommand). `entry` in `.fallowrc.json` names only
what fallow cannot see:

- a script that a workflow, a Claude hook (`.claude/settings.json`) or a shell
  script under `scripts/` runs with `node`, one line per file;
- the `*.test.mjs` files under `scripts/` and `packages/*/scripts/`, as a
  pattern, because fallow's vitest detection lists a `.test.js` planted in
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

The verdict fails (exit 1) only for a rule at `error` severity. A `warn` rule
yields verdict `warn` and exit 0, which is how a new unused export passed the
gate until `unused-exports`, `unused-types`, `unused-dependencies` and
`unused-dev-dependencies` were raised to `error` (#1095). New-only attribution
keeps the inherited ones from failing.

## What the pull-request gate covers, and the plant that proved it

Each row is a planted violation, observed, reverted and observed clean; the
commands and their output are in the pull request for #1095. Repeat a row when
the config or the fallow version moves. Run the audit as CI does:
`fallow audit --base origin/main --coverage reports/fallow/coverage/coverage-final.json --format json --quiet`.

| Analysis                  | Plant                                                                                                                                | Observed                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| unused export             | `export const probeUnused = 1;` appended to `scripts/lib/affected-tests.mjs` and `packages/repo-standards/scripts/config-values.mjs` | `fallow dead-code` reports both; audit `fail`, exit 1                                                                                    |
| unused file               | a new one-export module dropped into `scripts/lib/` and into `packages/repo-standards/scripts/`, imported by nothing                 | `unused_files` for both; audit `fail`                                                                                                    |
| unused dependency         | `probe-unused-dep` added to `devDependencies` in the root and `packages/repo-standards` manifests                                    | `unused_dev_dependencies`; audit `fail`. Pass `--no-cache` when probing a manifest: the incremental cache once missed the workspace edit |
| cycle                     | `affected-tests.mjs` and `ci-commands.mjs` import each other; same in `config-values.mjs` and `error-message.mjs`                    | `circular_dependencies` for both pairs; audit `fail`                                                                                     |
| duplication, source files | one identical block appended to the two source files above                                                                           | `fallow dupes` clone group; `duplication_introduced`; audit `fail`                                                                       |
| duplication, test files   | the same block appended to two `*.test.mjs` files                                                                                    | nothing, in any mode. See the next section                                                                                               |
| complexity                | a 22-branch function appended to the two source files above                                                                          | `fallow health` finding; audit `fail`. Under `scripts/**` `exceeded` is `both`, since only CRAP is relaxed there                         |
| coverage gap              | an untested cyclomatic-7 function in `packages/utils`, that workspace's `test:coverage` re-run and fed                               | `exceeded: crap`, `coverage_source: istanbul`; audit `fail`. Unfed, the estimate passes it; with a test that covers it, it passes        |

## Test files and duplication

Fallow's duplication corpus skips test files, and nothing switches that off.
An identical block planted in two `*.test.mjs` files, then in two `*.test.ts`
files, reports no clone group in `mild`, `weak` or `semantic` mode, nor at
`--min-lines 3 --min-tokens 20`; the same block in two source files reports
one. `DuplicatesConfig` has no key that includes them and `--production` only
narrows the corpus. That is why PR #1090 failed SonarCloud's
`new_duplicated_lines_density` on `scripts/verify-harness-conformance.test.mjs`
while `vp run fallow:audit` reported nothing: the duplicated `it()` blocks
were in a file fallow never tokenized.

Sonar counts test files and its quality gate is required on every pull
request, so it is the check for test-file duplication. Do not add a Sonar
exclusion to make the two agree; fallow is the one that cannot see.

## What stays on demand, and why

`fallow health --coverage-gaps` is static and advisory (exit 0). A "test root"
is what the vitest plugin discovered, so it lists `scripts/lib/affected-tests.mjs`
as a gap although `affected-tests.test.mjs` imports it. The gated form of a
coverage gap is the CRAP row above, which reads measured coverage.

`vp run fallow:dead-code`, `fallow:health` and `fallow:dupes` scan the whole
tree and exit 1 on the inherited findings the new-only gate attributes to the
base. Run them before a PR anyway: a change that makes an export in an
unchanged file unreachable is outside a changed-file audit's scope, and the
full scan is the only thing that sees it. The findings the unblinded scan
surfaces are listed in the pull request for #1095, not fixed there;
`vp run fallow:dead-code` prints the current set.

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

`vp run coverage:merge` (`scripts/merge-coverage.mjs`) runs `test:coverage` in
the **DB-free** workspaces only and merges their reports — the membership is
`COVERAGE_MERGE_WORKSPACES` in `scripts/lib/coverage-workspaces.mjs`, **not a
list here**, because a copy in prose is a copy nothing checks (this one had gone
two workspaces stale). That module also holds the PR comment's
`COVERAGE_REPORT_WORKSPACES`, so `test:scripts` can assert both — dropping a
public package from either lane fails the suite rather than quietly shrinking a
report.

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
