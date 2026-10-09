import { describe, expect, it } from 'vite-plus/test';

import { plainIdentifier } from './plainIdentifier.util.ts';

describe('plainIdentifier', () => {
  it.each(['run_id', 'eval_trial', '_x2'])('passes %s through', (name) => {
    expect(plainIdentifier(name)).toBe(name);
  });

  it.each(['RunId', '2x', 'a-b', "x'", 'a b', ''])('refuses %j', (name) => {
    expect(() => plainIdentifier(name)).toThrow(
      'is not a plain lower-case identifier',
    );
  });
});
