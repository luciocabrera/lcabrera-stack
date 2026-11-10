import { describe, expect, it } from 'vite-plus/test';

import { accuracyRows } from './accuracyRows.util';
import { ACCURACY } from './adjudications.fixtures';

describe('accuracyRows', () => {
  it('gives each model and role its accuracy, interval and error counts', () => {
    expect(accuracyRows(ACCURACY)).toEqual([
      {
        accuracy: '67% (2/3)',
        correct: 2,
        falseAlarms: 0,
        id: 'claude-fable-5-1/adversary',
        interval: 'too few verdicts for an interval',
        missedReal: 1,
        model: 'claude-fable-5-1',
        role: 'adversary',
        verdicts: 3,
      },
      {
        accuracy: '33% (1/3)',
        correct: 1,
        falseAlarms: 0,
        id: 'claude-opus-5-5/judge',
        interval: 'too few verdicts for an interval',
        missedReal: 2,
        model: 'claude-opus-5-5',
        role: 'judge',
        verdicts: 3,
      },
    ]);
  });
});
