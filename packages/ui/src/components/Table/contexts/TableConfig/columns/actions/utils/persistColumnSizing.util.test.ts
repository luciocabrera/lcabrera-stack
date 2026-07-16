import type {
  TableColumnsState,
  TableMetaState,
} from '@repo/ui/components/Table/Table.types';
import type { TStore } from '@repo/ui/hooks/useStore.hook';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockSerializeStateSlice,
  mockWriteStateSlice,
  mockWriteToSessionStorage,
} = vi.hoisted(() => ({
  mockSerializeStateSlice: vi.fn(),
  mockWriteStateSlice: vi.fn(),
  mockWriteToSessionStorage: vi.fn(),
}));

vi.mock('@repo/ui/components/Table/utils', () => ({
  serializeStateSlice: mockSerializeStateSlice,
  writeStateSlice: mockWriteStateSlice,
}));

vi.mock('@repo/ui/utils/storage', () => ({
  writeToSessionStorage: mockWriteToSessionStorage,
}));

import { persistColumnSizing } from './persistColumnSizing.util';

type CreateStoresArgs = {
  readonly appId?: string;
  readonly columnSizing?: Record<string, number>;
  readonly persistenceKey?: string;
};

type Row = { readonly name: string };

// No default parameter values: a default fires on `undefined`, which would
// quietly refill the very field each absent-field case is trying to omit.
const createStores = ({
  appId,
  columnSizing,
  persistenceKey,
}: CreateStoresArgs) => ({
  columnsStore: { get: () => ({ columnSizing }) } as unknown as TStore<
    TableColumnsState<Row>
  >,
  metaStore: {
    get: () => ({ appId, persistenceKey }),
  } as unknown as TStore<TableMetaState>,
});

const COMPLETE_STORES = {
  appId: 'orders-app',
  columnSizing: { name: 220 },
  persistenceKey: 'orders-table',
} satisfies CreateStoresArgs;

describe('persistColumnSizing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSerializeStateSlice.mockReturnValue({
      key: 'table-state-orders-app-orders-table-columnSizing',
      value: '{"value":{"name":220},"version":1}',
    });
  });

  it('writes the stored widths to the cookie, scoped to the app and table', () => {
    persistColumnSizing<Row>(createStores(COMPLETE_STORES));

    expect(mockWriteStateSlice).toHaveBeenCalledWith({
      appId: 'orders-app',
      persistenceKey: 'orders-table',
      slice: 'columnSizing',
      storageType: 'cookie',
      value: { name: 220 },
    });
  });

  it('also writes sessionStorage, which is what the client reads back first', () => {
    persistColumnSizing<Row>(createStores(COMPLETE_STORES));

    // Cookie-only would let a stale sessionStorage entry win at hydration and
    // silently revert the resize — see getInitialColumnsState.
    expect(mockSerializeStateSlice).toHaveBeenCalledWith({
      appId: 'orders-app',
      persistenceKey: 'orders-table',
      slice: 'columnSizing',
      value: { name: 220 },
    });
    expect(mockWriteToSessionStorage).toHaveBeenCalledWith({
      key: 'table-state-orders-app-orders-table-columnSizing',
      value: '{"value":{"name":220},"version":1}',
    });
  });

  it('does nothing when the table has no persistence key to write under', () => {
    persistColumnSizing<Row>(
      createStores({
        appId: 'orders-app',
        columnSizing: { name: 220 },
        persistenceKey: undefined,
      }),
    );

    expect(mockWriteStateSlice).not.toHaveBeenCalled();
    expect(mockWriteToSessionStorage).not.toHaveBeenCalled();
  });

  it('does nothing when there are no widths to save', () => {
    persistColumnSizing<Row>(
      createStores({
        appId: 'orders-app',
        columnSizing: undefined,
        persistenceKey: 'orders-table',
      }),
    );

    expect(mockWriteStateSlice).not.toHaveBeenCalled();
    expect(mockWriteToSessionStorage).not.toHaveBeenCalled();
  });

  it('still writes for a table with no appId', () => {
    persistColumnSizing<Row>(
      createStores({
        appId: undefined,
        columnSizing: { name: 220 },
        persistenceKey: 'orders-table',
      }),
    );

    expect(mockWriteStateSlice).toHaveBeenCalledWith(
      expect.objectContaining({ appId: undefined, value: { name: 220 } }),
    );
  });
});
