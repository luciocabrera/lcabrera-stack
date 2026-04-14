import { describe, expect, it } from 'vitest';

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
    // currentOrder: id(0), name(1), age(2) — id is static at index 0
    // newOrder: age, name, id (after user drag, id was moved)
    // Expected: id restored to index 0: id, age, name
    const result = restoreStaticColumnOrder({
      currentOrder: ['id', 'name', 'age'],
      newOrder: ['age', 'name', 'id'],
      staticKeys: new Set(['id']),
    });
    expect(result[0]).toBe('id');
  });

  it('handles multiple static columns', () => {
    // currentOrder: id(0), name(1), age(2), actions(3) — id and actions are static
    const result = restoreStaticColumnOrder({
      currentOrder: ['id', 'name', 'age', 'actions'],
      newOrder: ['age', 'name', 'id', 'actions'],
      staticKeys: new Set(['id', 'actions']),
    });
    expect(result[0]).toBe('id');
    expect(result[3]).toBe('actions');
  });
});
