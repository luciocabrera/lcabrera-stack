import { describe, expect, it } from 'vite-plus/test';

import { parseScoreArgument } from './parseScoreArgument.util.ts';

describe('parseScoreArgument', () => {
  it('reads a dimension and a whole score', () => {
    expect(parseScoreArgument('clarity=4')).toEqual({
      dimension: 'clarity',
      kind: 'score',
      score: 4,
    });
  });

  it.each([
    'clarity=0',
    'clarity=6',
    'clarity=3.5',
    'clarity=',
    '=3',
    'clarity',
  ])('refuses %s and says what it wants', (argument) => {
    expect(parseScoreArgument(argument)).toEqual({
      kind: 'problem',
      problem: `--score ${argument} is not <dimension>=<a whole number from 1 to 5>`,
    });
  });
});
