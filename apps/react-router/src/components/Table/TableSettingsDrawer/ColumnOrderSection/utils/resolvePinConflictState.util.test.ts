import { describe, expect, it } from 'vitest';

import { resolvePinConflictState } from './resolvePinConflictState.util';

type TestRow = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
] as const;

describe('resolvePinConflictState', () => {
  it('move-column: repositions the target next to pinned group and applies pin', () => {
    const result = resolvePinConflictState<TestRow>({
      allOrderedColumns: [columns[1], columns[0], columns[2]],
      columnKey: 'name',
      columns,
      currentOrder: ['name', 'id', 'age'],
      currentPinning: { left: ['id'], right: [] },
      resolution: 'move-column',
      side: 'left',
    });

    expect(result.columnOrder).toEqual(['id', 'name', 'age']);
    expect(result.columnPinning).toEqual({ left: ['id', 'name'], right: [] });
  });

  it('pin-all-between: pins in range and syncs resulting order', () => {
    const result = resolvePinConflictState<TestRow>({
      allOrderedColumns: [columns[1], columns[0], columns[2]],
      columnKey: 'name',
      columns,
      currentOrder: ['name', 'id', 'age'],
      currentPinning: { left: ['id'], right: [] },
      resolution: 'pin-all-between',
      side: 'left',
    });

    expect(result.columnOrder).toEqual(['id', 'name', 'age']);
    expect(result.columnPinning).toEqual({ left: ['id', 'name'], right: [] });
  });

  it('pin-only: applies pin and keeps order synced for right side', () => {
    const result = resolvePinConflictState<TestRow>({
      allOrderedColumns: [columns[0], columns[1], columns[2]],
      columnKey: 'name',
      columns,
      currentOrder: ['id', 'name', 'age'],
      currentPinning: { left: ['id'], right: [] },
      resolution: 'pin-only',
      side: 'right',
    });

    expect(result.columnOrder).toEqual(['id', 'age', 'name']);
    expect(result.columnPinning).toEqual({ left: ['id'], right: ['name'] });
  });
});
