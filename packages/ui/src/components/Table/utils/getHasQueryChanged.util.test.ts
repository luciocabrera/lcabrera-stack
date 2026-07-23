import type { TableColumnsState } from '@lcabrera/ui/components/Table/Table.types';

import { describe, expect, it } from 'vite-plus/test';

import { getHasQueryChanged } from './getHasQueryChanged.util';

type Row = {
  readonly id: string;
  readonly name: string;
};

const emptyColumnFilters =
  {} as unknown as TableColumnsState<Row>['columnFilters'];

const emptySorting = [] as TableColumnsState<Row>['sorting'];

describe('getHasQueryChanged', () => {
  it('returns false when filters and sorting are unchanged', () => {
    const columnsState = {
      columnFilters: emptyColumnFilters,
      sorting: emptySorting,
    } satisfies Partial<TableColumnsState<Row>>;

    const result = getHasQueryChanged<Row>({
      columnsState,
      nextColumnFilters: emptyColumnFilters,
      nextSorting: emptySorting,
    });

    expect(result).toBe(false);
  });

  it('returns true when sorting changes', () => {
    const columnsState = {
      columnFilters: emptyColumnFilters,
      sorting: emptySorting,
    } satisfies Partial<TableColumnsState<Row>>;

    const result = getHasQueryChanged<Row>({
      columnsState,
      nextColumnFilters: emptyColumnFilters,
      nextSorting: [{ columnKey: 'name', direction: 'desc' }],
    });

    expect(result).toBe(true);
  });

  it('returns true when filters change', () => {
    const columnsState = {
      columnFilters: emptyColumnFilters,
      sorting: emptySorting,
    } satisfies Partial<TableColumnsState<Row>>;

    const nextColumnFilters = {
      name: {
        operator: 'contains',
        type: 'text',
        value: 'ali',
      },
    } as unknown as TableColumnsState<Row>['columnFilters'];

    const result = getHasQueryChanged<Row>({
      columnsState,
      nextColumnFilters,
      nextSorting: emptySorting,
    });

    expect(result).toBe(true);
  });
});
