import type { FallowRunSummaryInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowDupesMetricsArgs = {
  readonly stats: NonNullable<FallowRaw['dupes']>['stats'];
};

/**
 * Run-level totals from the duplication section.
 *
 * The NOT NULL counts are schema-defaulted to 0 whenever the section itself
 * is present, so they only need a fallback when the whole section is absent —
 * which is what the early return expresses.
 */
export const extractFallowDupesMetrics = ({
  stats,
}: ExtractFallowDupesMetricsArgs): Pick<
  FallowRunSummaryInput,
  | 'clone_group_count'
  | 'clone_instance_count'
  | 'dupes_duplicated_lines'
  | 'dupes_duplicated_tokens'
  | 'dupes_files_with_clones'
  | 'dupes_total_files'
  | 'dupes_total_lines'
  | 'dupes_total_tokens'
  | 'duplication_percentage'
> => {
  if (stats === undefined || stats === null) {
    return { clone_group_count: 0, clone_instance_count: 0 };
  }

  return {
    clone_group_count: stats.clone_groups,
    clone_instance_count: stats.clone_instances,
    dupes_duplicated_lines: stats.duplicated_lines ?? undefined,
    dupes_duplicated_tokens: stats.duplicated_tokens ?? undefined,
    dupes_files_with_clones: stats.files_with_clones ?? undefined,
    dupes_total_files: stats.total_files ?? undefined,
    dupes_total_lines: stats.total_lines ?? undefined,
    dupes_total_tokens: stats.total_tokens ?? undefined,
    duplication_percentage: stats.duplication_percentage ?? undefined,
  };
};
