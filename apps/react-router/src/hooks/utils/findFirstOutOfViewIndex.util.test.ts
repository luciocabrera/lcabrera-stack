import { describe, expect, it } from 'vitest';

import { findFirstOutOfViewIndex } from './findFirstOutOfViewIndex.util.ts';

describe('findFirstOutOfViewIndex', () => {
  it('returns first column that starts at or past viewport end', () => {
    const result = findFirstOutOfViewIndex({
      starts: [0, 100, 200, 300],
      viewEnd: 250,
    });

    expect(result).toBe(3);
  });

  it('returns matching index for exact boundary match', () => {
    const result = findFirstOutOfViewIndex({
      starts: [0, 100, 200, 300],
      viewEnd: 200,
    });

    expect(result).toBe(2);
  });

  it('returns starts.length when all starts are before viewport end', () => {
    const result = findFirstOutOfViewIndex({
      starts: [0, 100, 200],
      viewEnd: 350,
    });

    expect(result).toBe(3);
  });
});
