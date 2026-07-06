/**
 * Row shapes for sp_ingest_fallow_detail's jsonb_to_record(set) calls
 * (ADR-019 addendum, Step 4). Optional keys are simply omitted —
 * JSON.stringify drops undefined and jsonb_to_record(set) yields SQL NULL
 * for absent keys, which is exactly right for the nullable columns. NOT
 * NULL columns are always emitted explicitly because jsonb_to_record(set)
 * never applies column DEFAULTs (the documented ARCHITECTURE.md footgun).
 *
 * File paths are stored exactly as fallow reports them — relative to the
 * scanned repo's git root, which equals project-root-relative for
 * root-registered projects (the canonical registration model).
 */
export type FallowRunSummaryInput = {
  readonly analysis_run_id?: string;
  readonly average_maintainability?: number;
  readonly avg_cyclomatic?: number;
  readonly check_summary?: Readonly<Record<string, unknown>>;
  readonly check_total_issues: number;
  readonly circular_dep_count?: number;
  readonly circular_deps_per_k_files?: number;
  readonly clone_group_count: number;
  readonly clone_instance_count: number;
  readonly coupling_high_pct?: number;
  readonly coverage_model?: string;
  readonly coverage_source_consistency?: string;
  readonly critical_complexity_pct?: number;
  readonly dead_export_pct?: number;
  readonly dead_exports?: number;
  readonly dead_file_pct?: number;
  readonly dead_files?: number;
  readonly duplication_percentage?: number;
  readonly dupes_duplicated_lines?: number;
  readonly dupes_duplicated_tokens?: number;
  readonly dupes_files_with_clones?: number;
  readonly dupes_total_files?: number;
  readonly dupes_total_lines?: number;
  readonly dupes_total_tokens?: number;
  readonly elapsed_ms?: number;
  readonly entry_points?: Readonly<Record<string, unknown>>;
  readonly fallow_version?: string;
  readonly files_analyzed: number;
  readonly files_scored: number;
  readonly framework_health?: Readonly<Record<string, unknown>>;
  readonly functions_above_threshold: number;
  readonly functions_analyzed: number;
  readonly functions_over_60_loc_per_k?: number;
  readonly health_formula_version?: number;
  readonly health_grade?: string;
  readonly health_penalties?: Readonly<Record<string, unknown>>;
  readonly health_score?: number;
  readonly hotspot_count?: number;
  readonly hotspot_summary?: Readonly<Record<string, unknown>>;
  readonly hotspot_top_pct_count?: number;
  readonly maintainability_avg?: number;
  readonly maintainability_low_pct?: number;
  readonly max_cognitive_threshold?: number;
  readonly max_crap_threshold?: number;
  readonly max_cyclomatic_threshold?: number;
  readonly max_render_fan_in?: number;
  readonly p90_cyclomatic?: number;
  readonly p95_fan_in?: number;
  readonly p95_render_fan_in?: number;
  readonly raw_kind?: string;
  readonly raw_schema_version?: number;
  readonly render_fan_in_high_pct?: number;
  readonly severity_critical_count: number;
  readonly severity_high_count: number;
  readonly severity_moderate_count: number;
  readonly target_thresholds?: Readonly<Record<string, unknown>>;
  readonly top_render_fan_in?: readonly unknown[];
  readonly total_deps?: number;
  readonly total_exports?: number;
  readonly total_files?: number;
  readonly total_lines?: number;
  readonly total_loc?: number;
  readonly unit_interfacing_profile?: Readonly<Record<string, unknown>>;
  readonly unit_size_profile?: Readonly<Record<string, unknown>>;
  readonly unused_dep_count?: number;
  readonly unused_deps_per_k_files?: number;
};

export type FallowFileScoreInput = {
  readonly complexity_density?: number;
  readonly crap_above_threshold?: number;
  readonly crap_max?: number;
  readonly dead_code_ratio?: number;
  readonly fan_in: number;
  readonly fan_out: number;
  readonly file_path: string;
  readonly function_count?: number;
  readonly lines?: number;
  readonly maintainability_index?: number;
  readonly total_cognitive?: number;
  readonly total_cyclomatic?: number;
};

export type FallowHotspotInput = {
  readonly commits?: number;
  readonly complexity_density?: number;
  readonly fan_in?: number;
  readonly file_path: string;
  readonly lines_added?: number;
  readonly lines_deleted?: number;
  readonly score?: number;
  readonly trend?: string;
  readonly weighted_commits?: number;
};

export type FallowCloneInstanceInput = {
  readonly end_col?: number;
  readonly end_line?: number;
  readonly file_path: string;
  readonly fragment?: string;
  readonly start_col?: number;
  readonly start_line?: number;
};

export type FallowCloneGroupInput = {
  readonly fingerprint?: string;
  readonly instances: readonly FallowCloneInstanceInput[];
  readonly line_count: number;
  readonly suggested_name?: string;
  readonly token_count: number;
};

export type FallowDeadCodeCategory =
  | 'unlisted_dependency'
  | 'unresolved_import'
  | 'unused_dependency'
  | 'unused_export'
  | 'unused_file'
  | 'unused_type';

export type FallowDeadCodeInput = {
  readonly category: FallowDeadCodeCategory;
  readonly col?: number;
  readonly dependency_location?: string;
  readonly detail?: Readonly<Record<string, unknown>>;
  readonly export_name?: string;
  readonly file_path?: string;
  readonly is_re_export?: boolean;
  readonly is_type_only?: boolean;
  readonly line?: number;
  readonly package_name?: string;
};

export type FallowCircularDependencyInput = {
  readonly col?: number;
  readonly cycle_length: number;
  readonly edges?: readonly unknown[];
  readonly entry_file_path?: string;
  readonly files: readonly string[];
  readonly line?: number;
};

export type FallowLargeFunctionInput = {
  readonly file_path: string;
  readonly function_name?: string;
  readonly line?: number;
  readonly line_count: number;
};

export type FallowTargetInput = {
  readonly category?: string;
  readonly confidence?: string;
  readonly effort?: string;
  readonly efficiency?: number;
  readonly evidence?: unknown;
  readonly factors?: unknown;
  readonly file_path: string;
  readonly priority?: number;
  readonly recommendation?: string;
};

export type FallowFunctionFindingInput = {
  readonly cognitive?: number;
  readonly col?: number;
  readonly coverage_source?: string;
  readonly coverage_tier?: string;
  readonly crap?: number;
  readonly cyclomatic?: number;
  readonly exceeded?: string;
  readonly file_path: string;
  readonly function_name?: string;
  readonly line?: number;
  readonly line_count?: number;
  readonly param_count?: number;
  readonly severity?: string;
};

/** The p_detail jsonb passed to sp_ingest_fallow_detail. */
export type FallowDetailInput = {
  readonly circular_dependencies: readonly FallowCircularDependencyInput[];
  readonly clone_groups: readonly FallowCloneGroupInput[];
  readonly dead_code: readonly FallowDeadCodeInput[];
  readonly file_scores: readonly FallowFileScoreInput[];
  readonly function_findings: readonly FallowFunctionFindingInput[];
  readonly hotspots: readonly FallowHotspotInput[];
  readonly large_functions: readonly FallowLargeFunctionInput[];
  readonly targets: readonly FallowTargetInput[];
};
