// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useSortByColumnOrder } from './useSortByColumnOrder.hook';

type TestColumn = {
  readonly isSortable?: boolean;
  readonly key: string;
};

const {
  drawerColumnsStore,
  setDrawerState,
  setTableColumnsState,
  tableColumnsStore,
} = vi.hoisted(() => {
  let columnsState: undefined | { readonly columns: readonly unknown[] };
  let drawerState: undefined | { readonly columnOrder?: readonly string[] };

  return {
    drawerColumnsStore: {
      get: vi.fn(() => drawerState),
      set: vi.fn(),
    },
    setDrawerState: (next: typeof drawerState) => {
      drawerState = next;
    },
    setTableColumnsState: (next: typeof columnsState) => {
      columnsState = next;
    },
    tableColumnsStore: {
      get: vi.fn(() => columnsState),
    },
  };
});

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

const sortByColumnOrder = ({
  columnOrder,
  columns,
}: {
  readonly columnOrder?: readonly string[];
  readonly columns?: readonly TestColumn[];
}) => {
  setTableColumnsState(columns ? { columns } : undefined);
  setDrawerState(columnOrder ? { columnOrder } : undefined);

  const { result } = renderHook(() => useSortByColumnOrder());

  act(() => {
    result.current();
  });
};

describe('useSortByColumnOrder', () => {
  beforeEach(() => {
    setTableColumnsState(undefined);
    setDrawerState(undefined);
    drawerColumnsStore.set.mockClear();
  });

  it('sorts every sortable column ascending, following the column order', () => {
    sortByColumnOrder({
      columnOrder: ['status', 'id'],
      columns: [{ key: 'id' }, { key: 'status' }],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      sorting: [
        { columnKey: 'status', direction: 'asc' },
        { columnKey: 'id', direction: 'asc' },
      ],
    });
  });

  it('falls back to definition order when no column order is set', () => {
    sortByColumnOrder({ columns: [{ key: 'id' }, { key: 'status' }] });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      sorting: [
        { columnKey: 'id', direction: 'asc' },
        { columnKey: 'status', direction: 'asc' },
      ],
    });
  });

  it('excludes non-sortable columns and the actions column', () => {
    sortByColumnOrder({
      columns: [
        { key: 'id' },
        { isSortable: false, key: 'notes' },
        { key: 'actions' },
      ],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      sorting: [{ columnKey: 'id', direction: 'asc' }],
    });
  });

  it('drops ordered keys that match no sortable column', () => {
    sortByColumnOrder({
      columnOrder: ['status', 'actions', 'gone'],
      columns: [{ key: 'id' }, { key: 'status' }, { key: 'actions' }],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      sorting: [{ columnKey: 'status', direction: 'asc' }],
    });
  });

  it('sorts nothing when the table config store is still empty', () => {
    sortByColumnOrder({});

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({ sorting: [] });
  });
});
