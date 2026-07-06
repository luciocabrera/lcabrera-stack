import type { TableColumnsState } from '@repo/ui/components/Table/Table.types';

import { describe, expect, it } from 'vitest';

import type { EnterpriseOrder } from '@/services';

import { COLUMNS } from './EnterpriseOrders.constants';
import { hydrateEnterpriseOrdersColumnsState } from './hydrateEnterpriseOrdersColumnsState.util';

type LoaderColumnsState = Omit<
  TableColumnsState<EnterpriseOrder>,
  | 'columnGroups'
  | 'effectiveColumns'
  | 'normalizedColumns'
  | 'pinnedColumnOffsets'
  | 'staticKeys'
>;

const createBaseColumnsState = (): LoaderColumnsState => ({
  columnFilters: {} as LoaderColumnsState['columnFilters'],
  columnOrder: [],
  columnPinning: { left: [], right: ['actions'] },
  columns: [],
  columnSizing: {} as LoaderColumnsState['columnSizing'],
  columnVisibility: new Set(),
  sorting: [],
});

describe('hydrateEnterpriseOrdersColumnsState', () => {
  it('replaces loader columns with full client columns', () => {
    const state = createBaseColumnsState();

    const result = hydrateEnterpriseOrdersColumnsState(state);

    expect(result.columns).toBe(COLUMNS);
  });

  it('forces actions column to be pinned on the right', () => {
    const state: LoaderColumnsState = {
      ...createBaseColumnsState(),
      columnPinning: {
        left: ['actions', 'order_id'],
        right: ['customer_name'],
      },
    };

    const result = hydrateEnterpriseOrdersColumnsState(state);

    expect(result.columnPinning.left).toEqual(['order_id']);
    expect(result.columnPinning.right).toEqual(['customer_name', 'actions']);
  });

  it('keeps actions column definition non-resizable and static', () => {
    const state = createBaseColumnsState();

    const result = hydrateEnterpriseOrdersColumnsState(state);
    const actionsColumn = result.columns.find(
      (column) => column.key === 'actions',
    );

    expect(actionsColumn?.isResizable).toBe(false);
    expect(actionsColumn?.isStatic).toBe(true);
  });

  it('preserves loader-derived table state slices', () => {
    const state: LoaderColumnsState = {
      ...createBaseColumnsState(),
      columnFilters: {
        order_number: {
          operator: 'contains',
          type: 'string',
          value: 'SO-',
        },
      } as unknown as LoaderColumnsState['columnFilters'],
      columnOrder: ['order_id', 'actions'],
      sorting: [{ columnKey: 'order_id', direction: 'desc' }],
    };

    const result = hydrateEnterpriseOrdersColumnsState(state);

    expect(result.columnOrder).toEqual(['order_id', 'actions']);
    expect(result.columnFilters).toEqual({
      order_number: {
        operator: 'contains',
        type: 'string',
        value: 'SO-',
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
