import { vi } from 'vite-plus/test';

type ColumnsStore<TState extends Record<string, unknown>> = {
  readonly get: () => TState;
  readonly set: (value: Partial<TState>) => void;
};

type CreateTableConfigColumnsActionMocksArgs<
  TState extends Record<string, unknown>,
> = {
  readonly initialColumnsState: TState;
  /**
   * The applied group keys the fake grouping store reports. Defaults to none —
   * a column action under grouping is its own scenario, and the common one is
   * a table that is not grouped.
   */
  readonly initialGroupingKeys?: readonly string[];
  readonly persistenceKey: string;
};

export const createTableConfigColumnsActionMocks = <
  TState extends Record<string, unknown>,
>({
  initialColumnsState,
  initialGroupingKeys = [],
  persistenceKey,
}: CreateTableConfigColumnsActionMocksArgs<TState>) => {
  let columnsState = initialColumnsState;
  let groupingKeys = initialGroupingKeys;

  const mockColumnsStore: ColumnsStore<TState> = {
    get: vi.fn(() => columnsState),
    set: vi.fn((value: Partial<TState>) => {
      columnsState = { ...columnsState, ...value };
    }),
  };

  let drawersSyncNonce = 0;

  const mockMetaStore = {
    get: vi.fn(() => ({ drawersSyncNonce, persistenceKey })),
    set: vi.fn((value: { readonly drawersSyncNonce?: number }) => {
      drawersSyncNonce = value.drawersSyncNonce ?? drawersSyncNonce;
    }),
  };

  const mockPersistTableState = vi.fn(() => true);

  // Every column action reads the applied group keys, because the derived
  // column slices carry the hierarchy column while grouping is on (ADR-065).
  const mockGroupingStore = {
    get: vi.fn(() => ({
      aggregates: {},
      keys: groupingKeys,
      mode: 'flat',
      periods: {},
      shares: [],
    })),
    set: vi.fn(),
  };

  return {
    mockColumnsStore,
    mockGroupingStore,
    mockMetaStore,
    mockPersistTableState,
    mockUsePersistTableStateAction: () => mockPersistTableState,
    mockUseTableConfigContextValue: () => ({
      columnsStore: mockColumnsStore,
      groupingStore: mockGroupingStore,
      metaStore: mockMetaStore,
    }),
    resetMocks: () => {
      drawersSyncNonce = 0;
      (mockColumnsStore.set as ReturnType<typeof vi.fn>).mockClear();
      mockGroupingStore.set.mockClear();
      mockMetaStore.set.mockClear();
      mockPersistTableState.mockClear();
      mockPersistTableState.mockReturnValue(true);
    },
    setColumnsState: (nextState: TState) => {
      columnsState = nextState;
    },
    setDrawersSyncNonce: (nextNonce: number) => {
      drawersSyncNonce = nextNonce;
    },
    setGroupingKeys: (nextKeys: readonly string[]) => {
      groupingKeys = nextKeys;
    },
  };
};
