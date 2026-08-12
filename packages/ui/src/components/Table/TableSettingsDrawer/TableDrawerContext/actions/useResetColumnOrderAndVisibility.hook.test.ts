// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { useResetColumnOrderAndVisibility } from './useResetColumnOrderAndVisibility.hook';

type TableColumnsState = {
  readonly columnOrder?: readonly string[];
  readonly columnPinning?: {
    readonly left: readonly string[];
    readonly right: readonly string[];
  };
  readonly columnVisibility?: Set<string>;
};

const { drawerColumnsStore, setTableColumnsState, tableColumnsStore } =
  vi.hoisted(() => {
    let state:
      | undefined
      | {
          readonly columnOrder?: readonly string[];
          readonly columnPinning?: {
            readonly left: readonly string[];
            readonly right: readonly string[];
          };
          readonly columnVisibility?: Set<string>;
        };

    return {
      drawerColumnsStore: {
        set: vi.fn(),
      },
      setTableColumnsState: (next: typeof state) => {
        state = next;
      },
      tableColumnsStore: {
        get: vi.fn(() => state),
      },
    };
  });

vi.mock(
  '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook',
  () => ({
    useTableConfigContextValue: () => ({ columnsStore: tableColumnsStore }),
  }),
);

vi.mock('../useTableDrawerContextValue.hook', () => ({
  useTableDrawerContextValue: () => ({ columnsStore: drawerColumnsStore }),
}));

const resetColumnOrderAndVisibility = (state?: TableColumnsState) => {
  setTableColumnsState(state);

  const { result } = renderHook(() => useResetColumnOrderAndVisibility());

  act(() => {
    result.current();
  });
};

describe('useResetColumnOrderAndVisibility', () => {
  beforeEach(() => {
    setTableColumnsState(undefined);
    drawerColumnsStore.set.mockClear();
  });

  it('copies order, pinning and visibility from the table config state', () => {
    resetColumnOrderAndVisibility({
      columnOrder: ['id', 'status'],
      columnPinning: { left: ['id'], right: ['status'] },
      columnVisibility: new Set(['notes']),
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['id', 'status'],
      columnPinning: { left: ['id'], right: ['status'] },
      columnVisibility: new Set(['notes']),
    });
  });

  it('applies empty defaults when the table config store is still empty', () => {
    resetColumnOrderAndVisibility();

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnVisibility: new Set(),
    });
  });

  it('defaults only the missing pinning slice', () => {
    resetColumnOrderAndVisibility({
      columnOrder: ['id'],
      columnVisibility: new Set(['status']),
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: ['id'],
      columnPinning: { left: [], right: [] },
      columnVisibility: new Set(['status']),
    });
  });

  it('defaults only the missing order slice', () => {
    resetColumnOrderAndVisibility({
      columnPinning: { left: ['id'], right: [] },
      columnVisibility: new Set(),
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: [],
      columnPinning: { left: ['id'], right: [] },
      columnVisibility: new Set(),
    });
  });

  it('preserves an empty column order rather than treating it as missing', () => {
    resetColumnOrderAndVisibility({
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnVisibility: new Set(),
    });

    expect(drawerColumnsStore.set).toHaveBeenCalledWith({
      columnOrder: [],
      columnPinning: { left: [], right: [] },
      columnVisibility: new Set(),
    });
  });

  it('forwards the exact table config references without copying them', () => {
    const columnOrder = ['id', 'status'];
    const columnPinning = { left: ['id'], right: [] };
    const columnVisibility = new Set(['notes']);

    resetColumnOrderAndVisibility({
      columnOrder,
      columnPinning,
      columnVisibility,
    });

    const [payload] = drawerColumnsStore.set.mock.calls.at(-1) ?? [];
    const update = payload as TableColumnsState | undefined;

    expect(update?.columnOrder).toBe(columnOrder);
    expect(update?.columnPinning).toBe(columnPinning);
    expect(update?.columnVisibility).toBe(columnVisibility);
  });

  it('reads the table config state fresh on every invocation', () => {
    const { result } = renderHook(() => useResetColumnOrderAndVisibility());

    setTableColumnsState({ columnOrder: ['id'] });
    act(() => {
      result.current();
    });

    setTableColumnsState({ columnOrder: ['status'] });
    act(() => {
      result.current();
    });

    expect(drawerColumnsStore.set).toHaveBeenLastCalledWith({
      columnOrder: ['status'],
      columnPinning: { left: [], right: [] },
      columnVisibility: new Set(),
    });
  });
});
