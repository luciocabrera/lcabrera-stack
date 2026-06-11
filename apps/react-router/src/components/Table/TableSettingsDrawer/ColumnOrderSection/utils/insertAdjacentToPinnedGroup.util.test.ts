import { describe, expect, it } from 'vitest';

import { insertAdjacentToPinnedGroup } from './insertAdjacentToPinnedGroup.util';
import type { DataKey } from '@/components/Table/Table.types';

type TestRow = Record<string, unknown>;
type TestDataKey = DataKey<TestRow>;

describe('insertAdjacentToPinnedGroup', () => {
  it('inserts after last left-pinned column', () => {
    const order: readonly TestDataKey[] = ['id', 'name', 'age'];
    const result = insertAdjacentToPinnedGroup<TestRow>({
      columnKey: 'status',
      columnPinning: { left: ['id'], right: [] },
      order,
      side: 'left',
    });
    expect(result).toEqual(['id', 'status', 'name', 'age']);
  });

  it('inserts at start when no left-pinned columns', () => {
    const order: readonly TestDataKey[] = ['name', 'age'];
    const result = insertAdjacentToPinnedGroup<TestRow>({
      columnKey: 'status',
      columnPinning: { left: [], right: [] },
      order,
      side: 'left',
    });
    expect(result).toEqual(['status', 'name', 'age']);
  });

  it('inserts before first right-pinned column', () => {
    const order: readonly TestDataKey[] = ['id', 'name', 'actions'];
    const result = insertAdjacentToPinnedGroup<TestRow>({
      columnKey: 'status',
      columnPinning: { left: [], right: ['actions'] },
      order,
      side: 'right',
    });
    expect(result).toEqual(['id', 'name', 'status', 'actions']);
  });

  it('inserts at end when no right-pinned columns', () => {
    const order: readonly TestDataKey[] = ['id', 'name'];
    const result = insertAdjacentToPinnedGroup<TestRow>({
      columnKey: 'status',
      columnPinning: { left: [], right: [] },
      order,
      side: 'right',
    });
    expect(result).toEqual(['id', 'name', 'status']);
  });

  it('does not mutate input order', () => {
    const order: readonly TestDataKey[] = ['id', 'name', 'age'];

    const result = insertAdjacentToPinnedGroup<TestRow>({
      columnKey: 'status',
      columnPinning: { left: ['id'], right: [] },
      order,
      side: 'left',
    });

    expect(order).toEqual(['id', 'name', 'age']);
    expect(result).toEqual(['id', 'status', 'name', 'age']);
    expect(result).not.toBe(order);
  });
});
