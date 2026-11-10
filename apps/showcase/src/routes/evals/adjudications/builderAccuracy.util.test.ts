import { describe, expect, it } from 'vite-plus/test';

import { CASES, VERDICTS } from './adjudications.fixtures';
import { builderAccuracy } from './builderAccuracy.util';
import { scoredVerdicts } from './scoredVerdicts.util';

describe('builderAccuracy', () => {
  it('counts cases and dismissals per builder model, with the panel accuracy on its cases', () => {
    expect(
      builderAccuracy({
        cases: CASES,
        verdicts: scoredVerdicts({ cases: CASES, verdicts: VERDICTS }),
      }),
    ).toEqual([
      {
        accuracy: '50% (3/6)',
        builder: 'claude-opus-5-5',
        cases: 3,
        dismissed: 2,
        id: 'claude-opus-5-5',
      },
      {
        accuracy: '33% (1/3)',
        builder: 'not recorded',
        cases: 1,
        dismissed: 0,
        id: 'not recorded',
      },
    ]);
  });
});
