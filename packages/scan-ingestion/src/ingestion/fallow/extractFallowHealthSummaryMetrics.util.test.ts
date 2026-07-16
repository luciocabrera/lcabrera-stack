import { describe, expect, it } from 'vitest';

import { extractFallowHealthSummaryMetrics } from './extractFallowHealthSummaryMetrics.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowHealthSummaryMetrics', () => {
  it('reads every count and threshold', () => {
    const { health } = fallowRawSchema.parse({
      health: {
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
      },
    });

    expect(
      extractFallowHealthSummaryMetrics({ summary: health?.summary }),
    ).toEqual({
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
    });
  });

  it('returns the zeroed NOT NULL baseline when the summary is absent', () => {
    expect(extractFallowHealthSummaryMetrics({ summary: undefined })).toEqual({
      files_analyzed: 0,
      files_scored: 0,
      functions_above_threshold: 0,
      functions_analyzed: 0,
      severity_critical_count: 0,
      severity_high_count: 0,
      severity_moderate_count: 0,
    });
  });

  it('keeps schema-defaulted counts at 0 and nullable thresholds undefined for an empty summary', () => {
    const { health } = fallowRawSchema.parse({ health: { summary: {} } });

    const metrics = extractFallowHealthSummaryMetrics({
      summary: health?.summary,
    });

    expect(metrics.files_analyzed).toBe(0);
    expect(metrics.severity_critical_count).toBe(0);
    expect(metrics.average_maintainability).toBeUndefined();
    expect(metrics.max_crap_threshold).toBeUndefined();
  });
});
