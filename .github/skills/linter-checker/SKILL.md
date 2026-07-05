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

Run the script — it does everything unattended (lint, merge raw output, build `report.json`, render `report.md`, save all three, attempt CQMS ingestion):

```bash
node .github/skills/linter-checker/scripts/generate-linter-report.mjs [scope-directory]
```

`scope-directory` defaults to `apps/react-router` if omitted. The script:

1. Runs `vp lint . --format json` inside the scope directory (not the raw `oxlint` binary — `vp lint` merges in the app/package's own `vite.config.ts` lint config, matching what a developer actually sees).
2. Runs the custom-rules `eslint . --config eslint.config.mjs --format json` pass, only if that config file exists in the scope directory (most `packages/*` don't have one — skipped gracefully, not an error).
3. Merges both into `linter.raw.json` (`{ kind: 'combined', oxlint, eslint }`, mirroring `fallow-code-checker`'s own raw-artifact convention).
4. Maps every diagnostic/message directly into the canonical finding shape: `severity` (oxlint `error`/`warning` and eslint `2`/`1` → `HIGH`/`MEDIUM`), `confidence: "high"` always, `effort: "small"` always, `rule_id`/`location_path`/`location_hint`/`why`/`fix` from the tool's own output.
5. Builds `report.json` directly (this IS the report — there is no separate LLM-authored version to reconcile against) and renders `report.md` mechanically from it.
6. Saves all three files to `.tmp/linter-checker/{timestamp}/`.
7. Attempts CQMS ingestion (best-effort — the three files are already saved regardless of whether this succeeds).

## After Running

Report to the user:

- the run directory path
- the finding count (and HIGH/MEDIUM breakdown) from the script's own stdout
- whether CQMS ingestion succeeded or failed (non-fatal either way)

Do not re-derive, re-triage, or second-guess the findings — they are already exactly what `oxlint`/eslint reported, which is the point of this skill being deterministic.

## Example Prompts

- /linter-checker run a lint sweep on apps/react-router
- /linter-checker check packages/ui for lint violations
