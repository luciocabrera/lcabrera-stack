import { vi } from 'vite-plus/test';

type ColumnsStore<TState extends Record<string, unknown>> = {
  readonly get: () => TState;
  readonly set: (value: Partial<TState>) => void;
};

type CreateTableConfigColumnsActionMocksArgs<
  TState extends Record<string, unknown>,
> = {
  readonly initialColumnsState: TState;
  readonly persistenceKey: string;
};

export const createTableConfigColumnsActionMocks = <
  TState extends Record<string, unknown>,
>({
  initialColumnsState,
  persistenceKey,
}: CreateTableConfigColumnsActionMocksArgs<TState>) => {
  let columnsState = initialColumnsState;

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

  return {
    mockColumnsStore,
    mockMetaStore,
    mockPersistTableState,
    mockUsePersistTableStateAction: () => mockPersistTableState,
    mockUseTableConfigContextValue: () => ({
      columnsStore: mockColumnsStore,
      metaStore: mockMetaStore,
    }),
    resetMocks: () => {
      drawersSyncNonce = 0;
      (mockColumnsStore.set as ReturnType<typeof vi.fn>).mockClear();
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
  };
};
