---
name: app-graph
description: >
  Generate a deterministic folder/file inventory graph of a scan scope
  (export/function/type counts via ts-morph). Use when you need an app-graph
  report, not an audit. This is a scripts-only scanner — run the generator;
  do not improvise a walk.
user-invocable: true
allowed-tools: Bash(node:*)
---

# App Graph

This skill is the runner for
`.github/skills/app-graph/scripts/generate-app-graph-report.mjs`. It is an
inventory, not an audit: it walks the scan scope, builds the nested
folder/file node tree, and emits `app-graph.raw.json` plus a canonical
0-findings `report.json` and `report.md`.

## Procedure

Run the generator from the repository root. Do not walk the tree by hand.

```bash
node .github/skills/app-graph/scripts/generate-app-graph-report.mjs
```

The script honors the shared deterministic-runner flag contract
(`--target` / `--scope` / `--output-dir` / `--skip-ingest`). See the script
header for the contract.

Unconfigured ingest (`scan-report.config.json` missing / skip) is the
documented normal state in this repository — the artifacts are the
deliverable.
