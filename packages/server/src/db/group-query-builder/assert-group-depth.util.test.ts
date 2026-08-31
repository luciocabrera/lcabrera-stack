import { describe, expect, it } from 'vite-plus/test';

import { GroupingRefusedError } from '../../errors/grouping-refused.error.ts';
import { assertGroupDepth } from './assert-group-depth.util.ts';

describe('assertGroupDepth', () => {
  it.each([1, 2, 3, 4])('accepts %i distinct keys under a rollup', (depth) => {
    const keys = ['a', 'b', 'c', 'd'].slice(0, depth);

    expect(() => assertGroupDepth({ grouping: 'rollup', keys })).not.toThrow();
  });

  it('refuses a grouping with no keys', () => {
    expect(() => assertGroupDepth({ grouping: 'rollup', keys: [] })).toThrow(
      'at least one group key',
    );
  });

  it('refuses past the depth cap', () => {
    expect(() =>
      assertGroupDepth({ grouping: 'rollup', keys: ['a', 'b', 'c', 'd', 'e'] }),
    ).toThrow('at most 4 group keys');
  });

  it('refuses a repeated key', () => {
    expect(() =>
      assertGroupDepth({ grouping: 'rollup', keys: ['a', 'a'] }),
    ).toThrow('must be distinct');
  });

  it('refuses with a typed reason the loader edge can branch on', () => {
    const reasons = [[], ['a', 'b', 'c', 'd', 'e'], ['a', 'a']].map((keys) => {
      try {
        assertGroupDepth({ grouping: 'rollup', keys });

        return 'accepted';
      } catch (error) {
        return error instanceof GroupingRefusedError ? error.reason : 'other';
      }
    });

    expect(reasons).toEqual(['no-keys', 'too-many-keys', 'duplicate-keys']);
  });

  it.each(['cube', 'flat', 'rollup'] as const)(
    'accepts three keys under %s',
    (grouping) => {
      expect(() =>
        assertGroupDepth({ grouping, keys: ['a', 'b', 'c'] }),
      ).not.toThrow();
    },
  );

  it('refuses a cube one key earlier than the modes that scale linearly', () => {
    const keys = ['a', 'b', 'c', 'd'];

    expect(() => assertGroupDepth({ grouping: 'cube', keys })).toThrow(
      'A cube grouping takes at most 3 group keys; got 4.',
    );
    expect(() => assertGroupDepth({ grouping: 'flat', keys })).not.toThrow();
    expect(() => assertGroupDepth({ grouping: 'rollup', keys })).not.toThrow();
  });

  it('refuses an over-deep cube as `too-many-keys`, not a new reason', () => {
    try {
      assertGroupDepth({ grouping: 'cube', keys: ['a', 'b', 'c', 'd'] });

      expect.unreachable('a depth-4 cube must be refused');
    } catch (error) {
      expect(error).toBeInstanceOf(GroupingRefusedError);
      expect((error as GroupingRefusedError).reason).toBe('too-many-keys');
    }
  });
});
