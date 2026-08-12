import type { FallowRunSummaryInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowHealthSectionMetricsArgs = {
  readonly health: FallowRaw['health'];
};

/**
 * The health section's own opaque jsonb blobs — the ones that hang directly
 * off `health` rather than off its `summary` or `vital_signs` sub-objects.
 */
export const extractFallowHealthSectionMetrics = ({
  health,
}: ExtractFallowHealthSectionMetricsArgs): Pick<
  FallowRunSummaryInput,
  'framework_health' | 'hotspot_summary' | 'target_thresholds'
> => ({
  framework_health: health?.framework_health ?? undefined,
  hotspot_summary: health?.hotspot_summary ?? undefined,
  target_thresholds: health?.target_thresholds ?? undefined,
});
