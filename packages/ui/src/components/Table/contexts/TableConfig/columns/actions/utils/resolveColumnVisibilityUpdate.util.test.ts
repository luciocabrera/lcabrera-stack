import type { ColumnVisibilityState } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { resolveColumnVisibilityUpdate } from './resolveColumnVisibilityUpdate.util';

type TData = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

describe('resolveColumnVisibilityUpdate', () => {
  it('adds the column key when hiding a visible column', () => {
    const result = resolveColumnVisibilityUpdate<TData>({
      columnKey: 'name',
      columnVisibility: new Set(),
      isVisible: false,
    });

    expect(result).toEqual(new Set(['name']));
  });

  it('removes the column key when showing a hidden column', () => {
    const result = resolveColumnVisibilityUpdate<TData>({
      columnKey: 'name',
      columnVisibility: new Set(['age', 'name']),
      isVisible: true,
    });

    expect(result).toEqual(new Set(['age']));
  });

  it('defaults to an empty Set when columnVisibility is undefined', () => {
    const result = resolveColumnVisibilityUpdate<TData>({
      columnKey: 'id',
      isVisible: false,
    });

    expect(result).toEqual(new Set(['id']));
  });

  it('does not mutate the input Set', () => {
    const original: ColumnVisibilityState<TData> = new Set(['age']);

    resolveColumnVisibilityUpdate<TData>({
      columnKey: 'name',
      columnVisibility: original,
      isVisible: false,
    });

    expect(original).toEqual(new Set(['age']));
  });
});
