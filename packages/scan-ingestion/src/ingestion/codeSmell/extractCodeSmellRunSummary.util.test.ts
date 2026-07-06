import { describe, expect, it } from 'vitest';

import { reportSchema } from '../report.schema.ts';
import { extractCodeSmellRunSummary } from './extractCodeSmellRunSummary.util.ts';

const makeFinding = (overrides: Readonly<Record<string, unknown>>) => ({
  confidence: 'high',
  finding_id: 'F-001',
  fix: 'Fix it.',
  location_path: 'src/a.ts',
  rule_id: 'CC.G5',
  severity: 'HIGH',
  why: 'Because.',
  ...overrides,
});

describe('extractCodeSmellRunSummary', () => {
  it('derives every rollup from the findings array, identity from metadata', () => {
    const report = reportSchema.parse({
      blocker_count: 99, // deliberately wrong claim — master derives from findings
      files_analyzed: 42,
      findings: [
        makeFinding({ effort: 'small', finding_id: 'F-001' }),
        makeFinding({
          confidence: 'medium',
          effort: 'large',
          finding_id: 'F-002',
          rule_id: 'CC.G7',
          severity: 'BLOCKER',
        }),
        makeFinding({
          confidence: 'low',
          finding_id: 'F-003',
          rule_id: 'CC.G5',
          severity: 'NIT',
        }),
      ],
      generated_at: '2026-07-07T00:00:00.000Z',
      report_id: 'code-smell-checker-2026-07-07',
      top_risk: 'Deep nesting in the order flow.',
    });

    expect(extractCodeSmellRunSummary({ report })).toEqual({
      blocker_count: 1,
      confidence_high_count: 1,
      confidence_low_count: 1,
      confidence_medium_count: 1,
      effort_large_count: 1,
      effort_medium_count: 0,
      effort_small_count: 1,
      files_analyzed: 42,
      finding_count: 3,
      generated_at: '2026-07-07T00:00:00.000Z',
      high_count: 1,
      low_count: 0,
      medium_count: 0,
      nit_count: 1,
      report_id: 'code-smell-checker-2026-07-07',
      rules_flagged_count: 2,
      top_risk: 'Deep nesting in the order flow.',
    });
  });

  it('zeroes every NOT NULL count for an empty report', () => {
    const report = reportSchema.parse({
      generated_at: '2026-07-07T00:00:00.000Z',
      report_id: 'code-smell-zen-empty',
    });

    const summary = extractCodeSmellRunSummary({ report });

    expect(summary).toMatchObject({
      blocker_count: 0,
      confidence_high_count: 0,
      effort_small_count: 0,
      files_analyzed: 0,
      finding_count: 0,
      rules_flagged_count: 0,
    });
    expect(summary.top_risk).toBeUndefined();
  });
});
