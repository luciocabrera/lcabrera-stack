import type { FallowRunSummaryInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowCheckMetricsArgs = {
  readonly check: FallowRaw['check'];
};

/** Run-level totals from the dead-code (`check`) section. */
export const extractFallowCheckMetrics = ({
  check,
}: ExtractFallowCheckMetricsArgs): Pick<
  FallowRunSummaryInput,
  'check_summary' | 'check_total_issues' | 'entry_points'
> => ({
  check_summary: check?.summary ?? undefined,
  check_total_issues: check?.total_issues ?? 0,
  entry_points: check?.entry_points ?? undefined,
});
