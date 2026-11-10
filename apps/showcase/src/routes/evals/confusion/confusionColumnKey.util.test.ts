import { describe, expect, it } from 'vite-plus/test';

import { confusionColumnKey } from './confusionColumnKey.util';

describe('confusionColumnKey', () => {
  it('prefixes a loaded column so it cannot collide with the expectation or the trials', () => {
    expect(confusionColumnKey('trials')).toBe('loaded:trials');
    expect(confusionColumnKey('expected')).toBe('loaded:expected');
  });

  it('keeps the column name as it is after the prefix', () => {
    expect(confusionColumnKey('(none)')).toBe('loaded:(none)');
  });
});
