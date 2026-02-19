import { createContext } from 'react';

import type { TableDataContextValue } from './TableDataContext.types';

import { getInitialDataState, getInitialFiltersDataState } from './utils';

/**
 * Data context for sharing state across table components
 *
 * Uses external stores with useSyncExternalStore for granular updates.
 * Components can subscribe to specific slices of state via selector hooks.
 */
export const TableDataContext = createContext<TableDataContextValue>({
  dataStore: getInitialDataState<unknown>({}),
  filtersDataStore: getInitialFiltersDataState<unknown>({ columns: [] }), // Assuming similar initial state for filters
} as unknown as TableDataContextValue);

TableDataContext.displayName = 'TableDataContext';
