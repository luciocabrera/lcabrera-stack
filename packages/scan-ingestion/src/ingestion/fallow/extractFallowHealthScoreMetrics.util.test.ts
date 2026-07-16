import { describe, expect, it } from 'vitest';

import { extractFallowHealthScoreMetrics } from './extractFallowHealthScoreMetrics.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowHealthScoreMetrics', () => {
  it('reads the standalone health-score block', () => {
    const raw = fallowRawSchema.parse({
      health_score: {
        formula_version: 2,
        grade: 'B',
        penalties: { hotspots: 10 },
        score: 77.5,
      },
    });

    expect(
      extractFallowHealthScoreMetrics({ healthScore: raw.health_score }),
    ).toEqual({
      health_formula_version: 2,
      health_grade: 'B',
      health_penalties: { hotspots: 10 },
      health_score: 77.5,
    });
  });

  it('leaves every field undefined for a combined run, which omits the block', () => {
    expect(extractFallowHealthScoreMetrics({ healthScore: undefined })).toEqual(
      {
        health_formula_version: undefined,
        health_grade: undefined,
        health_penalties: undefined,
        health_score: undefined,
      },
    );
  });
});
