import { describe, expect, it } from 'vite-plus/test';

import { restoreStaticColumnOrder } from './restoreStaticColumnOrder.util';

describe('restoreStaticColumnOrder', () => {
  it('returns newOrder unchanged when staticKeys is empty', () => {
    const result = restoreStaticColumnOrder({
      currentOrder: ['id', 'name', 'age'],
      newOrder: ['age', 'name', 'id'],
      staticKeys: new Set(),
    });
    expect(result).toEqual(['age', 'name', 'id']);
  });

  it('returns newOrder unchanged when currentOrder is empty', () => {
    const result = restoreStaticColumnOrder({
      currentOrder: [],
      newOrder: ['age', 'name', 'id'],
      staticKeys: new Set(['id']),
    });
    expect(result).toEqual(['age', 'name', 'id']);
  });

  it('restores static columns to their original positions', () => {
    const result = restoreStaticColumnOrder({
      currentOrder: ['id', 'name', 'age'],
      newOrder: ['age', 'name', 'id'],
      staticKeys: new Set(['id']),
    });
    expect(result[0]).toBe('id');
  });

  it('handles multiple static columns', () => {
    const result = restoreStaticColumnOrder({
      currentOrder: ['id', 'name', 'age', 'actions'],
      newOrder: ['age', 'name', 'id', 'actions'],
      staticKeys: new Set(['actions', 'id']),
    });
    expect(result[0]).toBe('id');
    expect(result[3]).toBe('actions');
  });
});
