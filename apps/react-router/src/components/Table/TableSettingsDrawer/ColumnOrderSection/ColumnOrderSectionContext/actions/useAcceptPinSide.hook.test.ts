// @vitest-environment jsdom
// Dispatch behavior tests for useAcceptPinSide.
// Business logic for each resolution kind is covered in resolveAcceptedPinSideUpdate.util.test.ts.

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createColumnOrderSectionActionMocks } from '@/utils/tests/createColumnOrderSectionActionMocks.util';

import { useAcceptPinSide } from './useAcceptPinSide.hook';

const PIN_SIDE_MODAL = {
  columnKey: 'name' as const,
  columnLabel: 'Name',
  isOpen: true,
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
      pinSideModal: PIN_SIDE_MODAL,
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

const mockAcceptPinConflict = vi.fn();

vi.mock(
  '@/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);
vi.mock(
  '@/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook',
  () => ({
    useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
  }),
);
vi.mock('../useColumnOrderSectionContextValue.hook', () => ({
  useColumnOrderSectionContextValue: () => ({ modalsStore }),
}));
vi.mock('@/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalPinConflictResolutionPreference: () => {},
}));
vi.mock('./useAcceptPinConflict.hook', () => ({
  useAcceptPinConflict: () => mockAcceptPinConflict,
}));
vi.mock('./utils/resolveAcceptedPinSideUpdate.util');

import { resolveAcceptedPinSideUpdate } from './utils/resolveAcceptedPinSideUpdate.util';

const mockResolve = vi.mocked(resolveAcceptedPinSideUpdate);

describe('useAcceptPinSide', () => {
  beforeEach(() => {
    resetMocks();
    mockAcceptPinConflict.mockClear();
    // Restore pinSideModal so the guard passes
    modalsStore._state = {
      ...modalsStore._state,
      pinSideModal: PIN_SIDE_MODAL,
    };
  });

  it('returns early when pinSideModal is not open', () => {
    modalsStore._state = {
      ...modalsStore._state,
      pinSideModal: { columnKey: 'id', columnLabel: '', isOpen: false },
    };
    // modalsStore.get returns undefined to simulate missing modal
    (modalsStore.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      undefined,
    );

    const { result } = renderHook(() => useAcceptPinSide());

    act(() => {
      result.current('left');
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('applies resolved order and pinning for apply-resolved', () => {
    const resolvedColumnOrder = ['id', 'name'];
    const resolvedPinning = { left: ['name' as const], right: [] };
    mockResolve.mockReturnValue({
      columnOrder: resolvedColumnOrder,
      columnPinning: resolvedPinning,
      kind: 'apply-resolved',
    });

    const { result } = renderHook(() => useAcceptPinSide());

    act(() => {
      result.current('left');
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: resolvedColumnOrder,
      columnPinning: resolvedPinning,
    });
    expect(modalsStore.set).toHaveBeenCalledWith({
      pinSideModal: { ...PIN_SIDE_MODAL, isOpen: false },
    });
    expect(mockAcceptPinConflict).not.toHaveBeenCalled();
  });

  it('opens conflict modal for open-conflict-modal', () => {
    const conflictModal = {
      columnKey: 'name' as const,
      columnLabel: 'Name',
      isOpen: true as const,
      side: 'left' as const,
    };
    mockResolve.mockReturnValue({ conflictModal, kind: 'open-conflict-modal' });

    const { result } = renderHook(() => useAcceptPinSide());

    act(() => {
      result.current('left');
    });

    expect(modalsStore.set).toHaveBeenCalledWith({ conflictModal });
    expect(modalsStore.set).toHaveBeenCalledWith({
      pinSideModal: { ...PIN_SIDE_MODAL, isOpen: false },
    });
    expect(mockAcceptPinConflict).not.toHaveBeenCalled();
  });

  it('opens closed conflict modal and auto-accepts conflict for auto-accept-conflict', () => {
    const conflictModal = {
      columnKey: 'name' as const,
      columnLabel: 'Name',
      isOpen: false as const,
      side: 'left' as const,
    };
    mockResolve.mockReturnValue({
      conflictModal,
      kind: 'auto-accept-conflict',
      resolution: 'move-column',
    });

    const { result } = renderHook(() => useAcceptPinSide());

    act(() => {
      result.current('left');
    });

    expect(modalsStore.set).toHaveBeenCalledWith({ conflictModal });
    expect(mockAcceptPinConflict).toHaveBeenCalledWith('move-column');
    expect(modalsStore.set).toHaveBeenCalledWith({
      pinSideModal: { ...PIN_SIDE_MODAL, isOpen: false },
    });
  });

  it('passes safe defaults into resolver when table and drawer states are missing', () => {
    (tableColumnsStore.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      undefined,
    );
    (drawerColumnsStore.get as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      undefined,
    );
    mockResolve.mockReturnValue({
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      kind: 'apply-resolved',
    });

    const { result } = renderHook(() => useAcceptPinSide());

    act(() => {
      result.current('left');
    });

    expect(mockResolve).toHaveBeenCalledWith({
      columnKey: PIN_SIDE_MODAL.columnKey,
      columnPinning: { left: [], right: [] },
      columns: [],
      columnsOrder: [],
      pinConflictResolutionPreference: undefined,
      pinSide: 'left',
      staticKeys: undefined,
    });
  });
});
