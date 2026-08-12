// @vitest-environment jsdom
// Dispatch behavior tests for useAcceptPinConflict.
// Business logic is covered in resolvePinConflictState.util.test.ts.

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createColumnOrderSectionActionMocks } from '#ui/utils/tests/createColumnOrderSectionActionMocks.util';

import { useAcceptPinConflict } from './useAcceptPinConflict.hook';

const CONFLICT_MODAL = {
  columnKey: 'name' as const,
  columnLabel: 'Name',
  isOpen: true,
  side: 'left' as const,
};

const { drawerColumnsStore, modalsStore, resetMocks, tableColumnsStore } =
  createColumnOrderSectionActionMocks({
    initialDrawerState: {
      columnFilters: {},
      columnOrder: ['id', 'name'],
      columnPinning: { left: [], right: [] },
      columnSizing: {},
      columnVisibility: new Set<string>(),
      sorting: [],
    },
    initialModalsState: {
      conflictModal: CONFLICT_MODAL,
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

import type { TableColumn } from '#ui/components/Table/Table.types';

import {
  buildAllOrderedColumns,
  resolvePinConflictState,
} from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

const mockBuildAllOrderedColumns = vi.mocked(buildAllOrderedColumns);
const mockResolvePinConflictState = vi.mocked(resolvePinConflictState);

const ORDERED_COLUMNS: TableColumn<Record<string, unknown>>[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
];

describe('useAcceptPinConflict', () => {
  beforeEach(() => {
    resetMocks();
    modalsStore._state = {
      ...modalsStore._state,
      conflictModal: CONFLICT_MODAL,
    };
    mockBuildAllOrderedColumns.mockReturnValue(ORDERED_COLUMNS as never);
  });

  it('returns early when conflictModal is absent', () => {
    (modalsStore.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      undefined,
    );

    const { result } = renderHook(() => useAcceptPinConflict());

    act(() => {
      result.current('move-column');
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
  });

  it('sets drawer column order and pinning after resolving conflict', () => {
    const nextOrder = ['id', 'name'];
    const nextPinning = { left: ['name' as const], right: [] };
    mockResolvePinConflictState.mockReturnValue({
      columnOrder: nextOrder,
      columnPinning: nextPinning,
    } as unknown as ReturnType<typeof resolvePinConflictState>);

    const { result } = renderHook(() => useAcceptPinConflict());

    act(() => {
      result.current('move-column');
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: nextOrder,
      columnPinning: nextPinning,
    });
    expect(modalsStore.set).toHaveBeenCalledWith({
      conflictModal: { ...CONFLICT_MODAL, isOpen: false },
    });
  });
});
