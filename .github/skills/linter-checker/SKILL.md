---
name: linter-checker
description: Run oxlint + the custom-rules eslint pass and produce a schema-aligned lint report. Use for a fully deterministic lint sweep of a package or app, persisted wherever this repo configures ingestion.
argument-hint: 'Optional scope directory, for example: apps/react-router or packages/ui (default: the whole repository)'
user-invocable: true
context: fork
agent: general-purpose
allowed-tools: Bash(node:*), Read
---

# Linter Checker

## Outcome

Produce a fully deterministic lint report — **no LLM judgment anywhere in finding generation** (unlike `code-smell-checker`/`code-smell-zen`/`fallow-code-checker`'s triage step). Every finding is a direct, mechanical translation of a real `oxlint`/eslint diagnostic.

## When to Apply

Use this skill when you need:

- a quick, deterministic lint sweep of a package or app
- lint findings persisted alongside the other scanners' history, when this repo has an ingestion command configured
- a report that needs no human triage — every finding is already unambiguous (a real rule violation at a real location)

## Procedure

Run BOTH scanners — `oxlint` and `eslint` are independent, and each produces its own raw artifact, report and scan:

```bash
node packages/scan-report/scripts/generate-oxlint-report.mjs [scope-directory]
node packages/scan-report/scripts/generate-eslint-report.mjs [scope-directory]
```

Both runners ship in [`@repo/scan-report`](../../../packages/scan-report/README.md); the paths above are this repository's own workspace copy, and a repository that installed the package runs them by name instead (`npx scan-report-oxlint`, `npx scan-report-eslint`). `scope-directory` defaults to the whole repository (`.`) if omitted — pass one to narrow the sweep. Each runner:

1. Runs its one tool — oxlint via `vp lint . --format json` inside the scope directory (not the raw `oxlint` binary — `vp lint` merges in the app/package's own `vite.config.ts` lint config, matching what a developer actually sees); eslint via the custom-rules `eslint . --config <flat config> --format json` pass, only if a flat config exists in the scope directory (most `packages/*` don't have one — skipped gracefully, not an error).
2. Writes its raw artifact verbatim (`oxlint.raw.json` / `eslint.raw.json`, each with a `kind` discriminator).
3. Maps every diagnostic/message directly into the canonical finding shape: `severity` (oxlint `error`/`warning` and eslint `2`/`1` → `HIGH`/`MEDIUM`), `confidence: "high"` always, `effort: "small"` always, `rule_id`/`location_path`/`location_hint`/`why`/`fix` from the tool's own output.
4. Builds `report.json` directly (this IS the report — there is no separate LLM-authored version to reconcile against) and renders `report.md` mechanically from it.
5. Saves all three files to `.tmp/oxlint-checker/{timestamp}/` or `.tmp/eslint-checker/{timestamp}/`.
6. Hands the run to the ingestion command configured in `scan-report.config.json` at the repo root, as its own scanner. Unconfigured ingest (`scan-report.config.json` missing / skip) is the documented normal state in this repository — the three artifacts are the deliverable. A configured command that fails is a different outcome: it exits non-zero.

## After Running

Report to the user:

- both run directory paths
- each scanner's finding count (and HIGH/MEDIUM breakdown) from the script's own stdout
- what the ingestion step reported: ingested, skipped because nothing is configured (normal), or FAILED. A failed ingestion exits non-zero and is a real problem to relay — the report files are still complete.

Do not re-derive, re-triage, or second-guess the findings — they are already exactly what `oxlint`/eslint reported, which is the point of this skill being deterministic.

## Example Prompts

- /linter-checker run a lint sweep on apps/react-router
- /linter-checker check packages/ui for lint violations
