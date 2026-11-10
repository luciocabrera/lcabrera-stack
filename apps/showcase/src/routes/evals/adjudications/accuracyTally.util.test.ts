import { describe, expect, it } from 'vite-plus/test';

import { accuracyTally } from './accuracyTally.util';

describe('accuracyTally', () => {
  it('counts the scored verdicts and the correct ones, leaving out the unscored', () => {
    expect(
      accuracyTally([
        { isCorrect: true },
        { isCorrect: false },
        { isCorrect: undefined },
        { isCorrect: true },
      ]),
    ).toEqual({ correct: 2, scored: 3 });
  });

  it('counts nothing when no verdict is scored', () => {
    expect(accuracyTally([{ isCorrect: undefined }])).toEqual({
      correct: 0,
      scored: 0,
    });
  });
});
