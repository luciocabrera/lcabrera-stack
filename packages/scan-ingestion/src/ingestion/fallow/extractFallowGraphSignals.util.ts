import type { FallowRunSummaryInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowGraphSignalsArgs = {
  readonly vitalSigns: NonNullable<FallowRaw['health']>['vital_signs'];
};

/**
 * The vital signs describing the import graph — coupling, render fan-in,
 * dead code, unused dependencies and cycles. Sibling of
 * extractFallowCodeHealthSignals, which covers the same section's
 * code-quality half.
 */
export const extractFallowGraphSignals = ({
  vitalSigns,
}: ExtractFallowGraphSignalsArgs): Pick<
  FallowRunSummaryInput,
  | 'circular_dep_count'
  | 'circular_deps_per_k_files'
  | 'coupling_high_pct'
  | 'dead_export_pct'
  | 'dead_file_pct'
  | 'max_render_fan_in'
  | 'p95_fan_in'
  | 'p95_render_fan_in'
  | 'render_fan_in_high_pct'
  | 'top_render_fan_in'
  | 'unused_dep_count'
  | 'unused_deps_per_k_files'
> => {
  if (vitalSigns === undefined || vitalSigns === null) {
    return {};
  }

  return {
    circular_dep_count: vitalSigns.circular_dep_count ?? undefined,
    circular_deps_per_k_files:
      vitalSigns.circular_deps_per_k_files ?? undefined,
    coupling_high_pct: vitalSigns.coupling_high_pct ?? undefined,
    dead_export_pct: vitalSigns.dead_export_pct ?? undefined,
    dead_file_pct: vitalSigns.dead_file_pct ?? undefined,
    max_render_fan_in: vitalSigns.max_render_fan_in ?? undefined,
    p95_fan_in: vitalSigns.p95_fan_in ?? undefined,
    p95_render_fan_in: vitalSigns.p95_render_fan_in ?? undefined,
    render_fan_in_high_pct: vitalSigns.render_fan_in_high_pct ?? undefined,
    top_render_fan_in: vitalSigns.top_render_fan_in ?? undefined,
    unused_dep_count: vitalSigns.unused_dep_count ?? undefined,
    unused_deps_per_k_files: vitalSigns.unused_deps_per_k_files ?? undefined,
  };
};
