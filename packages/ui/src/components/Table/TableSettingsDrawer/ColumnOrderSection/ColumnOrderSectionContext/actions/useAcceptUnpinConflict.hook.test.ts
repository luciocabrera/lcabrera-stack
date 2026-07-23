// @vitest-environment jsdom
// Dispatch behavior tests for useAcceptUnpinConflict.
// Business logic is covered in resolveAcceptedUnpinConflictState.util.test.ts.

import { createColumnOrderSectionActionMocks } from '@lcabrera/ui/utils/tests/createColumnOrderSectionActionMocks.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useAcceptUnpinConflict } from './useAcceptUnpinConflict.hook';

const UNPIN_CONFLICT_MODAL = {
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
      columnPinning: { left: ['name' as const], right: [] },
      columnSizing: {},
      columnVisibility: new Set<string>(),
      sorting: [],
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
      unpinConflictModal: UNPIN_CONFLICT_MODAL,
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
  '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);
vi.mock(
  '@lcabrera/ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook',
  () => ({
    useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
  }),
);
vi.mock('../useColumnOrderSectionContextValue.hook', () => ({
  useColumnOrderSectionContextValue: () => ({ modalsStore }),
}));
vi.mock('./utils/resolveAcceptedUnpinConflictState.util');

import { resolveAcceptedUnpinConflictState } from './utils/resolveAcceptedUnpinConflictState.util';

const mockResolve = vi.mocked(resolveAcceptedUnpinConflictState);

describe('useAcceptUnpinConflict', () => {
  beforeEach(() => {
    resetMocks();
    modalsStore._state = {
      ...modalsStore._state,
      unpinConflictModal: UNPIN_CONFLICT_MODAL,
    };
  });

  it('returns early when unpinConflictModal is absent', () => {
    (modalsStore.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      undefined,
    );

    const { result } = renderHook(() => useAcceptUnpinConflict());

    act(() => {
      result.current('reorder-to-fill');
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
  });

  it('sets only columnPinning for update-pinning resolution', () => {
    const newPinning = { left: [], right: [] };
    mockResolve.mockReturnValue({
      columnPinning: newPinning,
      kind: 'update-pinning',
    });

    const { result } = renderHook(() => useAcceptUnpinConflict());

    act(() => {
      result.current('reorder-to-fill');
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnPinning: newPinning,
    });
    expect(modalsStore.set).toHaveBeenCalledWith({
      unpinConflictModal: { ...UNPIN_CONFLICT_MODAL, isOpen: false },
    });
  });

  it('sets columnOrder and columnPinning for update-order-and-pinning', () => {
    const newPinning = { left: [], right: [] };
    const newOrder = ['name', 'id'];
    mockResolve.mockReturnValue({
      columnOrder: newOrder,
      columnPinning: newPinning,
      kind: 'update-order-and-pinning',
    });

    const { result } = renderHook(() => useAcceptUnpinConflict());

    act(() => {
      result.current('unpin-beyond' as const);
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: newOrder,
      columnPinning: newPinning,
    });
    expect(modalsStore.set).toHaveBeenCalledWith({
      unpinConflictModal: { ...UNPIN_CONFLICT_MODAL, isOpen: false },
    });
  });
});
