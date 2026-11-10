import { describe, expect, it } from 'vite-plus/test';

import { CASES, VERDICTS } from './adjudications.fixtures';
import { promptAccuracy } from './promptAccuracy.util';
import { scoredVerdicts } from './scoredVerdicts.util';

describe('promptAccuracy', () => {
  it('scores each role per prompt hash, oldest prompt of each role first', () => {
    expect(
      promptAccuracy(scoredVerdicts({ cases: CASES, verdicts: VERDICTS })),
    ).toEqual([
      {
        accuracy: '100% (2/2)',
        firstSeen: '2026-11-01',
        id: `adversary/${'b'.repeat(64)}`,
        prompt: 'b'.repeat(12),
        role: 'adversary',
        verdicts: 3,
      },
      {
        accuracy: '0% (0/1)',
        firstSeen: '2026-11-03',
        id: `adversary/${'c'.repeat(64)}`,
        prompt: 'c'.repeat(12),
        role: 'adversary',
        verdicts: 1,
      },
      {
        accuracy: '33% (2/6)',
        firstSeen: '2026-11-01',
        id: `judge/${'a'.repeat(64)}`,
        prompt: 'a'.repeat(12),
        role: 'judge',
        verdicts: 8,
      },
    ]);
  });

  it('lists no prompt without a verdict', () => {
    expect(promptAccuracy([])).toEqual([]);
  });
});
