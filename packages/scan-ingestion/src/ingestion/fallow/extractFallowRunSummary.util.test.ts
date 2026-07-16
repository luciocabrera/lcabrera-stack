import { describe, expect, it } from 'vitest';

import { extractFallowRunSummary } from './extractFallowRunSummary.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowRunSummary', () => {
  it('assembles the wide master row from every section of a combined run', () => {
    const raw = fallowRawSchema.parse({
      _meta: { telemetry: { analysis_run_id: 'run-abc' } },
      check: {
        entry_points: { sources: { plugin: 544 }, total: 610 },
        summary: { unused_files: 9 },
        total_issues: 83,
      },
      dupes: {
        clone_groups: [],
        stats: {
          clone_groups: 18,
          clone_instances: 40,
          duplicated_lines: 500,
          duplicated_tokens: 4000,
          duplication_percentage: 1.2,
          files_with_clones: 30,
          total_files: 1900,
          total_lines: 80_000,
          total_tokens: 600_000,
        },
      },
      elapsed_ms: 4200,
      health: {
        framework_health: { detected_frameworks: ['react'] },
        hotspot_summary: { min_commits: 3, since: '6 months' },
        summary: {
          average_maintainability: 93.2,
          coverage_model: 'static_estimated',
          coverage_source_consistency: 'uniform',
          files_analyzed: 1937,
          files_scored: 1244,
          functions_above_threshold: 57,
          functions_analyzed: 5493,
          max_cognitive_threshold: 15,
          max_crap_threshold: 30,
          max_cyclomatic_threshold: 20,
          severity_critical_count: 7,
          severity_high_count: 6,
          severity_moderate_count: 44,
        },
        target_thresholds: { fan_in_p95: 5 },
        vital_signs: {
          avg_cyclomatic: 1.8,
          counts: {
            dead_exports: 68,
            dead_files: 9,
            total_deps: 0,
            total_exports: 2399,
            total_files: 1937,
            total_lines: 81_053,
          },
          dead_export_pct: 2.8,
          dead_file_pct: 0.5,
          hotspot_count: 159,
          maintainability_avg: 93.2,
          top_render_fan_in: [{ component: 'FormFieldChrome' }],
          total_loc: 81_053,
          unit_interfacing_profile: { low_risk: 99.7 },
          unit_size_profile: { low_risk: 73.2 },
        },
      },
      kind: 'combined',
      schema_version: 7,
      version: '3.0.0',
    });

    const summary = extractFallowRunSummary({ raw });

    expect(summary).toMatchObject({
      analysis_run_id: 'run-abc',
      average_maintainability: 93.2,
      check_summary: { unused_files: 9 },
      check_total_issues: 83,
      clone_group_count: 18,
      clone_instance_count: 40,
      dead_exports: 68,
      dupes_total_files: 1900,
      elapsed_ms: 4200,
      fallow_version: '3.0.0',
      files_analyzed: 1937,
      functions_above_threshold: 57,
      hotspot_count: 159,
      raw_kind: 'combined',
      raw_schema_version: 7,
      severity_critical_count: 7,
      total_loc: 81_053,
      unit_size_profile: { low_risk: 73.2 },
    });
    // Absent from combined runs — must be undefined so JSON.stringify drops
    // the keys and Postgres stores NULL.
    expect(summary.health_score).toBeUndefined();
    expect(summary.health_grade).toBeUndefined();
  });

  it('extracts the standalone health_score block when present', () => {
    const raw = fallowRawSchema.parse({
      health_score: {
        formula_version: 2,
        grade: 'B',
        penalties: { hotspots: 10 },
        score: 77.5,
      },
      kind: 'health',
    });

    const summary = extractFallowRunSummary({ raw });

    expect(summary).toMatchObject({
      health_formula_version: 2,
      health_grade: 'B',
      health_penalties: { hotspots: 10 },
      health_score: 77.5,
    });
  });

  it('degrades an empty/unknown shape to a zeroed NOT NULL baseline', () => {
    const summary = extractFallowRunSummary({
      raw: fallowRawSchema.parse({}),
    });

    expect(summary).toMatchObject({
      check_total_issues: 0,
      clone_group_count: 0,
      clone_instance_count: 0,
      files_analyzed: 0,
      files_scored: 0,
      functions_above_threshold: 0,
      functions_analyzed: 0,
      severity_critical_count: 0,
      severity_high_count: 0,
      severity_moderate_count: 0,
    });
  });
});
