// @vitest-environment jsdom
// Dispatch behavior tests for useOrderBySorting.
// Business logic is covered in resolveOrderConflictUpdate.util.test.ts.

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createColumnOrderSectionActionMocks } from '#ui/utils/tests/createColumnOrderSectionActionMocks.util';

import { useOrderBySorting } from './useOrderBySorting.hook';

const { drawerColumnsStore, modalsStore, resetMocks, tableColumnsStore } =
  createColumnOrderSectionActionMocks({
    initialDrawerState: {
      columnFilters: {},
      columnOrder: ['id', 'name', 'age'],
      columnPinning: { left: [], right: [] },
      columnSizing: {},
      columnVisibility: new Set<string>(),
      sorting: [{ columnKey: 'name', direction: 'asc' }],
    },
    initialModalsState: {
      conflictModal: {
        columnKey: 'id',
        columnLabel: '',
        isOpen: false,
        side: 'left',
      },
      orderConflict: {
        description: '',
        isOpen: false,
        pendingOrder: [],
        pendingPinning: { left: [], right: [] },
      },
      pinSideModal: { columnKey: 'id', columnLabel: '', isOpen: false },
      unpinConflictModal: {
        columnKey: 'id',
        columnLabel: '',
        isOpen: false,
        side: 'left',
      },
    },
    initialTableState: {
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'age', label: 'Age' },
      ],
      normalizedColumns: {},
      staticKeys: new Set<string>(),
    },
  });

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);
vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook',
  () => ({
    useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
  }),
);
vi.mock('../useColumnOrderSectionContextValue.hook', () => ({
  useColumnOrderSectionContextValue: () => ({ modalsStore }),
}));
vi.mock('#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils');

import { restoreStaticColumnOrder } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

import { resolveOrderConflictUpdate } from './utils/resolveOrderConflictUpdate.util';

vi.mock('./utils/resolveOrderConflictUpdate.util');

const mockRestoreStaticColumnOrder = vi.mocked(restoreStaticColumnOrder);
const mockResolveOrderConflictUpdate = vi.mocked(resolveOrderConflictUpdate);

describe('useOrderBySorting', () => {
  beforeEach(() => {
    resetMocks();
    mockRestoreStaticColumnOrder.mockImplementation(({ newOrder }) => newOrder);
  });

  it('applies sorted order directly for apply-order', () => {
    const reorderedOrder = ['name', 'id', 'age'];
    mockRestoreStaticColumnOrder.mockReturnValue(reorderedOrder);
    mockResolveOrderConflictUpdate.mockReturnValue({
      kind: 'apply-order',
      newOrder: reorderedOrder,
      pendingPinning: { left: [], right: [] },
    } as unknown as ReturnType<typeof resolveOrderConflictUpdate>);

    const { result } = renderHook(() => useOrderBySorting());

    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: reorderedOrder,
    });
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('opens order conflict modal when conflict is detected', () => {
    const orderConflict = {
      description: 'Conflict detected',
      isOpen: true,
      pendingOrder: ['name', 'id', 'age'],
      pendingPinning: { left: [], right: [] },
    };
    mockResolveOrderConflictUpdate.mockReturnValue({
      kind: 'open-conflict',
      orderConflict,
    } as unknown as ReturnType<typeof resolveOrderConflictUpdate>);

    const { result } = renderHook(() => useOrderBySorting());

    act(() => {
      result.current();
    });

    expect(modalsStore.set).toHaveBeenCalledWith({ orderConflict });
    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
  });
});
