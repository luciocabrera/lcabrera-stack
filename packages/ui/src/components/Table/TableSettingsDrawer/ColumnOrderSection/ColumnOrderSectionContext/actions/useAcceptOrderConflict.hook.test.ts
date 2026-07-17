// @vitest-environment jsdom
// Dispatch + wiring tests for useAcceptOrderConflict.
// The resolution utils are exercised for real here (not mocked) so the static-key
// and per-resolution branches this hook feeds are covered end to end.

import type { OrderConflictResolution } from '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAcceptOrderConflict } from './useAcceptOrderConflict.hook';

type OrderConflict = {
  readonly description: string;
  readonly isOpen: boolean;
  readonly pendingOrder: readonly string[];
  readonly pendingPinning: Pinning;
};

type Pinning = {
  readonly left: readonly string[];
  readonly right: readonly string[];
};

const {
  drawerColumnsStore,
  modalsStore,
  setDrawerState,
  setModalsState,
  setTableColumnsState,
  tableColumnsStore,
} = vi.hoisted(() => {
  let drawerState: undefined | { readonly columnOrder?: readonly string[] };
  let modalsState:
    | undefined
    | {
        readonly orderConflict?: {
          readonly description: string;
          readonly isOpen: boolean;
          readonly pendingOrder: readonly string[];
          readonly pendingPinning: {
            readonly left: readonly string[];
            readonly right: readonly string[];
          };
        };
      };
  let tableState:
    | undefined
    | {
        readonly columnPinning?: {
          readonly left: readonly string[];
          readonly right: readonly string[];
        };
        readonly staticKeys?: Set<string>;
      };

  return {
    drawerColumnsStore: {
      get: vi.fn(() => drawerState),
      set: vi.fn(),
    },
    modalsStore: {
      get: vi.fn(() => modalsState),
      set: vi.fn(),
    },
    setDrawerState: (next: typeof drawerState) => {
      drawerState = next;
    },
    setModalsState: (next: typeof modalsState) => {
      modalsState = next;
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

const buildConflict = (overrides?: Partial<OrderConflict>) => ({
  description: 'Pinned columns must stay at the edges.',
  isOpen: true,
  pendingOrder: ['id', 'status'],
  pendingPinning: { left: [], right: [] },
  ...overrides,
});

const acceptOrderConflict = ({
  currentOrder,
  defaultPinning,
  orderConflict,
  resolution,
  staticKeys,
}: {
  readonly currentOrder?: readonly string[];
  readonly defaultPinning?: Pinning;
  readonly orderConflict?: OrderConflict;
  readonly resolution: OrderConflictResolution;
  readonly staticKeys?: readonly string[];
}) => {
  setModalsState(orderConflict ? { orderConflict } : {});
  setDrawerState(currentOrder ? { columnOrder: currentOrder } : undefined);
  setTableColumnsState(
    defaultPinning || staticKeys
      ? {
          columnPinning: defaultPinning,
          staticKeys: staticKeys ? new Set(staticKeys) : undefined,
        }
      : undefined,
  );

  const { result } = renderHook(() => useAcceptOrderConflict());

  act(() => {
    result.current(resolution);
  });
};

describe('useAcceptOrderConflict', () => {
  beforeEach(() => {
    setModalsState(undefined);
    setDrawerState(undefined);
    setTableColumnsState(undefined);
    drawerColumnsStore.set.mockClear();
    modalsStore.set.mockClear();
  });

  it('drops every pin for the reset-all-pins resolution', () => {
    acceptOrderConflict({
      currentOrder: ['id', 'status'],
      orderConflict: buildConflict({
        pendingOrder: ['status', 'id'],
        pendingPinning: { left: ['status'], right: [] },
      }),
      resolution: 'reset-all-pins',
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['status', 'id'],
      columnPinning: { left: [], right: [] },
    });
  });

  it('moves pinned columns to the edges for the pin-to-match-order resolution', () => {
    acceptOrderConflict({
      currentOrder: ['id', 'status', 'notes'],
      orderConflict: buildConflict({
        pendingOrder: ['id', 'status', 'notes'],
        pendingPinning: { left: ['status'], right: ['id'] },
      }),
      resolution: 'pin-to-match-order',
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['status', 'notes', 'id'],
      columnPinning: { left: ['status'], right: ['id'] },
    });
  });

  it('keeps only edge-contiguous pins for the remove-conflicting-pins resolution', () => {
    acceptOrderConflict({
      currentOrder: ['id', 'status', 'notes'],
      orderConflict: buildConflict({
        pendingOrder: ['id', 'status', 'notes'],
        pendingPinning: { left: ['id'], right: ['status'] },
      }),
      resolution: 'remove-conflicting-pins',
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['id', 'status', 'notes'],
      columnPinning: { left: ['id'], right: [] },
    });
  });

  it('restores static columns to their original position in the current order', () => {
    acceptOrderConflict({
      currentOrder: ['actions', 'id', 'status'],
      orderConflict: buildConflict({
        pendingOrder: ['status', 'id', 'actions'],
        pendingPinning: { left: [], right: [] },
      }),
      resolution: 'reset-all-pins',
      staticKeys: ['actions'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['actions', 'status', 'id'],
      columnPinning: { left: [], right: [] },
    });
  });

  it('restores static pins that the resolution dropped', () => {
    acceptOrderConflict({
      currentOrder: ['actions', 'id', 'notes'],
      defaultPinning: { left: ['actions'], right: ['notes'] },
      orderConflict: buildConflict({
        pendingOrder: ['id', 'actions', 'notes'],
        pendingPinning: { left: ['actions'], right: [] },
      }),
      resolution: 'reset-all-pins',
      staticKeys: ['actions', 'notes'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['actions', 'id', 'notes'],
      columnPinning: { left: ['actions'], right: ['notes'] },
    });
  });

  it('closes the conflict modal while preserving its other fields', () => {
    const orderConflict = buildConflict();

    acceptOrderConflict({
      currentOrder: ['id', 'status'],
      orderConflict,
      resolution: 'reset-all-pins',
    });

    expect(modalsStore.set).toHaveBeenCalledWith({
      orderConflict: { ...orderConflict, isOpen: false },
    });
  });

  it('does nothing when no order conflict is pending', () => {
    acceptOrderConflict({
      currentOrder: ['id', 'status'],
      resolution: 'reset-all-pins',
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('does nothing when the modals store is still empty', () => {
    setModalsState(undefined);

    const { result } = renderHook(() => useAcceptOrderConflict());

    act(() => {
      result.current('reset-all-pins');
    });

    expect(drawerColumnsStore.set).not.toHaveBeenCalled();
    expect(modalsStore.set).not.toHaveBeenCalled();
  });

  it('skips static restoration when the drawer holds no current order', () => {
    acceptOrderConflict({
      orderConflict: buildConflict({
        pendingOrder: ['status', 'id', 'actions'],
        pendingPinning: { left: [], right: [] },
      }),
      resolution: 'reset-all-pins',
      staticKeys: ['actions'],
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['status', 'id', 'actions'],
      columnPinning: { left: [], right: [] },
    });
  });

  it('falls back to empty static keys and pinning when the table store is empty', () => {
    acceptOrderConflict({
      currentOrder: ['id', 'status'],
      orderConflict: buildConflict({
        pendingOrder: ['status', 'id'],
        pendingPinning: { left: ['status'], right: [] },
      }),
      resolution: 'pin-to-match-order',
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['status', 'id'],
      columnPinning: { left: ['status'], right: [] },
    });
  });
});
