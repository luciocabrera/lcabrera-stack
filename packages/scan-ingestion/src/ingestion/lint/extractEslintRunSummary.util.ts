import type { EslintRaw } from './eslintRaw.schema.ts';

export type EslintRunSummary = {
  readonly error_count: number;
  readonly fatal_error_count: number;
  readonly files_linted: number;
  readonly fixable_error_count: number;
  readonly fixable_warning_count: number;
  readonly rules_violated_count: number;
  readonly suppressed_count: number;
  readonly warning_count: number;
};

type ExtractEslintRunSummaryArgs = {
  readonly raw: EslintRaw;
};

/**
 * The cqms.eslint_runs master row (1:1 with the scan, ADR-019) — run-level
 * aggregates straight from the eslint result array. rules_violated_count
 * counts distinct rules among ACTIVE messages only; suppressed debt is
 * tracked separately via suppressed_count and the per-violation rows.
 */
export const extractEslintRunSummary = ({
  raw,
}: ExtractEslintRunSummaryArgs): EslintRunSummary => {
  const activeRuleIds = new Set(
    raw.results.flatMap((fileResult) =>
      fileResult.messages.map((message) => message.ruleId ?? 'eslint(unknown)'),
    ),
  );

  return {
    error_count: raw.results.reduce((sum, r) => sum + r.errorCount, 0),
    fatal_error_count: raw.results.reduce(
      (sum, r) => sum + r.fatalErrorCount,
      0,
    ),
    files_linted: raw.results.length,
    fixable_error_count: raw.results.reduce(
      (sum, r) => sum + r.fixableErrorCount,
      0,
    ),
    fixable_warning_count: raw.results.reduce(
      (sum, r) => sum + r.fixableWarningCount,
      0,
    ),
    rules_violated_count: activeRuleIds.size,
    suppressed_count: raw.results.reduce(
      (sum, r) => sum + r.suppressedMessages.length,
      0,
    ),
    warning_count: raw.results.reduce((sum, r) => sum + r.warningCount, 0),
  };
};
