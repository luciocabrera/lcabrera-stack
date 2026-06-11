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
  readonly mockPersistTableState: ReturnType<typeof vi.fn>;
  readonly mockUsePersistTableStateAction: () => ReturnType<typeof vi.fn>;
  readonly mockUseTableConfigContextValue: () => {
    readonly columnsStore: ColumnsStore<TState>;
    readonly metaStore: {
      readonly get: () => {
        readonly persistenceKey: string;
      };
    };
  };
  readonly resetMocks: () => void;
  readonly setColumnsState: (nextState: TState) => void;
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

  const mockMetaStore = {
    get: vi.fn(() => ({ persistenceKey })),
  };

  const mockPersistTableState = vi.fn();

  return {
    mockColumnsStore,
    mockPersistTableState,
    mockUsePersistTableStateAction: () => mockPersistTableState,
    mockUseTableConfigContextValue: () => ({
      columnsStore: mockColumnsStore,
      metaStore: mockMetaStore,
    }),
    resetMocks: () => {
      (mockColumnsStore.set as ReturnType<typeof vi.fn>).mockClear();
      mockPersistTableState.mockClear();
    },
    setColumnsState: (nextState: TState) => {
      columnsState = nextState;
    },
  };
};
