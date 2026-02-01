import { createContext } from 'react';

import type {
  TableDataState,
} from '@/components/Table/Table.types';
import type { TStore } from '@/hooks';

import { getInitialDataState } from './utils';

export type TableDataContextValue = {
  /** Store managing data-related state */
  dataStore: TStore<TableDataState<unknown>>;
};

/**
 * Data context for sharing state across table components
 *
 * Uses external stores with useSyncExternalStore for granular updates.
 * Components can subscribe to specific slices of state via selector hooks.
 */
export const TableDataContext = createContext<TableDataContextValue>({
  dataStore: getInitialDataState<unknown>({}),
} as unknown as TableDataContextValue);

TableDataContext.displayName = 'TableDataContext';  