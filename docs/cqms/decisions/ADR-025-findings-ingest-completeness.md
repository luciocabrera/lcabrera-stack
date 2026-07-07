# ADR-025: Findings ingest completeness (final-E2E fixes)

**Status:** Accepted

## Context

Phase 3's final E2E (Step 11) ran every scanner against the CQMS repo
itself through the real UI + orchestrator. The four deterministic
scanners passed cleanly; the `code-smell-checker` agent produced a valid
12-finding report that **failed ingestion**, and the resulting probes
exposed a second, older defect. Both fixes landed as part of Step 11.

## Decision

### 1. Lenient string-array fields in `reportSchema`

The LLM scanners sometimes emit a string-array field as a bare string —
observed live: `"related_findings": "F-001, F-003"` and prose sentences
in `dependencies`. The thin Zod pre-check rejected the whole report (and
so failed a ~10-minute agent scan) over a mechanically repairable type
slip.

`dependencies`, `related_findings`, `tags` and `verification_steps` now
share `lenientStringArraySchema`: a bare string is lifted to a
one-element array. This is deliberately **type repair, not semantic
coercion** (the line ADR-007 draws): content is preserved verbatim —
never split on commas, never reinterpreted — so `"F-001, F-003"` becomes
`["F-001, F-003"]`, not `["F-001", "F-003"]`. Splitting is the emitter's
job; the schema only guarantees the DB shape.

### 2. Migration 0017 — `sp_ingest_scan_result` writes all finding columns

`sp_ingest_scan_result`'s INSERT column list had omitted `dependencies`,
`related_findings`, `owner` and `status` since 0002: `reportSchema`
validates them and `cqms.scan_findings` has the columns, but every
ingest silently dropped them (`status` fell back to the table DEFAULT,
the rest to NULL). Nothing was irrecoverable — `reports.report_json`
archives the full report verbatim — but the queryable extraction lost
real fields. 0017 `CREATE OR REPLACE`s the procedure with the four
columns appended to both the INSERT list and the
`jsonb_to_recordset` AS-clause (order mirrored, since the SELECT expands
`f.*`).

`status` is `NOT NULL` and `jsonb_to_recordset` applies no column
DEFAULTs — the insert is safe only because `reportSchema` defaults
`status` to `'open'` before findings reach the procedure, the same
contract `verification_steps`/`finding_kind`/`extra` already rely on.
Two real-DB tests that hand-build finding payloads for the procedure had
to add `status: 'open'` — any caller bypassing `reportSchema` owns that
contract itself.

## Verification performed

- `report.schema.test.ts` covers the lift (bare string → one-element
  array, verbatim; real arrays and nullish untouched; non-string members
  still rejected); `getScanCodeSmellSummary.util.test.ts` pins 0017 by
  asserting all four columns persist through a real
  `sp_ingest_scan_result` call.
- The failed self-scan report was re-ingested through the real CLI path
  (`ingest.cli.ts` → Zod → procedures): scan flipped to `succeeded`, 12
  findings + `code_smell_checker_runs` master landed, and the drifted
  fields arrived as lifted arrays in their own columns.
- Suites after both fixes: scan-ingestion **180/180**, admin_system
  **25/25**, scan-orchestrator **9/9**; lint + typecheck clean; migration
  0017 applied to live `cqms_db`.

## Deferred

`sp_ingest_scan_result` remains append-only (no DELETE-then-INSERT like
the detail procedures), so re-ingesting the same scan requires clearing
`scan_findings`/`reports` rows first — acceptable while re-ingest is a
manual maintenance flow, worth revisiting if it becomes routine.
