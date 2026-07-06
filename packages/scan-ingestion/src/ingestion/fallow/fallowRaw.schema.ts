import { z } from 'zod';

/**
 * Loose parse of fallow.raw.json — the combined-run output of
 * `fallow --format json` (kind 'combined', check/dupes/health sections).
 * Every field is defaulted or nullish so a future fallow version's shape
 * drift degrades to partial extraction instead of throwing — detail
 * extraction must never flip an already-succeeded scan to failed (ADR-019).
 * Whole sections are nullish (a degraded run may omit them); the
 * extractors handle the absence defensively.
 */
const jsonObjectSchema = z.record(z.string(), z.unknown());

const fallowActionListSchema = z.array(z.unknown()).default([]);

export const fallowUnusedFileSchema = z.object({
  actions: fallowActionListSchema,
  path: z.string().default(''),
});

export const fallowUnusedExportSchema = z.object({
  actions: fallowActionListSchema,
  col: z.number().nullish(),
  export_name: z.string().nullish(),
  is_re_export: z.boolean().nullish(),
  is_type_only: z.boolean().nullish(),
  line: z.number().nullish(),
  path: z.string().default(''),
});

export const fallowUnusedDependencySchema = z.object({
  actions: fallowActionListSchema,
  line: z.number().nullish(),
  location: z.string().nullish(),
  package_name: z.string().default(''),
  path: z.string().nullish(),
  used_in_workspaces: z.array(z.string()).nullish(),
});

const fallowImportSiteSchema = z.object({
  col: z.number().nullish(),
  line: z.number().nullish(),
  path: z.string().default(''),
});

export const fallowUnlistedDependencySchema = z.object({
  actions: fallowActionListSchema,
  imported_from: z.array(fallowImportSiteSchema).default([]),
  package_name: z.string().default(''),
});

// Shape unverified against real output (the section was empty in every
// sampled run) — kept minimal and fully nullish on purpose.
export const fallowUnresolvedImportSchema = z.object({
  actions: fallowActionListSchema,
  col: z.number().nullish(),
  line: z.number().nullish(),
  path: z.string().nullish(),
  specifier: z.string().nullish(),
});

export const fallowCircularDependencySchema = z.object({
  col: z.number().nullish(),
  edges: z.array(z.unknown()).nullish(),
  files: z.array(z.string()).default([]),
  length: z.number().nullish(),
  line: z.number().nullish(),
});

const fallowCheckSchema = z.object({
  circular_dependencies: z.array(fallowCircularDependencySchema).default([]),
  entry_points: jsonObjectSchema.nullish(),
  summary: jsonObjectSchema.nullish(),
  total_issues: z.number().default(0),
  unlisted_dependencies: z.array(fallowUnlistedDependencySchema).default([]),
  unresolved_imports: z.array(fallowUnresolvedImportSchema).default([]),
  unused_dependencies: z.array(fallowUnusedDependencySchema).default([]),
  unused_dev_dependencies: z.array(fallowUnusedDependencySchema).default([]),
  unused_exports: z.array(fallowUnusedExportSchema).default([]),
  unused_files: z.array(fallowUnusedFileSchema).default([]),
  unused_optional_dependencies: z
    .array(fallowUnusedDependencySchema)
    .default([]),
  unused_types: z.array(fallowUnusedExportSchema).default([]),
});

export const fallowCloneInstanceSchema = z.object({
  end_col: z.number().nullish(),
  end_line: z.number().nullish(),
  file: z.string().default(''),
  fragment: z.string().nullish(),
  start_col: z.number().nullish(),
  start_line: z.number().nullish(),
});

export const fallowCloneGroupSchema = z.object({
  fingerprint: z.string().nullish(),
  instances: z.array(fallowCloneInstanceSchema).default([]),
  line_count: z.number().nullish(),
  suggested_name: z.string().nullish(),
  token_count: z.number().nullish(),
});

const fallowDupesStatsSchema = z.object({
  clone_groups: z.number().default(0),
  clone_instances: z.number().default(0),
  duplicated_lines: z.number().nullish(),
  duplicated_tokens: z.number().nullish(),
  duplication_percentage: z.number().nullish(),
  files_with_clones: z.number().nullish(),
  total_files: z.number().nullish(),
  total_lines: z.number().nullish(),
  total_tokens: z.number().nullish(),
});

const fallowDupesSchema = z.object({
  clone_groups: z.array(fallowCloneGroupSchema).default([]),
  stats: fallowDupesStatsSchema.nullish(),
});

export const fallowFunctionFindingSchema = z.object({
  cognitive: z.number().nullish(),
  col: z.number().nullish(),
  coverage_source: z.string().nullish(),
  coverage_tier: z.string().nullish(),
  crap: z.number().nullish(),
  cyclomatic: z.number().nullish(),
  exceeded: z.string().nullish(),
  line: z.number().nullish(),
  line_count: z.number().nullish(),
  name: z.string().nullish(),
  param_count: z.number().nullish(),
  path: z.string().default(''),
  severity: z.string().nullish(),
});

export const fallowFileScoreSchema = z.object({
  complexity_density: z.number().nullish(),
  crap_above_threshold: z.number().nullish(),
  crap_max: z.number().nullish(),
  dead_code_ratio: z.number().nullish(),
  fan_in: z.number().default(0),
  fan_out: z.number().default(0),
  function_count: z.number().nullish(),
  lines: z.number().nullish(),
  maintainability_index: z.number().nullish(),
  path: z.string().default(''),
  total_cognitive: z.number().nullish(),
  total_cyclomatic: z.number().nullish(),
});

export const fallowHotspotSchema = z.object({
  commits: z.number().nullish(),
  complexity_density: z.number().nullish(),
  fan_in: z.number().nullish(),
  lines_added: z.number().nullish(),
  lines_deleted: z.number().nullish(),
  path: z.string().default(''),
  score: z.number().nullish(),
  trend: z.string().nullish(),
  weighted_commits: z.number().nullish(),
});

export const fallowLargeFunctionSchema = z.object({
  line: z.number().nullish(),
  line_count: z.number().default(0),
  name: z.string().nullish(),
  path: z.string().default(''),
});

export const fallowTargetSchema = z.object({
  category: z.string().nullish(),
  confidence: z.string().nullish(),
  efficiency: z.number().nullish(),
  effort: z.string().nullish(),
  evidence: z.unknown().nullish(),
  factors: z.unknown().nullish(),
  path: z.string().default(''),
  priority: z.number().nullish(),
  recommendation: z.string().nullish(),
});

const fallowHealthSummarySchema = z.object({
  average_maintainability: z.number().nullish(),
  coverage_model: z.string().nullish(),
  coverage_source_consistency: z.string().nullish(),
  files_analyzed: z.number().default(0),
  files_scored: z.number().default(0),
  functions_above_threshold: z.number().default(0),
  functions_analyzed: z.number().default(0),
  max_cognitive_threshold: z.number().nullish(),
  max_crap_threshold: z.number().nullish(),
  max_cyclomatic_threshold: z.number().nullish(),
  severity_critical_count: z.number().default(0),
  severity_high_count: z.number().default(0),
  severity_moderate_count: z.number().default(0),
});

const fallowVitalSignsSchema = z.object({
  avg_cyclomatic: z.number().nullish(),
  circular_dep_count: z.number().nullish(),
  circular_deps_per_k_files: z.number().nullish(),
  counts: z
    .object({
      dead_exports: z.number().nullish(),
      dead_files: z.number().nullish(),
      files_scored: z.number().nullish(),
      total_deps: z.number().nullish(),
      total_exports: z.number().nullish(),
      total_files: z.number().nullish(),
      total_lines: z.number().nullish(),
    })
    .nullish(),
  coupling_high_pct: z.number().nullish(),
  critical_complexity_pct: z.number().nullish(),
  dead_export_pct: z.number().nullish(),
  dead_file_pct: z.number().nullish(),
  functions_over_60_loc_per_k: z.number().nullish(),
  hotspot_count: z.number().nullish(),
  hotspot_top_pct_count: z.number().nullish(),
  maintainability_avg: z.number().nullish(),
  maintainability_low_pct: z.number().nullish(),
  max_render_fan_in: z.number().nullish(),
  p90_cyclomatic: z.number().nullish(),
  p95_fan_in: z.number().nullish(),
  p95_render_fan_in: z.number().nullish(),
  render_fan_in_high_pct: z.number().nullish(),
  top_render_fan_in: z.array(z.unknown()).nullish(),
  total_loc: z.number().nullish(),
  unit_interfacing_profile: jsonObjectSchema.nullish(),
  unit_size_profile: jsonObjectSchema.nullish(),
  unused_dep_count: z.number().nullish(),
  unused_deps_per_k_files: z.number().nullish(),
});

const fallowHealthSchema = z.object({
  file_scores: z.array(fallowFileScoreSchema).default([]),
  findings: z.array(fallowFunctionFindingSchema).default([]),
  framework_health: jsonObjectSchema.nullish(),
  hotspot_summary: jsonObjectSchema.nullish(),
  hotspots: z.array(fallowHotspotSchema).default([]),
  large_functions: z.array(fallowLargeFunctionSchema).default([]),
  summary: fallowHealthSummarySchema.nullish(),
  target_thresholds: jsonObjectSchema.nullish(),
  targets: z.array(fallowTargetSchema).default([]),
  vital_signs: fallowVitalSignsSchema.nullish(),
});

const fallowTelemetrySchema = z.object({
  analysis_run_id: z.string().nullish(),
});

export const fallowRawSchema = z.object({
  _meta: z.object({ telemetry: fallowTelemetrySchema.nullish() }).nullish(),
  check: fallowCheckSchema.nullish(),
  dupes: fallowDupesSchema.nullish(),
  elapsed_ms: z.number().nullish(),
  health: fallowHealthSchema.nullish(),
  // Standalone `fallow health` runs only — combined runs omit it entirely.
  health_score: z
    .object({
      formula_version: z.number().nullish(),
      grade: z.string().nullish(),
      penalties: jsonObjectSchema.nullish(),
      score: z.number().nullish(),
    })
    .nullish(),
  kind: z.string().nullish(),
  schema_version: z.number().nullish(),
  version: z.string().nullish(),
});

export type FallowCircularDependency = z.infer<
  typeof fallowCircularDependencySchema
>;
export type FallowCloneGroup = z.infer<typeof fallowCloneGroupSchema>;
export type FallowFileScore = z.infer<typeof fallowFileScoreSchema>;
export type FallowFunctionFinding = z.infer<typeof fallowFunctionFindingSchema>;
export type FallowHotspot = z.infer<typeof fallowHotspotSchema>;
export type FallowLargeFunction = z.infer<typeof fallowLargeFunctionSchema>;
export type FallowRaw = z.infer<typeof fallowRawSchema>;
export type FallowTarget = z.infer<typeof fallowTargetSchema>;
