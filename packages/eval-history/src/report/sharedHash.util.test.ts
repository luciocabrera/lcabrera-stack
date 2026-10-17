import { describe, expect, it } from 'vite-plus/test';

import { sharedHash } from './sharedHash.util.ts';

describe('sharedHash', () => {
  it('folds the hashes every task shares into one value', () => {
    expect(sharedHash(['p1', 'p1', undefined])).toBe('p1');
  });

  it('joins distinct hashes in a stable order', () => {
    expect(sharedHash(['p2', 'p1', 'p2'])).toBe('p1,p2');
  });

  it('is absent when no task recorded one', () => {
    expect(sharedHash([undefined, undefined])).toBeUndefined();
  });
});
