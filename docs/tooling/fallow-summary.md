# Fallow — Summary

> Sources: <https://fallow.tools/docs/configuration/workspaces/>, <https://fallow.tools/docs/analysis/>, <https://fallow.tools/docs/cli/health/>, <https://fallow.tools/docs/analysis/duplication/>, <https://fallow.tools/docs/cli/audit/> (fetched 2026-07-06). This repo pins `fallow@3.0.0` via the pnpm catalog.

## What is Fallow

Fallow is codebase intelligence for TypeScript/JavaScript. It detects dead code, duplication, complexity problems, and architecture-boundary violations, and can auto-fix unused exports and dependencies. It performs two complementary levels of analysis:

1. **Static intelligence** — structure, reachability, duplication, complexity, boundaries; no execution needed.
2. **Runtime intelligence** — merges production execution evidence (hot/cold paths) into `fallow health` to improve deletion confidence.

Main CLI commands: `dead-code`, `dupes`, `health`, `audit`, `fix`, `coverage`, `explain`, `watch`, `config`.

Supporting features: `--production` mode (excludes test/dev files), JSON/HTML file support, AST-based CSS/SCSS/Tailwind analysis, and finding-trace debugging.

## Workspaces (monorepo support)

Fallow **auto-detects** workspaces — no explicit configuration needed:

- npm/yarn: the `"workspaces"` field in `package.json`
- pnpm: `pnpm-workspace.yaml` (this repo: `apps/*`, `packages/*`)

Extra patterns are additive via config:

```json
{ "workspaces": { "patterns": ["tools/*", "shared/*"] } }
```

Resolution capabilities:

- **Cross-workspace imports** resolve through `node_modules` symlinks to actual source, including pnpm's content-addressable store.
- **Package `exports` fields** are respected, including subpath patterns.
- **Build output mapping**: entries pointing at `dist/`/`build/` map back to `.ts`/`.tsx` source.
- **Per-package tsconfig**: each workspace's `tsconfig.json` path aliases are discovered and applied.

Scope _output_ (the full graph is still analyzed) with `-w` / `--workspace`:

```bash
fallow dead-code -w @myorg/ui          # single package
fallow dead-code -w web,admin          # multiple
fallow dead-code -w 'apps/*'           # glob
fallow dead-code -w 'apps/*,!apps/legacy'  # negation
```

## Dead code

Detects unused files, exports, types, dependencies, and circular dependencies. Rule severities are configurable per rule (`error`/`warn`) in `.fallowrc.json`. `fallow fix` removes unused exports and dependencies automatically. Inline suppression: `// fallow-ignore-next-line`.

## `fallow health`

Function-level and file-level health: cyclomatic complexity, cognitive complexity, CRAP (complexity × lack of coverage), maintainability index, churn hotspots, ranked refactoring targets, and a project score (0–100, letter grades: A ≥85, B 70–84, C 55–69, D 40–54, F <40).

```bash
fallow health                                   # complexity report
fallow health --file-scores --hotspots          # + file scores + hotspots
fallow health --min-score 75                    # CI gate: exit 1 below 75
fallow health --file-scores --hotspots --targets --format json
fallow health --coverage coverage-final.json    # accurate CRAP from Istanbul data
fallow health --save-snapshot                   # capture vitals for trends
fallow health --trend                           # compare vs last snapshot
```

Key options:

- Thresholds: `--max-cyclomatic` (20), `--max-cognitive` (15), `--max-crap` (30.0) — also settable in config under `health`.
- Sections: `--complexity`, `--file-scores`, `--hotspots`, `--targets`, `--score`.
- Formats: human, json, sarif, markdown, codeclimate, gitlab-codequality, badge.
- CI gates: `--min-score N`, `--min-severity moderate|high|critical`, `--report-only` (never fails).
- Windows: `--since 6m` (hotspot history), `--changed-since <ref>`, `--min-commits 3`.
- Ownership: `--ownership` (bus factor, reviewers), `--ownership-emails handle|anonymized|raw`.

Exit codes: without flags, exit 1 if any function exceeds a threshold; `--min-score`/`--min-severity` gate accordingly; `--report-only` always exits 0.

## `fallow dupes` (duplication)

Suffix-array clone detection in the same binary as dead-code analysis ("8-26x faster than jscpd"). `fallow dead-code --include-dupes` cross-references blocks that are duplicated _and_ unused — top cleanup targets.

Three modes:

- `strict` — exact token-for-token clones, no normalization.
- `mild` (default) — recommended balance of precision and recall.
- `semantic` — catches renamed-identifier clones (reports rename patterns like `holidays2024→holidays2025`).

```bash
fallow dupes
fallow dupes --mode strict
fallow dupes --min-tokens 50 --min-lines 5      # sensitivity (defaults shown)
fallow dupes --threshold 5                      # fail if duplication % exceeds 5
fallow dupes --skip-local                       # cross-directory clones only
fallow dupes --cross-language                   # TS vs JS comparison
fallow dupes --ignore-imports                   # drop import stmts from comparison
fallow dupes --changed-since main               # incremental
fallow dupes --save-baseline fallow-baselines/dupes.json
fallow dupes --baseline fallow-baselines/dupes.json
fallow dupes --trace src/utils.ts:42            # debug clones at a location
```

Config equivalent: `{ "duplicates": { "mode": "mild", "ignoreImports": true, ... } }`. Clone families get refactoring guidance: _extract function_ (same file) or _extract module_ (cross-file).

## `fallow audit` (PR-time quality gate)

Scans **changed files** for dead code, complexity, and duplication; returns a pass/warn/fail verdict. Default `--gate new-only` fails only on **newly-introduced** issues, keeping signal high; `--gate all` is strict mode.

```bash
fallow audit                    # auto-detects base branch
fallow audit --base main
fallow audit --base HEAD~3
fallow audit --gate all
```

Options: `--diff-file <PATH>` / `--diff-stdin` (pre-computed diff), `--max-crap <N>`, `--coverage <PATH>`, `--production`, baselines (`--dead-code-baseline`, `--health-baseline`, `--dupes-baseline` — also settable in config under `audit`), formats (`human`, `json`, `sarif`, `markdown`, `codeclimate`, `pr-comment-github`, `review-gitlab`).

| Verdict | Exit code | Condition                                             |
| ------- | --------- | ----------------------------------------------------- |
| pass    | 0         | No introduced issues (`new-only`) / no issues (`all`) |
| warn    | 0         | Only warn-severity issues                             |
| fail    | 1         | Error-severity issues                                 |
| error   | 2         | Runtime error (bad ref, config error)                 |

CI notes: branch on `verdict == "fail"` or the exit code; base auto-detection uses `git symbolic-ref refs/remotes/origin/HEAD` (needs history — use `fetch-depth: 0`); a temporary git worktree is created for the base-ref pass; docs-only/whitespace-only changes take a fast path.

## Best-practice adoption pattern

1. Single **root config** so workspace auto-detection covers everything; scope with `-w` instead of per-package configs.
2. **Baselines** to adopt gates gradually — inherited debt is recorded once, only regressions fail.
3. `audit --gate new-only` as the PR gate; full `health`/`dead-code`/`dupes` scans on demand or scheduled.
4. `--production` for deletion decisions; feed Istanbul coverage into `health` for accurate CRAP.
5. Snapshots (`--save-snapshot`) + `--trend` to track direction over time.

## How this repo uses fallow

- Root [.fallowrc.json](../../.fallowrc.json) — single config for the whole monorepo (workspaces auto-detected from `pnpm-workspace.yaml`).
- Root scripts: `vp run fallow:full | fallow:dead-code | fallow:health | fallow:dupes | fallow:audit`.
- CI: `fallow audit --gate new-only` runs as a blocking job in [check-safe.yml](../../.github/workflows/check-safe.yml) on PRs.
- Output convention: [reports/fallow/](../../reports/fallow/) is the single canonical location for every fallow artifact — latest snapshots (`*-latest.json`), `complexity-threshold-analysis.md`, `baselines/`, and gitignored per-run artifacts under `reports/fallow/runs/<timestamp>/` (produced by the `fallow-code-checker` skill / `fallow-scan` agent).
