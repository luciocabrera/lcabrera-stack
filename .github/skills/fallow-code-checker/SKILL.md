---
name: fallow-code-checker
description: Run a full fallow scan with vp and produce a prioritized, evidence-based report aligned to the code-smell-checker output contract. Use when running a full static analysis scan for dead code, unused exports, high complexity, or fallow findings.
argument-hint: 'Optional scope, for example: repo, apps/showcase, or changed files only'
user-invocable: true
context: fork
agent: general-purpose
allowed-tools: Bash(bash:*,cat:*,date:*,mkdir:*,node:*,npx:*,tee:*,vp:*), Read, Grep, Glob
---

# Fallow Full Scan Checker

## Outcome

Produce a full fallow findings report that:

- executes vp run fallow:report
- captures and classifies all fallow categories from raw output
- separates high-confidence issues from likely false positives
- provides a fix plan ordered by risk and effort
- saves a report artifact on disk for handoff

## Skill vs Agent

|            | `fallow-code-checker` skill                    | `fallow-scan` agent                                       |
| ---------- | ---------------------------------------------- | --------------------------------------------------------- |
| Execution  | Inline — output in main context                | Background — isolated, main context untouched             |
| Use when   | You want findings inline to act on immediately | You want the scan to run while you work on something else |
| Invocation | `/fallow-code-checker`                         | Ask Claude to spawn the `fallow-scan` agent               |

## When to Apply

Use this skill when you need to:

- run a full static hygiene scan before refactoring
- evaluate fallow regressions after large merges
- convert raw fallow output into actionable remediation
- prepare cleanup issues with confidence scoring

## Inputs

Collect or infer:

- scope: repo (all workspaces), a workspace glob (fallow `-w` syntax), or changed files
- execution directory: always the repo root — `fallow:report` is defined in the root package.json and `.fallowrc.json` lives at the root
- constraints: behavior-safe cleanup only, test coverage expectations

If inputs are missing, default to:

- scope: entire monorepo (fallow auto-detects all pnpm workspaces from the root config)
- mode: full fallow scan
- output format: schema-aligned report with prioritized queue

## Procedure

1. Resolve execution directory.

- always run from the repo root — `scripts/fallow-report.sh` does this itself
- if the root package.json has no `fallow:report` script, stop and report the missing script with a remediation hint

2. Execute fallow.

!`vp run fallow:report`

It creates a timestamped `reports/fallow/runs/<ts>/`, writes `fallow.raw.json` into it, and echoes the directory as its last line. Note that path — it is used for all subsequent saves.

To scope the report to specific workspaces, pass a fallow `-w` glob, e.g. `vp run fallow:report -w 'apps/showcase'`. The full dependency graph is analyzed either way; the glob only filters reported findings.

Use the JSON file as the source of truth for findings. Human output from the same run is for context only.

3. Parse findings into normalized records.

For each raw finding from `fallow.raw.json`, extract:

- category (unused files, unused exports, exported types, dependencies, unlisted binaries, unresolved imports, configuration hints, tag hints, or other fallow sections)
- location path and hint (line/symbol if available)
- tool confidence (high/medium/low) based on evidence quality

Do not invent findings. Every report finding must map to a concrete JSON finding (or explicit aggregate in the JSON summary, such as duplicate group counts and threshold counts).

Also capture one verbatim human summary line (including timing when present), for example:

- `✗ 37 above threshold · 2780 analyzed · maintainability 93.0 (good) (0.05s)`

4. Apply false-positive triage.

Mark as potential false positive when any is true:

- symbol is used via dynamic import, framework convention, or runtime reflection
- usage appears only through barrels or generated code boundaries
- command/script binaries are invoked through npx wrappers
- project config shows explicit keep rationale

5. Assign canonical severity.

Use category-based mapping first, then adjust by impact:

- Unresolved imports: HIGH (BLOCKER when startup/build path is affected)
- Unlisted dependencies or binaries: HIGH (MEDIUM when optional tooling-only path)
- Unused dependencies (prod): HIGH
- Unused devDependencies and catalog entries: MEDIUM
- Unused files and exports: MEDIUM
- Unused exported types or enum members: LOW
- Configuration hints and tag hints: NIT

Context adjustments:

- escalate to BLOCKER when removal/change is likely to break runtime, build, or deployment
- downgrade one level when evidence is low confidence or convention-based

6. Build a fix plan.

For each finding include:

- evidence snippet summary
- why it matters
- safe fix pattern
- required verification steps

Order queue by risk reduction first, then effort.

When a finding is aggregate (for example duplicate groups or files above threshold), include a representative top-N list from raw JSON entries to make it actionable.

7. Emit report using shared contract.

Use the shared output contract and template:

- ../code-smell-shared/SCHEMA_V1.md
- ../code-smell-shared/REPORT_TEMPLATE.md
- ../code-smell-shared/TEST_PLAN.md
- ../code-smell-shared/RULE_FIX_QUICK_REFERENCE.md

Set metadata.skill_name to fallow-code-checker.
Add `raw_summary_line` in Metadata with verbatim human output.
Add `raw_artifact` in Metadata with the path to `fallow.raw.json`.
Use the shared report structure exactly — all scan skills emit the same SCHEMA_V1 report so downstream agents need no per-skill parsing.

Also build `report.json` from these same findings — see ../code-smell-shared/REPORT_JSON_CONTRACT.md. Set `finding_kind: "duplication_group"` + `extra.instances` for any finding derived from `dupes.clone_groups`; every other finding is the default `single_location`. Map any status other than `open`/`in-progress`/`done`/`deferred` (in particular `resolved`) to `done` in the JSON.

8. Save the report artifact.

Always save without prompting. The run directory was created in step 2. Write:

1. `fallow.raw.json` — already written by the step 2 command
2. `report.md` — write the final report to the same directory
3. `report.json` — write the JSON built in step 7 to the same directory
4. Tell the user all three saved paths

## Decision Logic

Use this branching logic:

- If a finding has clear static and runtime evidence, classify as high-confidence.
- If evidence depends on conventions/tooling side effects, classify as medium-confidence and request validation.
- If a finding is proven required by startup, build, or deployment paths, escalate severity.
- If a finding is only noisy tool output without reproducible evidence, defer with rationale.
- Always preserve category-to-severity mapping as the default baseline, then apply context adjustments.

## Quality Checks

Before finalizing:

- verify every finding has concrete evidence and path
- deduplicate overlapping findings
- distinguish root dead code from downstream artifacts
- ensure recommended fixes are behavior-safe unless user requests aggressive cleanup
- ensure summary counts match findings

## Completion Checklist

- fallow executed from correct directory
- machine-readable raw output captured (`fallow.raw.json`)
- findings normalized and triaged from raw output (no invented entries)
- verbatim summary line preserved (including timing when present)
- false positives explicitly labeled
- all detected fallow categories considered (not dead code only)
- prioritized queue provided
- report saved to `reports/fallow/runs/{run-directory}/report.md`
- `report.json` saved alongside it, matching the same findings
- residual risk and validation steps documented

## Example Prompts

- /fallow-code-checker run a full fallow scan and give me quick wins first
- /fallow-code-checker scan apps/showcase and separate real issues from false positives
- /fallow-code-checker run after this merge and propose a safe cleanup sequence
