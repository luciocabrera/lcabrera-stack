// @vitest-environment jsdom
// Dispatch behavior tests for useToggleColumnPin.
// Business logic for each resolution kind is covered in resolveToggleColumnPinUpdate.util.test.ts.

import { createColumnOrderSectionActionMocks } from '@repo/ui/utils/tests/createColumnOrderSectionActionMocks.util';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useToggleColumnPin } from './useToggleColumnPin.hook';

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

const mockAcceptPinSide = vi.fn();
const mockAcceptUnpinConflict = vi.fn();

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);
vi.mock(
  '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/useTableDrawerContextValue.hook',
  () => ({
    useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
  }),
);
vi.mock('../useColumnOrderSectionContextValue.hook', () => ({
  useColumnOrderSectionContextValue: () => ({ modalsStore }),
}));
vi.mock(
  '@repo/ui/contexts/GlobalSettingsContext/selectors/useGetGlobalPinSidePreference.hook',
  () => ({ useGetGlobalPinSidePreference: () => {} }),
);
vi.mock(
  '@repo/ui/contexts/GlobalSettingsContext/selectors/useGetGlobalUnpinConflictResolutionPreference.hook',
  () => ({ useGetGlobalUnpinConflictResolutionPreference: () => {} }),
);
vi.mock('./useAcceptPinSide.hook', () => ({
  useAcceptPinSide: () => mockAcceptPinSide,
}));
vi.mock('./useAcceptUnpinConflict.hook', () => ({
  useAcceptUnpinConflict: () => mockAcceptUnpinConflict,
}));
vi.mock('./utils/resolveToggleColumnPinUpdate.util');

import { resolveToggleColumnPinUpdate } from './utils/resolveToggleColumnPinUpdate.util';
const mockResolve = vi.mocked(resolveToggleColumnPinUpdate);

const MODAL_RESULT = {
  columnKey: 'id' as const,
  columnLabel: 'ID',
  isOpen: true as const,
};
const UNPIN_MODAL_RESULT = { ...MODAL_RESULT, side: 'left' as const };

describe('useToggleColumnPin', () => {
  beforeEach(() => {
    resetMocks();
    mockAcceptPinSide.mockClear();
    mockAcceptUnpinConflict.mockClear();
  });

  it('does nothing when column is static (ignored-static)', () => {
    mockResolve.mockReturnValue({ kind: 'ignored-static' });
    const { result } = renderHook(() => useToggleColumnPin());

    act(() => {
      result.current({ columnKey: 'id', isPinning: true });
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('sets pinning directly for apply-pinning-direct', () => {
    const nextPinning = { left: ['id' as const], right: [] };
    mockResolve.mockReturnValue({ kind: 'apply-pinning-direct', nextPinning });
    const { result } = renderHook(() => useToggleColumnPin());

    act(() => {
      result.current({ columnKey: 'id', isPinning: true });
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnPinning: nextPinning,
    });
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('opens pin-side modal for open-pin-side-modal', () => {
    mockResolve.mockReturnValue({
      kind: 'open-pin-side-modal',
      modal: MODAL_RESULT,
    });
    const { result } = renderHook(() => useToggleColumnPin());

    act(() => {
      result.current({ columnKey: 'id', isPinning: true });
    });

    expect(modalsStore.set).toHaveBeenCalledWith({
      pinSideModal: MODAL_RESULT,
    });
    expect(mockAcceptPinSide).not.toHaveBeenCalled();
  });

  it('sets modal and auto-accepts pin side for auto-accept-pin-side', () => {
    mockResolve.mockReturnValue({
      kind: 'auto-accept-pin-side',
      modal: MODAL_RESULT,
      pinSide: 'left',
    });
    const { result } = renderHook(() => useToggleColumnPin());

    act(() => {
      result.current({ columnKey: 'id', isPinning: true });
    });

    expect(modalsStore.set).toHaveBeenCalledWith({
      pinSideModal: MODAL_RESULT,
    });
    expect(mockAcceptPinSide).toHaveBeenCalledWith('left');
  });

  it('opens unpin-conflict modal for open-unpin-conflict-modal', () => {
    mockResolve.mockReturnValue({
      kind: 'open-unpin-conflict-modal',
      modal: UNPIN_MODAL_RESULT,
    });
    const { result } = renderHook(() => useToggleColumnPin());

    act(() => {
      result.current({ columnKey: 'id', isPinning: false });
    });

    expect(modalsStore.set).toHaveBeenCalledWith({
      unpinConflictModal: UNPIN_MODAL_RESULT,
    });
    expect(mockAcceptUnpinConflict).not.toHaveBeenCalled();
  });

  it('sets modal and auto-accepts unpin conflict for auto-accept-unpin-conflict', () => {
    mockResolve.mockReturnValue({
      kind: 'auto-accept-unpin-conflict',
      modal: UNPIN_MODAL_RESULT,
      resolution: 'reorder-to-fill',
    });
    const { result } = renderHook(() => useToggleColumnPin());

    act(() => {
      result.current({ columnKey: 'id', isPinning: false });
    });

    expect(modalsStore.set).toHaveBeenCalledWith({
      unpinConflictModal: UNPIN_MODAL_RESULT,
    });
    expect(mockAcceptUnpinConflict).toHaveBeenCalledWith('reorder-to-fill');
  });
});
