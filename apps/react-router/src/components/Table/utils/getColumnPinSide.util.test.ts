import { describe, expect, it } from 'vitest';

import { getColumnPinSide } from './getColumnPinSide.util.ts';

describe('getColumnPinSide', () => {
  it('returns left when column is in left pinning', () => {
    expect(getColumnPinSide({ left: ['id', 'name'], right: [] }, 'id')).toBe(
      'left',
    );
  });

  it('returns right when column is in right pinning', () => {
    expect(getColumnPinSide({ left: [], right: ['actions'] }, 'actions')).toBe(
      'right',
    );
  });

  it('returns undefined when column is not pinned', () => {
    expect(
      getColumnPinSide({ left: ['id'], right: ['actions'] }, 'name'),
    ).toBeUndefined();
  });

  it('returns undefined when pinning is undefined', () => {
    expect(getColumnPinSide(undefined, 'id')).toBeUndefined();
  });
});
