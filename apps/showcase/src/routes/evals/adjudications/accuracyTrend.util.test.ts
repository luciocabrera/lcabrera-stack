import { describe, expect, it } from 'vite-plus/test';

import { accuracyTrend } from './accuracyTrend.util';
import { adjudication, CASES, seat, VERDICTS } from './adjudications.fixtures';
import { scoredVerdicts } from './scoredVerdicts.util';

const AT = [
  '2026-11-01T10:00:00.000Z',
  '2026-11-02T10:00:00.000Z',
  '2026-11-03T10:00:00.000Z',
];

describe('accuracyTrend', () => {
  const trend = accuracyTrend(
    scoredVerdicts({ cases: CASES, verdicts: VERDICTS }),
  );

  it('runs one line per model, through its scored cases in the order they opened', () => {
    expect(trend.map(({ model }) => model)).toEqual([
      'claude-fable-5-1',
      'claude-opus-5-5',
      'claude-sonnet-5-5',
    ]);
    expect(trend[0]?.points).toEqual([
      {
        at: AT[0],
        label: 'claude-fable-5-1 after FP-0001: 100% (1/1)',
        value: 1,
      },
      {
        at: AT[1],
        label: 'claude-fable-5-1 after FP-0002: 100% (2/2)',
        value: 1,
      },
      {
        at: AT[2],
        label: 'claude-fable-5-1 after FP-0003: 67% (2/3)',
        value: 2 / 3,
      },
    ]);
    expect(trend[1]?.points.map(({ value }) => value)).toEqual([1, 0.5, 1 / 3]);
  });

  it('breaks a tie in opening time by case id', () => {
    const tied = scoredVerdicts({
      cases: ['FP-0009', 'FP-0008'].map((caseId) =>
        adjudication({ caseId, truth: 'REAL', truthSource: 'lucio' }),
      ),
      verdicts: [
        seat({
          caseId: 'FP-0009',
          model: 'model-a',
          role: 'judge',
          verdict: 'FALSE_POSITIVE',
        }),
        seat({
          caseId: 'FP-0008',
          model: 'model-a',
          role: 'judge',
          verdict: 'REAL',
        }),
      ],
    });

    expect(accuracyTrend(tied)[0]?.points.map(({ label }) => label)).toEqual([
      'model-a after FP-0008: 100% (1/1)',
      'model-a after FP-0009: 50% (1/2)',
    ]);
  });

  it('draws no line when no verdict is scored', () => {
    const unscored = scoredVerdicts({
      cases: CASES.slice(0, 1),
      verdicts: VERDICTS,
    });

    expect(accuracyTrend(unscored)).toEqual([]);
  });
});
