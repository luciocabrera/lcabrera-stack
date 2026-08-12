import type { FallowRunSummaryInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowCodeHealthSignalsArgs = {
  readonly vitalSigns: NonNullable<FallowRaw['health']>['vital_signs'];
};

/**
 * The vital signs describing the code itself — complexity, unit size,
 * maintainability and hotspots. Its sibling extractFallowGraphSignals covers
 * the same section's dependency-graph half; the two are split because
 * `vital_signs` is one wide object that reads as two unrelated stories.
 */
export const extractFallowCodeHealthSignals = ({
  vitalSigns,
}: ExtractFallowCodeHealthSignalsArgs): Pick<
  FallowRunSummaryInput,
  | 'avg_cyclomatic'
  | 'critical_complexity_pct'
  | 'functions_over_60_loc_per_k'
  | 'hotspot_count'
  | 'hotspot_top_pct_count'
  | 'maintainability_avg'
  | 'maintainability_low_pct'
  | 'p90_cyclomatic'
  | 'total_loc'
  | 'unit_interfacing_profile'
  | 'unit_size_profile'
> => {
  if (vitalSigns === undefined || vitalSigns === null) {
    return {};
  }

  return {
    avg_cyclomatic: vitalSigns.avg_cyclomatic ?? undefined,
    critical_complexity_pct: vitalSigns.critical_complexity_pct ?? undefined,
    functions_over_60_loc_per_k:
      vitalSigns.functions_over_60_loc_per_k ?? undefined,
    hotspot_count: vitalSigns.hotspot_count ?? undefined,
    hotspot_top_pct_count: vitalSigns.hotspot_top_pct_count ?? undefined,
    maintainability_avg: vitalSigns.maintainability_avg ?? undefined,
    maintainability_low_pct: vitalSigns.maintainability_low_pct ?? undefined,
    p90_cyclomatic: vitalSigns.p90_cyclomatic ?? undefined,
    total_loc: vitalSigns.total_loc ?? undefined,
    unit_interfacing_profile: vitalSigns.unit_interfacing_profile ?? undefined,
    unit_size_profile: vitalSigns.unit_size_profile ?? undefined,
  };
};
