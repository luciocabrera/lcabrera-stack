import { describe, expect, it } from 'vitest';

import { getColumnPinSide } from './getColumnPinSide.util';

describe('getColumnPinSide', () => {
  it('returns left when column is in left pinning', () => {
    expect(
      getColumnPinSide({
        columnKey: 'id',
        pinning: { left: ['id', 'name'], right: [] },
      }),
    ).toBe('left');
  });

  it('returns right when column is in right pinning', () => {
    expect(
      getColumnPinSide({
        columnKey: 'actions',
        pinning: { left: [], right: ['actions'] },
      }),
    ).toBe('right');
  });

  it('returns undefined when column is not pinned', () => {
    expect(
      getColumnPinSide({
        columnKey: 'name',
        pinning: { left: ['id'], right: ['actions'] },
      }),
    ).toBeUndefined();
  });

  it('returns undefined when pinning is undefined', () => {
    expect(
      getColumnPinSide({ columnKey: 'id', pinning: undefined }),
    ).toBeUndefined();
  });
});
