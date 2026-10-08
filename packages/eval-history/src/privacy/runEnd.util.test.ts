import { describe, expect, it } from 'vite-plus/test';

import { runEnd } from './runEnd.util.ts';

describe('runEnd', () => {
  it('stops at the first character that does not match', () => {
    expect(
      runEnd({
        matches: (character) => character === 'a',
        start: 1,
        text: 'xaab',
      }),
    ).toBe(3);
  });

  it('runs to the end of the text', () => {
    expect(runEnd({ matches: () => true, start: 0, text: 'abc' })).toBe(3);
  });
});
