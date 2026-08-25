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

Run the repository's lint-report generator. It covers all three engines in one
pass — there is no per-scanner runner to invoke:

```bash
vp run lint:report
```

It writes one file per engine into the canonical `reports/` tree:

| File                              | What it holds                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `reports/oxlint/full-latest.json` | one repo-wide `vp lint . --format=json` run — Oxlint's own `{ diagnostics, … }` shape                                                       |
| `reports/eslint/full-latest.json` | the custom-rules pass, merged across every workspace owning an `eslint.config.mjs`, paths made repo-relative, `suppressedMessages` included |
| `reports/biome/full-latest.json`  | one repo-wide `biome lint . --reporter=json`                                                                                                |

`vp lint` rather than the raw `oxlint` binary is deliberate: it merges each
workspace's own `vite.config.ts` lint config, so the output matches what a
developer sees. The eslint pass is skipped for a workspace with no flat config
(most `packages/*`) — that is a normal state, not an error.

These artifacts are produced on demand and are not tracked
([ADR-049](../../../docs/decisions/ADR-049-findings-reports-are-produced-on-demand.md)),
so read the run you just produced rather than a previous one.

## After Running

Report to the user:

- the three report paths
- each engine's finding count, and the error/warning split, from the generator's
  own stdout
- for eslint, how many workspaces were covered — a low number usually means a
  missing flat config rather than a clean tree

Do not re-derive, re-triage, or second-guess the findings — they are exactly
what `oxlint`, eslint and Biome reported, which is the point of this skill being
deterministic.

## Example Prompts

- /linter-checker run a lint sweep on apps/react-router
- /linter-checker check packages/ui for lint violations
