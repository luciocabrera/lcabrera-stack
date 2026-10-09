import { describe, expect, it } from 'vite-plus/test';

import { judgeColumns } from './judgeColumns.util.ts';

describe('judgeColumns', () => {
  it("lifts a quality trial's judge model and dimension scores out of its detail", () => {
    expect(
      judgeColumns({
        dimensions: [
          { feedback: 'Plain.', name: 'clarity', score: 4 },
          { feedback: 'Thin.', name: 'completeness', score: 2 },
        ],
        judge_model: 'claude-opus-5-5',
        overall: 3,
        reply_sha256: 'a'.repeat(64),
        schema: 'quality/1',
        summary: 'Fine.',
      }),
    ).toEqual({
      dimensions: ['clarity', 'completeness'],
      judgeModel: 'claude-opus-5-5',
      scores: [4, 2],
    });
  });

  it('lifts nothing from a detail of another suite', () => {
    expect(
      judgeColumns({
        check: 'indexed',
        findings: [],
        schema: 'rules/1',
      }),
    ).toEqual({ dimensions: [], judgeModel: undefined, scores: [] });
  });
});
