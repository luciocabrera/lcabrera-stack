import { describe, expect, it } from 'vitest';

import { insertAdjacentToPinnedGroup } from './insertAdjacentToPinnedGroup.util';

describe('insertAdjacentToPinnedGroup', () => {
  it('inserts after last left-pinned column', () => {
    const order = ['id', 'name', 'age'];
    const result = insertAdjacentToPinnedGroup({
      columnKey: 'status',
      columnPinning: { left: ['id'], right: [] },
      order,
      side: 'left',
    });
    expect(result).toEqual(['id', 'status', 'name', 'age']);
  });

  it('inserts at start when no left-pinned columns', () => {
    const order = ['name', 'age'];
    const result = insertAdjacentToPinnedGroup({
      columnKey: 'status',
      columnPinning: { left: [], right: [] },
      order,
      side: 'left',
    });
    expect(result).toEqual(['status', 'name', 'age']);
  });

  it('inserts before first right-pinned column', () => {
    const order = ['id', 'name', 'actions'];
    const result = insertAdjacentToPinnedGroup({
      columnKey: 'status',
      columnPinning: { left: [], right: ['actions'] },
      order,
      side: 'right',
    });
    expect(result).toEqual(['id', 'name', 'status', 'actions']);
  });

  it('inserts at end when no right-pinned columns', () => {
    const order = ['id', 'name'];
    const result = insertAdjacentToPinnedGroup({
      columnKey: 'status',
      columnPinning: { left: [], right: [] },
      order,
      side: 'right',
    });
    expect(result).toEqual(['id', 'name', 'status']);
  });
});
