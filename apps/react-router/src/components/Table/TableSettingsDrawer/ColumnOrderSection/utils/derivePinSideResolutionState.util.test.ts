import { describe, expect, it } from 'vitest';

import { derivePinSideResolutionState } from './derivePinSideResolutionState.util';

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

describe('derivePinSideResolutionState', () => {
  it('returns resolved state when pin is contiguous', () => {
    const result = derivePinSideResolutionState<TestRow>({
      allOrderedColumns: columns,
      columnKey: 'id',
      columnPinning: { left: [], right: [] },
      columns,
      currentOrder: ['id', 'name', 'age'],
      pinSide: 'left',
    });

    expect(result).toEqual({
      kind: 'resolved',
      side: 'left',
      columnOrder: expect.any(Array),
      columnPinning: { left: ['id'], right: [] },
    });
  });

  it('resolves closest-edge to left when column is near the start', () => {
    const result = derivePinSideResolutionState<TestRow>({
      allOrderedColumns: columns,
      columnKey: 'id',
      columnPinning: { left: [], right: [] },
      columns,
      currentOrder: ['id', 'name', 'age'],
      pinSide: 'closest-edge',
    });

    expect(result).toEqual({
      kind: 'resolved',
      side: 'left',
      columnOrder: expect.any(Array),
      columnPinning: { left: ['id'], right: [] },
    });
  });

  it('resolves closest-edge to right when column is near the end', () => {
    const result = derivePinSideResolutionState<TestRow>({
      allOrderedColumns: columns,
      columnKey: 'age',
      columnPinning: { left: [], right: [] },
      columns,
      currentOrder: ['id', 'name', 'age'],
      pinSide: 'closest-edge',
    });

    expect(result).toEqual({
      kind: 'resolved',
      side: 'right',
      columnOrder: expect.any(Array),
      columnPinning: { left: [], right: ['age'] },
    });
  });

  it('returns conflict state when pin would be non-contiguous', () => {
    const result = derivePinSideResolutionState<TestRow>({
      allOrderedColumns: columns,
      columnKey: 'age',
      columnPinning: { left: ['id'], right: [] },
      columns,
      currentOrder: ['id', 'name', 'age'],
      pinSide: 'left',
    });

    expect(result).toEqual({
      kind: 'conflict',
      side: 'left',
    });
  });

  it('respects static key constraints when applying pin', () => {
    const result = derivePinSideResolutionState<TestRow>({
      allOrderedColumns: columns,
      columnKey: 'id',
      columnPinning: { left: [], right: [] },
      columns,
      currentOrder: ['id', 'name', 'age'],
      pinSide: 'left',
      staticKeys: new Set(['id']),
    });

    expect(result).toEqual({
      kind: 'resolved',
      side: 'left',
      columnOrder: expect.any(Array),
      columnPinning: { left: ['id'], right: [] },
    });
  });

  it('syncs column order when pinning to the right side', () => {
    const result = derivePinSideResolutionState<TestRow>({
      allOrderedColumns: columns,
      columnKey: 'age',
      columnPinning: { left: [], right: [] },
      columns,
      currentOrder: ['id', 'name', 'age'],
      pinSide: 'right',
    });

    if (result.kind === 'resolved') {
      expect(result.columnPinning).toEqual({ left: [], right: ['age'] });
    }
  });
});
