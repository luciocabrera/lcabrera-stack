import type { FallowRaw } from './fallowRaw.schema.ts';

import { type FallowRunSummaryInput } from './fallowDetail.types.ts';

type ExtractFallowRunSummaryArgs = {
  readonly raw: FallowRaw;
};

/**
 * The cqms.fallow_runs master row (1:1 with the scan, ADR-019 addendum) —
 * the wide run-level metrics row assembled from every section of the
 * combined fallow output. NOT NULL columns are always emitted (with 0
 * fallbacks) because jsonb_to_record never applies column DEFAULTs; the
 * nullable ones fall back to undefined, which JSON.stringify drops and
 * Postgres reads as SQL NULL.
 */
export const extractFallowRunSummary = ({
  raw,
}: ExtractFallowRunSummaryArgs): FallowRunSummaryInput => {
  const summary = raw.health?.summary;
  const vitalSigns = raw.health?.vital_signs;
  const counts = vitalSigns?.counts;
  const dupesStats = raw.dupes?.stats;

  return {
    analysis_run_id: raw._meta?.telemetry?.analysis_run_id ?? undefined,
    average_maintainability: summary?.average_maintainability ?? undefined,
    avg_cyclomatic: vitalSigns?.avg_cyclomatic ?? undefined,
    check_summary: raw.check?.summary ?? undefined,
    check_total_issues: raw.check?.total_issues ?? 0,
    circular_dep_count: vitalSigns?.circular_dep_count ?? undefined,
    circular_deps_per_k_files:
      vitalSigns?.circular_deps_per_k_files ?? undefined,
    clone_group_count: dupesStats?.clone_groups ?? 0,
    clone_instance_count: dupesStats?.clone_instances ?? 0,
    coupling_high_pct: vitalSigns?.coupling_high_pct ?? undefined,
    coverage_model: summary?.coverage_model ?? undefined,
    coverage_source_consistency:
      summary?.coverage_source_consistency ?? undefined,
    critical_complexity_pct: vitalSigns?.critical_complexity_pct ?? undefined,
    dead_export_pct: vitalSigns?.dead_export_pct ?? undefined,
    dead_exports: counts?.dead_exports ?? undefined,
    dead_file_pct: vitalSigns?.dead_file_pct ?? undefined,
    dead_files: counts?.dead_files ?? undefined,
    duplication_percentage: dupesStats?.duplication_percentage ?? undefined,
    dupes_duplicated_lines: dupesStats?.duplicated_lines ?? undefined,
    dupes_duplicated_tokens: dupesStats?.duplicated_tokens ?? undefined,
    dupes_files_with_clones: dupesStats?.files_with_clones ?? undefined,
    dupes_total_files: dupesStats?.total_files ?? undefined,
    dupes_total_lines: dupesStats?.total_lines ?? undefined,
    dupes_total_tokens: dupesStats?.total_tokens ?? undefined,
    elapsed_ms: raw.elapsed_ms ?? undefined,
    entry_points: raw.check?.entry_points ?? undefined,
    fallow_version: raw.version ?? undefined,
    files_analyzed: summary?.files_analyzed ?? 0,
    files_scored: summary?.files_scored ?? 0,
    framework_health: raw.health?.framework_health ?? undefined,
    functions_above_threshold: summary?.functions_above_threshold ?? 0,
    functions_analyzed: summary?.functions_analyzed ?? 0,
    functions_over_60_loc_per_k:
      vitalSigns?.functions_over_60_loc_per_k ?? undefined,
    health_formula_version: raw.health_score?.formula_version ?? undefined,
    health_grade: raw.health_score?.grade ?? undefined,
    health_penalties: raw.health_score?.penalties ?? undefined,
    health_score: raw.health_score?.score ?? undefined,
    hotspot_count: vitalSigns?.hotspot_count ?? undefined,
    hotspot_summary: raw.health?.hotspot_summary ?? undefined,
    hotspot_top_pct_count: vitalSigns?.hotspot_top_pct_count ?? undefined,
    maintainability_avg: vitalSigns?.maintainability_avg ?? undefined,
    maintainability_low_pct: vitalSigns?.maintainability_low_pct ?? undefined,
    max_cognitive_threshold: summary?.max_cognitive_threshold ?? undefined,
    max_crap_threshold: summary?.max_crap_threshold ?? undefined,
    max_cyclomatic_threshold: summary?.max_cyclomatic_threshold ?? undefined,
    max_render_fan_in: vitalSigns?.max_render_fan_in ?? undefined,
    p90_cyclomatic: vitalSigns?.p90_cyclomatic ?? undefined,
    p95_fan_in: vitalSigns?.p95_fan_in ?? undefined,
    p95_render_fan_in: vitalSigns?.p95_render_fan_in ?? undefined,
    raw_kind: raw.kind ?? undefined,
    raw_schema_version: raw.schema_version ?? undefined,
    render_fan_in_high_pct: vitalSigns?.render_fan_in_high_pct ?? undefined,
    severity_critical_count: summary?.severity_critical_count ?? 0,
    severity_high_count: summary?.severity_high_count ?? 0,
    severity_moderate_count: summary?.severity_moderate_count ?? 0,
    target_thresholds: raw.health?.target_thresholds ?? undefined,
    top_render_fan_in: vitalSigns?.top_render_fan_in ?? undefined,
    total_deps: counts?.total_deps ?? undefined,
    total_exports: counts?.total_exports ?? undefined,
    total_files: counts?.total_files ?? undefined,
    total_lines: counts?.total_lines ?? undefined,
    total_loc: vitalSigns?.total_loc ?? undefined,
    unit_interfacing_profile: vitalSigns?.unit_interfacing_profile ?? undefined,
    unit_size_profile: vitalSigns?.unit_size_profile ?? undefined,
    unused_dep_count: vitalSigns?.unused_dep_count ?? undefined,
    unused_deps_per_k_files: vitalSigns?.unused_deps_per_k_files ?? undefined,
  };
};
