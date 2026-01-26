import { createContext, type RefObject } from 'react';

import type { TStore } from '@/hooks';

import type { TableMeta, TableState } from '../Table.types';

/**
 * Table context value containing both stores
 */
export type TableContextValue<TData> = {
  /** Flag to indicate an imperative URL update is in progress (skip effect sync) */
  isImperativeUpdateRef: RefObject<boolean>;
  /** Metadata store (loading states, totals, errors) */
  metaStore: TStore<TableMeta>;
  /** Table state store (data, sorting, filters, selection, etc.) */
  tableStore: TStore<TableState<TData>>;
};

/**
 * Table context for sharing state across table components
 *
 * Uses external stores with useSyncExternalStore for granular updates.
 * Components can subscribe to specific slices of state via selector hooks.
 */
export const TableContext = createContext<
  TableContextValue<unknown> | undefined
>(undefined);

TableContext.displayName = 'TableContext';
