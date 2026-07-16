import type { ColumnOrderSectionModalsState } from '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.types';

import { vi } from 'vitest';

type CreateColumnOrderSectionActionMocksArgs = {
  readonly initialDrawerState: LooseDrawerState;
  readonly initialModalsState: ColumnOrderSectionModalsState;
  readonly initialTableState: LooseTableState;
};

/**
 * Loose drawer state shape — avoids TData inference binding tests to specific key types.
 * ColumnFiltersState and ColumnSizingState are generic Records to prevent over-constraint.
 */
type LooseDrawerState = {
  readonly columnFilters: Record<string, unknown>;
  readonly columnOrder: string[];
  readonly columnPinning: { readonly left: string[]; readonly right: string[] };
  readonly columnSizing: Record<string, number>;
  readonly columnVisibility: Set<string>;
  readonly sorting: unknown[];
};

type LooseTableState = {
  readonly columns: readonly { readonly key: string; readonly label: string }[];
  readonly normalizedColumns: Record<string, unknown>;
  readonly staticKeys: Set<string>;
};

type MockStore<TState> = {
  _state: TState;
  readonly get: ReturnType<typeof vi.fn>;
  readonly getServerSnapshot: ReturnType<typeof vi.fn>;
  readonly reset: ReturnType<typeof vi.fn>;
  readonly set: ReturnType<typeof vi.fn>;
  readonly subscribe: ReturnType<typeof vi.fn>;
};

const createMockStore = <TState>(initial: TState) => {
  const store: MockStore<TState> = {
    _state: initial,
    get: vi.fn(() => store._state),
    getServerSnapshot: vi.fn(() => store._state),
    reset: vi.fn(),
    set: vi.fn((partial: Partial<TState>) => {
      store._state = { ...store._state, ...partial };
    }),
    subscribe: vi.fn(() => vi.fn()),
  };

  return store;
};

export const createColumnOrderSectionActionMocks = ({
  initialDrawerState,
  initialModalsState,
  initialTableState,
}: CreateColumnOrderSectionActionMocksArgs) => {
  const tableColumnsStore = createMockStore(initialTableState);
  const drawerColumnsStore = createMockStore(initialDrawerState);
  const modalsStore = createMockStore(initialModalsState);

  const resetMocks = () => {
    tableColumnsStore._state = initialTableState;
    drawerColumnsStore._state = initialDrawerState;
    modalsStore._state = initialModalsState;
    tableColumnsStore.set.mockClear();
    drawerColumnsStore.set.mockClear();
    modalsStore.set.mockClear();
  };

  return {
    drawerColumnsStore,
    modalsStore,
    resetMocks,
    tableColumnsStore,
  };
};
