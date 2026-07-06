import { z } from 'zod';

// 'linter' was split into 'eslint' + 'oxlint' (ADR-019); the retired id is
// deliberately absent so nothing NEW can ingest as the combined scanner —
// historical linter scans stay readable, they just can't gain siblings.
export const scannerIdSchema = z.enum([
  'code-smell-checker',
  'code-smell-zen',
  'eslint',
  'fallow',
  'oxlint',
]);
export type ScannerId = z.infer<typeof scannerIdSchema>;

export const scopeTypeSchema = z.enum([
  'changed-files',
  'diff',
  'folder',
  'repo',
]);
export type ScopeType = z.infer<typeof scopeTypeSchema>;

const severitySchema = z.enum(['BLOCKER', 'HIGH', 'MEDIUM', 'LOW', 'NIT']);
const confidenceSchema = z.enum(['high', 'medium', 'low']);
const effortSchema = z.enum(['small', 'medium', 'large']);
/**
 * Matches cqms.scan_findings' status CHECK constraint exactly. Real
 * report.md files in the wild also use `status: resolved` — that is NOT
 * accepted here; Step 5 (report.json emission) must map it to `done` when
 * generating the JSON, not this schema silently coercing it (ADR-007).
 */
const findingStatusSchema = z.enum(['open', 'in-progress', 'done', 'deferred']);
const findingKindSchema = z.enum(['single_location', 'duplication_group']);

/**
 * Mirrors cqms.scan_findings' actual NOT NULL/CHECK constraints (not a
 * field-by-field transcription of SCHEMA_V1.md's "required" list) — per
 * TECH_SPEC §2.3a, Postgres owns per-field validity authority.
 *
 * `.default(...)` on verification_steps/status/finding_kind/extra is not
 * just convenience: sp_ingest_scan_result bulk-inserts via
 * jsonb_to_recordset, which does NOT apply column DEFAULTs for an
 * absent/null key — it inserts SQL NULL. Those four columns are
 * `NOT NULL DEFAULT ...`, so an explicit NULL insert would fail the
 * constraint. Defaulting here, before the finding ever reaches the
 * procedure, is what keeps the bulk insert correct.
 */
export const scanFindingSchema = z.object({
  confidence: confidenceSchema,
  defer_risk: z.string().nullish(),
  dependencies: z.array(z.string()).nullish(),
  effort: effortSchema.nullish(),
  evidence_excerpt: z.string().nullish(),
  extra: z.record(z.string(), z.unknown()).default({}),
  finding_id: z.string().min(1),
  finding_kind: findingKindSchema.default('single_location'),
  fix: z.string().min(1),
  location_hint: z.string().nullish(),
  location_path: z.string().min(1),
  owner: z.string().nullish(),
  related_findings: z.array(z.string()).nullish(),
  rule_id: z.string().min(1),
  severity: severitySchema,
  status: findingStatusSchema.default('open'),
  tags: z.array(z.string()).nullish(),
  verification_steps: z.array(z.string()).default([]),
  why: z.string().min(1),
});
export type ScanFinding = z.infer<typeof scanFindingSchema>;

/** Mirrors cqms.run_files' NOT NULL columns. */
export const runFileSchema = z.object({
  extension: z.string().min(1),
  file_path: z.string().min(1),
  file_type_category: z.string().min(1),
  line_count: z.number().int().nonnegative().nullish(),
  nested_level: z.number().int().nonnegative(),
});
export type RunFileInput = z.infer<typeof runFileSchema>;

/**
 * The report.json contract — deliberately shaped to match what
 * sp_ingest_scan_result's p_report_metadata expects almost verbatim
 * (flat blocker_count/high_count/... rather than SCHEMA_V1.md's nested
 * findings_count_by_severity), so ingestReport() stays a thin
 * validate-then-call wrapper with no reshaping step in between.
 */
export const reportSchema = z.object({
  blocker_count: z.number().int().nonnegative().default(0),
  files_analyzed: z.number().int().nonnegative().default(0),
  findings: z.array(scanFindingSchema).default([]),
  generated_at: z.string().min(1),
  health_metrics: z.record(z.string(), z.unknown()).nullish(),
  high_count: z.number().int().nonnegative().default(0),
  low_count: z.number().int().nonnegative().default(0),
  medium_count: z.number().int().nonnegative().default(0),
  nit_count: z.number().int().nonnegative().default(0),
  report_id: z.string().min(1),
  top_risk: z.string().nullish(),
});
export type Report = z.infer<typeof reportSchema>;
