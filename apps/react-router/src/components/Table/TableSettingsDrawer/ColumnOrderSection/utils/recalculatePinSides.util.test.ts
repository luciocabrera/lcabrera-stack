import { describe, expect, it } from 'vitest';

import { recalculatePinSides } from './recalculatePinSides.util';

describe('recalculatePinSides', () => {
  it('assigns columns closer to left as left-pinned', () => {
    const result = recalculatePinSides({
      columnPinning: { left: ['id', 'name'], right: [] },
      newOrder: ['id', 'name', 'age', 'status', 'actions'],
    });
    expect(result.left).toContain('id');
    expect(result.left).toContain('name');
  });

  it('assigns columns closer to right as right-pinned', () => {
    const result = recalculatePinSides({
      columnPinning: { left: [], right: ['status', 'actions'] },
      newOrder: ['id', 'name', 'age', 'status', 'actions'],
    });
    expect(result.right).toContain('actions');
    expect(result.right).toContain('status');
  });

  it('preserves equidistant column original side', () => {
    // 1 column total, index 0 is equidistant (distance 0 both sides)
    const result = recalculatePinSides({
      columnPinning: { left: ['id'], right: [] },
      newOrder: ['id'],
    });
    expect(result.left).toContain('id');
  });

  it('preserves static columns in their original side', () => {
    const result = recalculatePinSides({
      columnPinning: { left: ['id'], right: ['actions'] },
      newOrder: ['actions', 'name', 'id'],
      staticKeys: new Set(['id', 'actions']),
    });
    expect(result.left).toContain('id');
    expect(result.right).toContain('actions');
  });

  it('sorts result by position in newOrder', () => {
    const result = recalculatePinSides({
      columnPinning: { left: ['name', 'id'], right: [] },
      newOrder: ['id', 'name', 'age', 'status'],
    });
    expect(result.left.indexOf('id')).toBeLessThan(result.left.indexOf('name'));
  });

  it('skips columns not found in newOrder', () => {
    const result = recalculatePinSides({
      columnPinning: { left: ['missing', 'id'], right: [] },
      newOrder: ['id', 'name'],
    });
    expect(result.left).not.toContain('missing');
    expect(result.left).toContain('id');
  });
});
