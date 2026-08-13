import { describe, expect, it } from 'vite-plus/test';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertGroupDepth } from './assert-group-depth.util.ts';

describe('assertGroupDepth', () => {
  it.each([1, 2, 3, 4])('accepts %i distinct keys', (depth) => {
    const keys = ['a', 'b', 'c', 'd'].slice(0, depth);

    expect(() => assertGroupDepth({ keys })).not.toThrow();
  });

  it('refuses a grouping with no keys', () => {
    expect(() => assertGroupDepth({ keys: [] })).toThrow(
      'at least one group key',
    );
  });

  it('refuses past the depth cap', () => {
    expect(() => assertGroupDepth({ keys: ['a', 'b', 'c', 'd', 'e'] })).toThrow(
      'at most 4 group keys',
    );
  });

  it('refuses a repeated key', () => {
    expect(() => assertGroupDepth({ keys: ['a', 'a'] })).toThrow(
      'must be distinct',
    );
  });

  it('refuses with a typed reason the loader edge can branch on', () => {
    // The message is for a human; `reason` is what survives the mapping to the
    // serializable union, so each refusal has to carry its own.
    const reasons = [[], ['a', 'b', 'c', 'd', 'e'], ['a', 'a']].map((keys) => {
      try {
        assertGroupDepth({ keys });

        return 'accepted';
      } catch (error) {
        return error instanceof GroupingRefusedError ? error.reason : 'other';
      }
    });

    expect(reasons).toEqual(['no-keys', 'too-many-keys', 'duplicate-keys']);
  });
});
