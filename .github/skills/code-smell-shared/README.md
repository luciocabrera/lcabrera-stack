# Shared Standards For Code Smell Skills

This folder contains shared output and validation standards used by:

- code-smell-checker
- code-smell-zen
- fallow-code-checker

## Files

- REPORT_TEMPLATE.md: copy/paste handoff template for downstream agents
- TEST_PLAN.md: repeatable test strategy and scoring rubric
- EXAMPLE_REPORT.md: fully populated sample report using schema v1.0
- RULE_FIX_QUICK_REFERENCE.md: TS/React rule-to-fix guidance and verification snippets
- COMPLIANCE_AUDIT.md: detailed alignment check against project guidelines (16-section matrix)

The two contract documents live with the code that produces them, in
[`@lcabrera/scan-report`](../../../packages/scan-report/README.md), and ship in
its tarball so a consuming repository can read the contract it is emitting:

- [SCHEMA_V1.md](../../../packages/scan-report/SCHEMA_V1.md): canonical report contract and validation rules
- [REPORT_JSON_CONTRACT.md](../../../packages/scan-report/REPORT_JSON_CONTRACT.md): the `report.json` sibling contract a scan consumer parses

## Intended outcome

All scan skills emit structurally equivalent markdown reports that can be
consumed by agents without custom parsing per skill, plus a structurally
equivalent `report.json`.

## Persisting a run

Writing the artifacts and persisting them are separate steps, and only the first
is a scan skill's business. Each skill's final step runs
`node packages/scan-report/scripts/ingest-report.mjs` (published as the
`scan-report-ingest` bin), which forwards its arguments to the command
configured under `ingest` in `scan-report.config.json` at the repository root. In this repository that command is CQMS's ingest CLI, so a scan lands in
the `cqms.*` tables exactly as it always has; in a repository that configures
nothing, the step prints a skip naming the missing configuration and exits 0,
and the three report artifacts are the whole deliverable.

A configured command that fails is a different outcome from an unconfigured one:
it exits non-zero and says `Ingestion FAILED`. Report it — the artifacts survive
either way, but a broken persistence path is not a normal state.
