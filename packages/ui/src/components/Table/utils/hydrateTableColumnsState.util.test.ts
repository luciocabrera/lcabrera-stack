import type { TableColumnsStateInput } from '@repo/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import { hydrateTableColumnsState } from './hydrateTableColumnsState.util';

type TestColumnsState = TableColumnsStateInput<TestRow>;

type TestRow = {
  readonly customer_name: string;
  readonly order_id: number;
};

const TEST_COLUMNS = [
  { key: 'order_id' as const, label: 'Order ID' },
  {
    isResizable: false,
    isStatic: true,
    key: 'actions' as const,
    label: 'Actions',
  },
];

const createBaseColumnsState = (): TestColumnsState => ({
  columnFilters: {} as TestColumnsState['columnFilters'],
  columnOrder: [],
  columnPinning: { left: [], right: ['actions'] },
  columns: [],
  columnSizing: {} as TestColumnsState['columnSizing'],
  columnVisibility: new Set(),
  sorting: [],
});

describe('hydrateTableColumnsState', () => {
  it('replaces loader columns with the full client columns', () => {
    const state = createBaseColumnsState();

    const result = hydrateTableColumnsState<TestRow>({
      columns: TEST_COLUMNS,
      columnsState: state,
    });

    expect(result.columns).toBe(TEST_COLUMNS);
  });

  it('forces the actions column to be pinned on the right', () => {
    const state: TestColumnsState = {
      ...createBaseColumnsState(),
      columnPinning: {
        left: ['actions', 'order_id'],
        right: ['customer_name'],
      },
    };

    const result = hydrateTableColumnsState<TestRow>({
      columns: TEST_COLUMNS,
      columnsState: state,
    });

    expect(result.columnPinning.left).toEqual(['order_id']);
    expect(result.columnPinning.right).toEqual(['customer_name', 'actions']);
  });

  it('preserves loader-derived table state slices', () => {
    const state: TestColumnsState = {
      ...createBaseColumnsState(),
      columnFilters: {
        order_id: {
          operator: 'equals',
          type: 'number',
          value: 1,
        },
      } as unknown as TestColumnsState['columnFilters'],
      columnOrder: ['order_id', 'actions'],
      sorting: [{ columnKey: 'order_id', direction: 'desc' }],
    };

    const result = hydrateTableColumnsState<TestRow>({
      columns: TEST_COLUMNS,
      columnsState: state,
    });

    expect(result.columnOrder).toEqual(['order_id', 'actions']);
    expect(result.columnFilters).toEqual({
      order_id: {
        operator: 'equals',
        type: 'number',
        value: 1,
      },
    });
    expect(result.sorting).toEqual([
      {
        columnKey: 'order_id',
        direction: 'desc',
      },
    ]);
  });
});
