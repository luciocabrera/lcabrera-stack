import { describe, expect, it } from 'vitest';

import { insertAfterLeftPinned } from './insertAfterLeftPinned.util';

describe('insertAfterLeftPinned', () => {
  it('inserts after the last left pinned column', () => {
    const result = insertAfterLeftPinned({
      columnKey: 'name',
      newPinning: { left: ['id', 'age'], right: [] },
      orderWithoutColumn: ['id', 'age', 'actions'],
    });

    expect(result).toEqual(['id', 'age', 'name', 'actions']);
  });

  it('inserts at the start when no left pinned columns remain', () => {
    const result = insertAfterLeftPinned({
      columnKey: 'name',
      newPinning: { left: [], right: [] },
      orderWithoutColumn: ['id', 'age', 'actions'],
    });

    expect(result).toEqual(['name', 'id', 'age', 'actions']);
  });
});
