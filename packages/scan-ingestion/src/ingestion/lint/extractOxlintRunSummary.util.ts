import type { OxlintRaw } from './oxlintRaw.schema.ts';

export type OxlintRunSummary = {
  readonly error_count: number;
  readonly number_of_files: number;
  readonly number_of_rules: number;
  readonly warning_count: number;
};

type ExtractOxlintRunSummaryArgs = {
  readonly raw: OxlintRaw;
};

/**
 * The cqms.oxlint_runs master row (1:1 with the scan, ADR-019) —
 * number_of_files/number_of_rules come straight from oxc's own summary
 * fields; the severity split is counted from the diagnostics.
 */
export const extractOxlintRunSummary = ({
  raw,
}: ExtractOxlintRunSummaryArgs): OxlintRunSummary => ({
  error_count: raw.diagnostics.filter((d) => d.severity === 'error').length,
  number_of_files: raw.number_of_files,
  number_of_rules: raw.number_of_rules,
  warning_count: raw.diagnostics.filter((d) => d.severity !== 'error').length,
});
