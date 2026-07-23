import { describe, expect, it } from 'vite-plus/test';

import { resolveUnpinnedOrder } from './resolveUnpinnedOrder.util';

describe('resolveUnpinnedOrder', () => {
  it('returns base order when the column was not previously pinned', () => {
    const result = resolveUnpinnedOrder({
      baseOrder: ['id', 'name', 'age'],
      columnKey: 'name',
      newPinning: { left: [], right: [] },
      orderWithoutColumn: ['id', 'age'],
      previousPinning: { left: [], right: [] },
    });

    expect(result).toEqual(['id', 'name', 'age']);
  });

  it('repositions after remaining left pinned group when previously left pinned', () => {
    const result = resolveUnpinnedOrder({
      baseOrder: ['name', 'id', 'age', 'actions'],
      columnKey: 'name',
      newPinning: { left: ['id'], right: [] },
      orderWithoutColumn: ['id', 'age', 'actions'],
      previousPinning: { left: ['id', 'name'], right: [] },
    });

    expect(result).toEqual(['id', 'name', 'age', 'actions']);
  });

  it('repositions before remaining right pinned group when previously right pinned', () => {
    const result = resolveUnpinnedOrder({
      baseOrder: ['id', 'age', 'actions', 'name'],
      columnKey: 'name',
      newPinning: { left: [], right: ['actions'] },
      orderWithoutColumn: ['id', 'age', 'actions'],
      previousPinning: { left: [], right: ['actions', 'name'] },
    });

    expect(result).toEqual(['id', 'age', 'name', 'actions']);
  });
});
