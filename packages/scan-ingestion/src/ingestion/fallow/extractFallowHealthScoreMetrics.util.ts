import type { FallowRunSummaryInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowHealthScoreMetricsArgs = {
  readonly healthScore: FallowRaw['health_score'];
};

/**
 * The standalone `fallow health` score block. Combined runs omit it
 * entirely, so every field here stays undefined for them.
 */
export const extractFallowHealthScoreMetrics = ({
  healthScore,
}: ExtractFallowHealthScoreMetricsArgs): Pick<
  FallowRunSummaryInput,
  | 'health_formula_version'
  | 'health_grade'
  | 'health_penalties'
  | 'health_score'
> => ({
  health_formula_version: healthScore?.formula_version ?? undefined,
  health_grade: healthScore?.grade ?? undefined,
  health_penalties: healthScore?.penalties ?? undefined,
  health_score: healthScore?.score ?? undefined,
});
