import { describe, expect, it } from 'vite-plus/test';

import { resolveColumnPinningUpdate } from './resolveColumnPinningUpdate.util';

describe('resolveColumnPinningUpdate', () => {
  it('pins a column to the left and syncs the order', () => {
    const result = resolveColumnPinningUpdate<{
      readonly age: string;
      readonly id: string;
      readonly name: string;
    }>({
      columnKey: 'name',
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      currentOrder: ['name', 'id', 'age'],
      currentPinning: { left: ['id'], right: [] },
      side: 'left',
    });

    expect(result).toEqual({
      newColumnOrder: ['id', 'name', 'age'],
      newPinning: { left: ['id', 'name'], right: [] },
    });
  });

  it('removes a column from pinning when no side is provided', () => {
    const result = resolveColumnPinningUpdate<{
      readonly age: string;
      readonly id: string;
      readonly name: string;
    }>({
      columnKey: 'name',
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      currentOrder: ['id', 'name', 'age'],
      currentPinning: { left: ['id', 'name'], right: [] },
      side: undefined,
    });

    expect(result).toEqual({
      newColumnOrder: ['id', 'name', 'age'],
      newPinning: { left: ['id'], right: [] },
    });
  });

  it('delegates to shared pinning logic that respects static keys', () => {
    const result = resolveColumnPinningUpdate<{
      readonly age: string;
      readonly id: string;
      readonly name: string;
    }>({
      columnKey: 'name',
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      currentOrder: ['id', 'name', 'age'],
      currentPinning: { left: ['id'], right: [] },
      side: 'left',
      staticKeys: new Set(['id']),
    });

    expect(result.newPinning).toEqual({ left: ['id', 'name'], right: [] });
  });
});
