// @vitest-environment jsdom
// Dispatch + wiring tests for useReorderColumns.
// The order/pinning utils are exercised for real here (not mocked) so the pin-side
// recalculation and conflict-detection branches this hook feeds are covered end to end.

import type { OrderConflictResolution } from '@lcabrera/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useReorderColumns } from './useReorderColumns.hook';

const CONFLICT_DESCRIPTION =
  'Dragging this column broke the pinning layout. Pinned columns must stay at the edges. Choose how to proceed:';

type Pinning = {
  readonly left: readonly string[];
  readonly right: readonly string[];
};

const {
  drawerColumnsStore,
  getPreference,
  mockAcceptOrderConflict,
  modalsStore,
  setDrawerState,
  setPreference,
  setTableColumnsState,
  tableColumnsStore,
} = vi.hoisted(() => {
  let drawerState:
    | undefined
    | {
        readonly columnOrder?: readonly string[];
        readonly columnPinning?: {
          readonly left: readonly string[];
          readonly right: readonly string[];
        };
      };
  let preference: OrderConflictResolution | undefined;
  let tableState: undefined | { readonly staticKeys?: Set<string> };

  return {
    drawerColumnsStore: {
      get: vi.fn(() => drawerState),
      set: vi.fn(),
    },
    getPreference: () => preference,
    mockAcceptOrderConflict: vi.fn(),
    modalsStore: {
      set: vi.fn(),
    },
    setDrawerState: (next: typeof drawerState) => {
      drawerState = next;
    },
    setPreference: (next: OrderConflictResolution | undefined) => {
      preference = next;
    },
    setTableColumnsState: (next: typeof tableState) => {
      tableState = next;
    },
    tableColumnsStore: {
      get: vi.fn(() => tableState),
    },
  };
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

vi.mock('@lcabrera/ui/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalOrderConflictResolutionPreference: () => getPreference(),
}));

vi.mock('./useAcceptOrderConflict.hook', () => ({
  useAcceptOrderConflict: () => mockAcceptOrderConflict,
}));

const toDraggableItems = (keys: readonly string[]) =>
  keys.map((key) => ({ content: undefined, id: key }));

const reorderColumns = ({
  columnOrder,
  columnPinning,
  newOrder,
  staticKeys,
}: {
  readonly columnOrder?: readonly string[];
  readonly columnPinning?: Pinning;
  readonly newOrder: readonly string[];
  readonly staticKeys?: readonly string[];
}) => {
  setDrawerState(
    columnOrder || columnPinning ? { columnOrder, columnPinning } : undefined,
  );
  setTableColumnsState(
    staticKeys ? { staticKeys: new Set(staticKeys) } : undefined,
  );

  const { result } = renderHook(() => useReorderColumns());

  act(() => {
    result.current(toDraggableItems(newOrder));
  });
};

describe('useReorderColumns', () => {
  beforeEach(() => {
    setDrawerState(undefined);
    setTableColumnsState(undefined);
    setPreference(undefined);
    drawerColumnsStore.set.mockClear();
    modalsStore.set.mockClear();
    mockAcceptOrderConflict.mockClear();
  });

  it('applies a conflict-free reorder straight to the drawer store', () => {
    reorderColumns({
      columnOrder: ['id', 'status', 'notes'],
      columnPinning: { left: [], right: [] },
      newOrder: ['status', 'id', 'notes'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['status', 'id', 'notes'],
      columnPinning: { left: [], right: [] },
    });
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('re-pins a right-pinned column to the left when dragged to the left edge', () => {
    reorderColumns({
      columnOrder: ['id', 'status', 'notes', 'extra'],
      columnPinning: { left: [], right: ['extra'] },
      newOrder: ['extra', 'id', 'status', 'notes'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['extra', 'id', 'status', 'notes'],
      columnPinning: { left: ['extra'], right: [] },
    });
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('restores static columns to their original position before applying', () => {
    reorderColumns({
      columnOrder: ['actions', 'id', 'status'],
      columnPinning: { left: [], right: [] },
      newOrder: ['status', 'id', 'actions'],
      staticKeys: ['actions'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['actions', 'status', 'id'],
      columnPinning: { left: [], right: [] },
    });
  });

  it('keeps a static column pinned on its original side', () => {
    reorderColumns({
      columnOrder: ['actions', 'id', 'status'],
      columnPinning: { left: ['actions'], right: [] },
      newOrder: ['status', 'id', 'actions'],
      staticKeys: ['actions'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['actions', 'status', 'id'],
      columnPinning: { left: ['actions'], right: [] },
    });
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('opens the conflict modal when a pin layout breaks and no preference is set', () => {
    reorderColumns({
      columnOrder: ['id', 'status', 'notes', 'extra'],
      columnPinning: { left: ['id'], right: [] },
      newOrder: ['status', 'id', 'notes', 'extra'],
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
    expect(modalsStore.set).toHaveBeenCalledWith({
      orderConflict: {
        description: CONFLICT_DESCRIPTION,
        isOpen: true,
        pendingOrder: ['status', 'id', 'notes', 'extra'],
        pendingPinning: { left: ['id'], right: [] },
      },
    });
    expect(mockAcceptOrderConflict).not.toHaveBeenCalled();
  });

  it('auto-accepts the conflict with a closed modal when a preference is set', () => {
    setPreference('reset-all-pins');

    reorderColumns({
      columnOrder: ['id', 'status', 'notes', 'extra'],
      columnPinning: { left: ['id'], right: [] },
      newOrder: ['status', 'id', 'notes', 'extra'],
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
    expect(modalsStore.set).toHaveBeenCalledWith({
      orderConflict: {
        description: CONFLICT_DESCRIPTION,
        isOpen: false,
        pendingOrder: ['status', 'id', 'notes', 'extra'],
        pendingPinning: { left: ['id'], right: [] },
      },
    });
    expect(mockAcceptOrderConflict).toHaveBeenCalledWith('reset-all-pins');
  });

  it('forwards each configured preference to the accept handler', () => {
    setPreference('remove-conflicting-pins');

    reorderColumns({
      columnOrder: ['id', 'status', 'notes', 'extra'],
      columnPinning: { left: ['id'], right: [] },
      newOrder: ['status', 'id', 'notes', 'extra'],
    });

    expect(mockAcceptOrderConflict).toHaveBeenCalledWith(
      'remove-conflicting-pins',
    );
  });

  it('skips static restoration when the drawer holds no current order', () => {
    reorderColumns({
      newOrder: ['status', 'id'],
      staticKeys: ['actions'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['status', 'id'],
      columnPinning: { left: [], right: [] },
    });
  });

  it('defaults pinning to empty edges when the drawer holds no pinning', () => {
    reorderColumns({
      columnOrder: ['id', 'status'],
      newOrder: ['status', 'id'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['status', 'id'],
      columnPinning: { left: [], right: [] },
    });
  });

  it('falls back to empty static keys when the table config store is empty', () => {
    reorderColumns({
      columnOrder: ['id', 'status'],
      columnPinning: { left: [], right: [] },
      newOrder: ['status', 'id'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['status', 'id'],
      columnPinning: { left: [], right: [] },
    });
  });

  it('drops pins for columns that disappeared from the new order', () => {
    reorderColumns({
      columnOrder: ['id', 'status', 'notes'],
      columnPinning: { left: ['gone'], right: [] },
      newOrder: ['status', 'id', 'notes'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['status', 'id', 'notes'],
      columnPinning: { left: [], right: [] },
    });
  });

  it('applies an empty order when every item is dragged away', () => {
    reorderColumns({
      columnOrder: ['id', 'status'],
      columnPinning: { left: [], right: [] },
      newOrder: [],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: [],
      columnPinning: { left: [], right: [] },
    });
  });
});
