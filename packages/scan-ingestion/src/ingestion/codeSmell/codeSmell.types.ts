/**
 * The master row for cqms.code_smell_(checker|zen)_runs, shaped for the
 * sp_ingest_code_smell_*_detail procedures' jsonb_to_record (ADR-019
 * addendum, Step 5). Every NOT NULL column is always emitted explicitly
 * because jsonb_to_record never applies column DEFAULTs (the documented
 * ARCHITECTURE.md footgun); the nullable ones may be omitted → SQL NULL.
 */
export type CodeSmellRunSummaryInput = {
  readonly blocker_count: number;
  readonly confidence_high_count: number;
  readonly confidence_low_count: number;
  readonly confidence_medium_count: number;
  readonly effort_large_count: number;
  readonly effort_medium_count: number;
  readonly effort_small_count: number;
  readonly files_analyzed: number;
  readonly finding_count: number;
  readonly generated_at?: string;
  readonly high_count: number;
  readonly low_count: number;
  readonly medium_count: number;
  readonly nit_count: number;
  readonly report_id?: string;
  readonly rules_flagged_count: number;
  readonly top_risk?: string;
};
