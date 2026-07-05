# Shared Standards For Code Smell Skills

This folder contains shared output and validation standards used by:

- code-smell-checker
- code-smell-zen
- fallow-code-checker

## Files

- SCHEMA_V1.md: canonical report contract and validation rules
- REPORT_TEMPLATE.md: copy/paste handoff template for downstream agents
- REPORT_JSON_CONTRACT.md: the `report.json` sibling contract consumed by CQMS's `packages/scan-ingestion`
- TEST_PLAN.md: repeatable test strategy and scoring rubric
- EXAMPLE_REPORT.md: fully populated sample report using schema v1.0
- RULE_FIX_QUICK_REFERENCE.md: TS/React rule-to-fix guidance and verification snippets
- COMPLIANCE_AUDIT.md: detailed alignment check against project guidelines (16-section matrix)

## Intended outcome

All scan skills emit structurally equivalent markdown reports that can be consumed by agents without custom parsing per skill, plus a structurally equivalent `report.json` each skill's final step also writes and ingests into CQMS's Postgres schema via `packages/scan-ingestion`.
