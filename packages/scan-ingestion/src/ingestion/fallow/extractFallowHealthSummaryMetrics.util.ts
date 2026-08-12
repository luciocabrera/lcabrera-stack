import type { FallowRunSummaryInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowHealthSummaryMetricsArgs = {
  readonly summary: NonNullable<FallowRaw['health']>['summary'];
};

/**
 * Counts and thresholds from `health.summary`.
 *
 * The NOT NULL counts are schema-defaulted to 0 whenever the section is
 * present, so they read straight through; the early return is the only place
 * a fallback is needed, and it is also what documents the zeroed baseline a
 * degraded run stores.
 */
export const extractFallowHealthSummaryMetrics = ({
  summary,
}: ExtractFallowHealthSummaryMetricsArgs): Pick<
  FallowRunSummaryInput,
  | 'average_maintainability'
  | 'coverage_model'
  | 'coverage_source_consistency'
  | 'files_analyzed'
  | 'files_scored'
  | 'functions_above_threshold'
  | 'functions_analyzed'
  | 'max_cognitive_threshold'
  | 'max_crap_threshold'
  | 'max_cyclomatic_threshold'
  | 'severity_critical_count'
  | 'severity_high_count'
  | 'severity_moderate_count'
> => {
  if (summary === undefined || summary === null) {
    return {
      files_analyzed: 0,
      files_scored: 0,
      functions_above_threshold: 0,
      functions_analyzed: 0,
      severity_critical_count: 0,
      severity_high_count: 0,
      severity_moderate_count: 0,
    };
  }

  return {
    average_maintainability: summary.average_maintainability ?? undefined,
    coverage_model: summary.coverage_model ?? undefined,
    coverage_source_consistency:
      summary.coverage_source_consistency ?? undefined,
    files_analyzed: summary.files_analyzed,
    files_scored: summary.files_scored,
    functions_above_threshold: summary.functions_above_threshold,
    functions_analyzed: summary.functions_analyzed,
    max_cognitive_threshold: summary.max_cognitive_threshold ?? undefined,
    max_crap_threshold: summary.max_crap_threshold ?? undefined,
    max_cyclomatic_threshold: summary.max_cyclomatic_threshold ?? undefined,
    severity_critical_count: summary.severity_critical_count,
    severity_high_count: summary.severity_high_count,
    severity_moderate_count: summary.severity_moderate_count,
  };
};
