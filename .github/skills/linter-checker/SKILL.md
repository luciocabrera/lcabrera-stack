---
name: linter-checker
description: Run oxlint + the custom-rules eslint pass and produce a schema-aligned lint report. Use for a fully deterministic lint sweep of a package or app, with results persisted to CQMS.
argument-hint: 'Optional scope directory, for example: apps/react-router (default) or packages/ui'
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
- lint findings persisted to CQMS alongside the other three scanners' history
- a report that needs no human triage — every finding is already unambiguous (a real rule violation at a real location)

## Procedure

Run BOTH scripts, one per scanner (ADR-019 split 'linter' into independent `oxlint` and `eslint` scanners — each produces its own raw artifact, report, and CQMS scan):

```bash
node .github/skills/linter-checker/scripts/generate-oxlint-report.mjs [scope-directory]
node .github/skills/linter-checker/scripts/generate-eslint-report.mjs [scope-directory]
```

`scope-directory` defaults to `apps/react-router` if omitted. Each script:

1. Runs its one tool — oxlint via `vp lint . --format json` inside the scope directory (not the raw `oxlint` binary — `vp lint` merges in the app/package's own `vite.config.ts` lint config, matching what a developer actually sees); eslint via the custom-rules `eslint . --config <flat config> --format json` pass, only if a flat config exists in the scope directory (most `packages/*` don't have one — skipped gracefully, not an error).
2. Writes its raw artifact verbatim (`oxlint.raw.json` / `eslint.raw.json`, each with a `kind` discriminator).
3. Maps every diagnostic/message directly into the canonical finding shape: `severity` (oxlint `error`/`warning` and eslint `2`/`1` → `HIGH`/`MEDIUM`), `confidence: "high"` always, `effort: "small"` always, `rule_id`/`location_path`/`location_hint`/`why`/`fix` from the tool's own output.
4. Builds `report.json` directly (this IS the report — there is no separate LLM-authored version to reconcile against) and renders `report.md` mechanically from it.
5. Saves all three files to `.tmp/oxlint-checker/{timestamp}/` or `.tmp/eslint-checker/{timestamp}/`.
6. Attempts CQMS ingestion as its own scanner (best-effort — the files are already saved regardless); ingestion also explodes the raw output into the `cqms.oxlint_runs`/`cqms.eslint_runs` masters and `cqms.lint_violations` detail rows (including eslint's suppressed messages, tracked as baselined debt).

## After Running

Report to the user:

- both run directory paths
- each scanner's finding count (and HIGH/MEDIUM breakdown) from the script's own stdout
- whether CQMS ingestion succeeded or failed (non-fatal either way)

Do not re-derive, re-triage, or second-guess the findings — they are already exactly what `oxlint`/eslint reported, which is the point of this skill being deterministic.

## Example Prompts

- /linter-checker run a lint sweep on apps/react-router
- /linter-checker check packages/ui for lint violations
