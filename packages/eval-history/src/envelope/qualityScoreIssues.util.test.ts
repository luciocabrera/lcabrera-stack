import { describe, expect, it } from 'vite-plus/test';

import { qualityScoreIssues } from './qualityScoreIssues.util.ts';

const quality = (
  dimensions: readonly { readonly name: string; readonly score: number }[],
) => ({
  dimensions: dimensions.map((dimension) => ({ ...dimension, feedback: '' })),
  judge_model: 'claude-opus-5-5',
  overall: 3,
  reply_sha256: 'a'.repeat(64),
  schema: 'quality/1' as const,
  summary: '',
});

describe('qualityScoreIssues', () => {
  it('passes whole scores from 1 to 5 on distinct dimensions', () => {
    expect(
      qualityScoreIssues({
        detail: quality([
          { name: 'clarity', score: 1 },
          { name: 'completeness', score: 5 },
        ]),
        index: 0,
      }),
    ).toEqual([]);
  });

  it('names a score the score table cannot hold and a repeated dimension', () => {
    expect(
      qualityScoreIssues({
        detail: quality([
          { name: 'clarity', score: 3.5 },
          { name: 'clarity', score: 2 },
          { name: 'scope', score: 6 },
        ]),
        index: 1,
      }).map(({ message, path }) => [path.join('.'), message]),
    ).toEqual([
      [
        'trials.1.detail.dimensions.0.score',
        'dimension clarity scores 3.5, not a whole number from 1 to 5',
      ],
      [
        'trials.1.detail.dimensions.1.name',
        'dimension clarity is scored more than once',
      ],
      [
        'trials.1.detail.dimensions.2.score',
        'dimension scope scores 6, not a whole number from 1 to 5',
      ],
    ]);
  });

  it('asks nothing of another suite', () => {
    expect(
      qualityScoreIssues({
        detail: { check: 'indexed', findings: [], schema: 'rules/1' },
        index: 0,
      }),
    ).toEqual([]);
  });
});
