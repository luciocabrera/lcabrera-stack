# Fallow configuration, output convention, and the coverage lane

Reference for the `fallow-code-checker` skill. Migrated out of AGENTS.md so it
loads on demand rather than in every session.

## Configuration

Fallow is configured once at the repo root (`.fallowrc.json`) and auto-detects
every pnpm workspace — **never add per-app fallow configs or dependencies.**
Scope any command's output with `-w`, e.g.
`vp run fallow:dead-code -w 'apps/react-router'`.

**Entry policy**: `entry` in `.fallowrc.json` is only for files invoked outside
the import graph (root/app scripts, skill runner scripts, vite config fragments
in `config/` dirs, CLIs run via `node`). Package/framework entry points are
auto-detected — do not enumerate workspaces.

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

Sole exception: CQMS UI-triggered scans run by `apps/scan-orchestrator` use their
own `.tmp/scan-orchestrator/<scan_id>/` workspace — their results land in the
CQMS database, not the filesystem.

## The audit gate

The commands live in
[COMMANDS.md §4 → Fallow](../../../COMMANDS.md#fallow-static-analysis). Before a
PR, run `vp run fallow:audit --base main`.

CI runs `fallow audit --gate new-only` on every PR (`check-safe.yml`) — it fails
only on newly-introduced dead code, complexity, or duplication; inherited debt is
covered by baselines in `reports/fallow/baselines/`.

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
reverted (2026-07-14) because it ran scan-ingestion's `queries/*` suites in CI,
where `getPool()` → `readEnvConfig()` throws on the missing `DB_*`. That is why
`@repo/scan-ingestion` splits `test` (full, needs a DB) from
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
