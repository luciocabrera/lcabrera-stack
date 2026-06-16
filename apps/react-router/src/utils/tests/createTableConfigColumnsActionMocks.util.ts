import { vi } from 'vitest';

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

type CreateTableConfigColumnsActionMocksResult<
  TState extends Record<string, unknown>,
> = {
  readonly mockColumnsStore: ColumnsStore<TState>;
  readonly mockMetaStore: {
    readonly get: ReturnType<typeof vi.fn>;
    readonly set: ReturnType<typeof vi.fn>;
  };
  readonly mockPersistTableState: ReturnType<typeof vi.fn>;
  readonly mockUsePersistTableStateAction: () => ReturnType<typeof vi.fn>;
  readonly mockUseTableConfigContextValue: () => {
    readonly columnsStore: ColumnsStore<TState>;
    readonly metaStore: {
      readonly get: ReturnType<typeof vi.fn>;
      readonly set: ReturnType<typeof vi.fn>;
    };
  };
  readonly resetMocks: () => void;
  readonly setColumnsState: (nextState: TState) => void;
  readonly setDrawersSyncNonce: (nextNonce: number) => void;
};

export const createTableConfigColumnsActionMocks = <
  TState extends Record<string, unknown>,
>({
  initialColumnsState,
  persistenceKey,
}: CreateTableConfigColumnsActionMocksArgs<TState>): CreateTableConfigColumnsActionMocksResult<TState> => {
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

  const mockPersistTableState = vi.fn();

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
    },
    setColumnsState: (nextState: TState) => {
      columnsState = nextState;
    },
    setDrawersSyncNonce: (nextNonce: number) => {
      drawersSyncNonce = nextNonce;
    },
  };
};
