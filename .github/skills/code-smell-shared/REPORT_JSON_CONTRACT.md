# `report.json` Contract

This document defines the **JSON** sibling of `report.md`, written by the scan
skills (`code-smell-checker`, `code-smell-zen`, `fallow-code-checker`).

Unlike `SCHEMA_V1.md` (the Markdown report contract), `report.json` is for a
machine parser rather than a human reader. Save it as `report.json` in the same
run directory as `report.md`; that file is the deliverable.

**This is the same findings you already wrote to `report.md` — it must not add, drop, or reinterpret any finding.** Author it directly from the Markdown you just produced; do not re-derive findings independently.

## 1. Top-level shape

```json
{
  "report_id": "<same value as Metadata's report_id>",
  "generated_at": "<same value as Metadata's generated_at, ISO-8601>",
  "files_analyzed": <same integer as Summary>,
  "blocker_count": <int>,
  "high_count": <int>,
  "medium_count": <int>,
  "low_count": <int>,
  "nit_count": <int>,
  "top_risk": "<same string as Summary's top_risk>",
  "findings": [ /* array of Finding objects, see §2 */ ]
}
```

**Flatten the counts.** `SCHEMA_V1.md`'s Summary section nests severity counts under `findings_count_by_severity: {blocker, high, medium, low, nit}` — in `report.json` these are **flat top-level keys** (`blocker_count`, `high_count`, etc.), not nested. This is deliberate: it lets the ingestion code stay a thin pass-through with no reshaping step.

`fallow-code-checker` only: if you have real aggregate metrics from `fallow.raw.json`'s `health` key (`vital_signs`, `hotspots`) that aren't per-finding items, include them as a `health_metrics` object at the top level (any shape — it's stored as-is, no fixed contract). Omit the key entirely if you have nothing to put there. `code-smell-checker`/`code-smell-zen` never populate this.

## 2. Finding shape

Every finding in the `findings` array uses these keys — same names as `SCHEMA_V1.md`'s finding contract, so this is mostly a direct transcription of what you already wrote per finding in `report.md`:

```json
{
  "finding_id": "F-001",
  "rule_id": "CC.G5",
  "severity": "HIGH",
  "confidence": "high",
  "location_path": "src/foo.ts",
  "location_hint": "42-58",
  "evidence_excerpt": "<the same excerpt from report.md, or omit>",
  "why": "<one sentence>",
  "fix": "<one sentence>",
  "effort": "small",
  "defer_risk": "<one sentence, or omit>",
  "verification_steps": ["<step 1>", "<step 2>"],
  "status": "open",
  "owner": null,
  "dependencies": null,
  "related_findings": null,
  "tags": null
}
```

Required (never omit, never `null`): `finding_id`, `rule_id`, `severity`, `confidence`, `location_path`, `why`, `fix`. Everything else may be omitted or `null` if `report.md` left it blank — **except** `verification_steps`, which must always be a real array (use `[]`, never omit it or set it `null`).

### `status` — map non-canonical values, do not pass them through

Only these four values are valid: `open`, `in-progress`, `done`, `deferred`. If the finding's `report.md` status is anything else (in particular, **`resolved`**, which shows up in real reports despite not being in the documented enum), **map it to `done`** in the JSON. Do not write `resolved` (or any other non-canonical value) into `report.json` — ingestion will reject the entire report if you do.

### `finding_kind` and `extra` — only for duplication-group findings

Every finding defaults to `"finding_kind": "single_location"` (you can omit the key entirely for a normal finding — this is the default). **`fallow-code-checker` only**: for a finding derived from `fallow.raw.json`'s `dupes.clone_groups` (a duplicate-code group with multiple instances, not a single location), set:

```json
{
  "finding_kind": "duplication_group",
  "location_path": "<the first/primary instance's path>",
  "extra": { "instances": [ { "path": "...", "location_hint": "..." }, ... ] }
}
```

`code-smell-checker`/`code-smell-zen` never emit `duplication_group` findings — every finding they produce is `single_location` (the default; omit `finding_kind` and `extra` entirely).

## 3. Validation

`report.json` is Zod-parsed by `ingestReport()` before anything is written to the database. If parsing fails (a required field missing, an invalid `severity`/`status`/`confidence` value, etc.), the whole run's ingestion is rejected — `report.md` is unaffected either way, since it's saved as its own step regardless of ingestion outcome.
