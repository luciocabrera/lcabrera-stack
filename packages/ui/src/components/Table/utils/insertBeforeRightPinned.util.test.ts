import { describe, expect, it } from 'vite-plus/test';

import { insertBeforeRightPinned } from './insertBeforeRightPinned.util';

describe('insertBeforeRightPinned', () => {
  it('inserts before the first right pinned column', () => {
    const result = insertBeforeRightPinned({
      columnKey: 'name',
      newPinning: { left: [], right: ['age', 'actions'] },
      orderWithoutColumn: ['id', 'age', 'actions'],
    });

    expect(result).toEqual(['id', 'name', 'age', 'actions']);
  });

  it('inserts at the end when there are no right pinned columns', () => {
    const result = insertBeforeRightPinned({
      columnKey: 'name',
      newPinning: { left: [], right: [] },
      orderWithoutColumn: ['id', 'age', 'actions'],
    });

    expect(result).toEqual(['id', 'age', 'actions', 'name']);
  });
});
