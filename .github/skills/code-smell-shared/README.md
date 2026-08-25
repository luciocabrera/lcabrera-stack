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

The two contract documents live here, beside the skills that follow them — a
report shape is agreed between a scanner and whatever reads it, which makes it
per-repository the same way prompt text is
([ADR-091](../../../docs/decisions/ADR-091-retire-the-scan-report-pipeline.md)):

- [SCHEMA_V1.md](./SCHEMA_V1.md): canonical report contract and validation rules
- [REPORT_JSON_CONTRACT.md](./REPORT_JSON_CONTRACT.md): the `report.json` sibling contract a scan consumer parses

## Intended outcome

All scan skills emit structurally equivalent markdown reports that can be
consumed by agents without custom parsing per skill, plus a structurally
equivalent `report.json`.

## The artifacts are the deliverable

A scan skill writes its report files and stops. There is no forwarding step: the
artifacts in the run directory are the whole output, and whatever wants them
reads them from there.
