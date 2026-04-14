import { describe, expect, it } from 'vitest';

import { sortPinnedKeysByOrder } from './sortPinnedKeysByOrder.util';

describe('sortPinnedKeysByOrder', () => {
  it('sorts pinned keys using the latest column order', () => {
    const keys = ['status', 'id', 'amount'];

    expect(
      sortPinnedKeysByOrder({
        keys,
        newOrder: ['id', 'amount', 'status'],
      }),
    ).toEqual(['id', 'amount', 'status']);
    expect(keys).toEqual(['status', 'id', 'amount']);
  });

  it('keeps keys missing from the order stable', () => {
    expect(
      sortPinnedKeysByOrder({
        keys: ['custom', 'status'],
        newOrder: ['status'],
      }),
    ).toEqual(['custom', 'status']);
  });
});
