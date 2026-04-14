import { describe, expect, it } from 'vitest';

import { getPinnedEntries } from './getPinnedEntries.util';

describe('getPinnedEntries', () => {
  it('flattens left and right pinned columns into ordered entries', () => {
    expect(
      getPinnedEntries({
        columnPinning: {
          left: ['id', 'status'],
          right: ['actions'],
        },
      }),
    ).toEqual([
      { key: 'id', originalSide: 'left' },
      { key: 'status', originalSide: 'left' },
      { key: 'actions', originalSide: 'right' },
    ]);
  });

  it('returns an empty array when nothing is pinned', () => {
    expect(
      getPinnedEntries({
        columnPinning: {
          left: [],
          right: [],
        },
      }),
    ).toEqual([]);
  });
});
