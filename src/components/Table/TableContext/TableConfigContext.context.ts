import { createContext } from 'react';

import type {
  TableColumnsState,
  TableMetaState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks';

import { getInitialColumnsState, getInitialMetaState } from './utils';

export type TableConfigContextValue = {
  /** Store managing column-related state */
  columnsStore: TStore<TableColumnsState<unknown>>;
  /** Store managing meta-related state */
  metaStore: TStore<TableMetaState>;
};

/**
 * Table context for sharing state across table components
 *
 * Uses external stores with useSyncExternalStore for granular updates.
 * Components can subscribe to specific slices of state via selector hooks.
 */
export const TableConfigContext = createContext<TableConfigContextValue>({
  columnsStore: getInitialColumnsState<unknown>({}),
  metaStore: getInitialMetaState({}),
} as unknown as TableConfigContextValue);

TableConfigContext.displayName = 'TableConfigContext';
