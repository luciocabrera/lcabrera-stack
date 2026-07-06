/**
 * One row for cqms.lint_violations, shaped for sp_ingest_(es|ox)lint_detail's
 * jsonb_to_recordset (ADR-019). Optional keys are simply omitted —
 * JSON.stringify drops undefined and jsonb_to_recordset yields SQL NULL for
 * absent keys, which is exactly right for the nullable columns. The NOT
 * NULL columns (source..message, fixable, suppressed) are always emitted
 * explicitly because jsonb_to_recordset never applies column DEFAULTs
 * (the documented ARCHITECTURE.md footgun).
 */
export type LintViolationInput = {
  readonly col?: number;
  readonly end_col?: number;
  readonly end_line?: number;
  readonly file_path: string;
  readonly fixable: boolean;
  readonly help_url?: string;
  readonly line?: number;
  readonly message: string;
  readonly message_id?: string;
  readonly rule_id: string;
  readonly severity: 'HIGH' | 'MEDIUM';
  readonly severity_raw: string;
  readonly source: 'eslint' | 'oxlint';
  readonly suppressed: boolean;
  readonly suppression_justification?: string;
  readonly suppression_kind?: string;
};
