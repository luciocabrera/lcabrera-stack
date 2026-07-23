import { describe, expect, it } from 'vite-plus/test';

import { extractFallowFileScores } from './extractFallowFileScores.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowFileScores', () => {
  it('maps health.file_scores to fallow_file_scores rows', () => {
    const raw = fallowRawSchema.parse({
      health: {
        file_scores: [
          {
            complexity_density: 0.19,
            crap_above_threshold: 3,
            crap_max: 702,
            dead_code_ratio: 0,
            fan_in: 2,
            fan_out: 5,
            function_count: 10,
            lines: 253,
            maintainability_index: 94.3,
            path: 'scripts/report.cjs',
            total_cognitive: 33,
            total_cyclomatic: 49,
          },
        ],
      },
    });

    expect(extractFallowFileScores({ raw })).toEqual([
      {
        complexity_density: 0.19,
        crap_above_threshold: 3,
        crap_max: 702,
        dead_code_ratio: 0,
        fan_in: 2,
        fan_out: 5,
        file_path: 'scripts/report.cjs',
        function_count: 10,
        lines: 253,
        maintainability_index: 94.3,
        total_cognitive: 33,
        total_cyclomatic: 49,
      },
    ]);
  });

  it('always emits the NOT NULL fan_in/fan_out (jsonb_to_recordset applies no defaults)', () => {
    const raw = fallowRawSchema.parse({
      health: { file_scores: [{ path: 'src/a.ts' }] },
    });

    expect(extractFallowFileScores({ raw })[0]).toMatchObject({
      fan_in: 0,
      fan_out: 0,
      file_path: 'src/a.ts',
    });
  });

  it('returns [] when the health section is missing', () => {
    expect(extractFallowFileScores({ raw: fallowRawSchema.parse({}) })).toEqual(
      [],
    );
  });
});
