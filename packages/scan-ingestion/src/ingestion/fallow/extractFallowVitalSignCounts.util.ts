import type { FallowRunSummaryInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowVitalSignCountsArgs = {
  readonly counts: NonNullable<
    NonNullable<FallowRaw['health']>['vital_signs']
  >['counts'];
};

/**
 * The raw totals behind the vital-sign percentages (`vital_signs.counts`) —
 * how many files, exports and dependencies the percentages were computed
 * from.
 */
export const extractFallowVitalSignCounts = ({
  counts,
}: ExtractFallowVitalSignCountsArgs): Pick<
  FallowRunSummaryInput,
  | 'dead_exports'
  | 'dead_files'
  | 'total_deps'
  | 'total_exports'
  | 'total_files'
  | 'total_lines'
> => {
  if (counts === undefined || counts === null) {
    return {};
  }

  return {
    dead_exports: counts.dead_exports ?? undefined,
    dead_files: counts.dead_files ?? undefined,
    total_deps: counts.total_deps ?? undefined,
    total_exports: counts.total_exports ?? undefined,
    total_files: counts.total_files ?? undefined,
    total_lines: counts.total_lines ?? undefined,
  };
};
