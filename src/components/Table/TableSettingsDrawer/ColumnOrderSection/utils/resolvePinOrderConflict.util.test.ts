import { describe, expect, it } from 'vitest';

import { resolvePinOrderConflict } from './resolvePinOrderConflict.util';

describe('resolvePinOrderConflict', () => {
  const columnPinning = { left: ['id', 'name'], right: ['actions'] };

  it('reset-all-pins: clears all pinning and keeps new order', () => {
    const result = resolvePinOrderConflict({
      columnPinning,
      newOrder: ['age', 'id', 'name', 'actions'],
      resolution: 'reset-all-pins',
    });
    expect(result.columnPinning).toEqual({ left: [], right: [] });
    expect(result.columnOrder).toEqual(['age', 'id', 'name', 'actions']);
  });

  it('remove-conflicting-pins: keeps only contiguous left pins', () => {
    const result = resolvePinOrderConflict({
      columnPinning: { left: ['id', 'name'], right: [] },
      newOrder: ['id', 'age', 'name', 'actions'],
      resolution: 'remove-conflicting-pins',
    });
    expect(result.columnPinning.left).toEqual(['id']); // name is not contiguous
    expect(result.columnOrder).toEqual(['id', 'age', 'name', 'actions']);
  });

  it('remove-conflicting-pins: keeps only contiguous right pins', () => {
    const result = resolvePinOrderConflict({
      columnPinning: { left: [], right: ['name', 'actions'] },
      newOrder: ['id', 'name', 'age', 'actions'],
      resolution: 'remove-conflicting-pins',
    });
    expect(result.columnPinning.right).toEqual(['actions']); // name is not contiguous from right
  });

  it('pin-to-match-order: moves left-pinned to start, right-pinned to end', () => {
    const result = resolvePinOrderConflict({
      columnPinning,
      newOrder: ['age', 'id', 'name', 'actions'],
      resolution: 'pin-to-match-order',
    });
    expect(result.columnOrder[0]).toBe('id');
    expect(result.columnOrder[1]).toBe('name');
    expect(result.columnOrder.at(-1)).toBe('actions');
    expect(result.columnPinning.left).toEqual(['id', 'name']);
    expect(result.columnPinning.right).toEqual(['actions']);
  });
});
