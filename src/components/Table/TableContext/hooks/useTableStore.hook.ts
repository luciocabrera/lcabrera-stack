import {
  type RefObject,
  use,
  useCallback,
  useRef,
  useSyncExternalStore,
} from 'react';

import type { UseStoreSelector } from '@/hooks';

import type { TableMeta, TableState } from '../../Table.types';
import type { TableContextValue } from '../TableContext.context';

import { TableContext } from '../TableContext.context';

/**
 * Get the table context value, throws if used outside provider
 */
export const useTableContextValue = (): TableContextValue<unknown> => {
  const context = use(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
};

/**
 * Hook to access the imperative update flag ref
 * Used by drawer to signal that it's doing a batch update + navigation
 * so that effects should skip their own URL sync
 *
 * Returns a fallback ref if context isn't available yet (shouldn't happen
 * in normal usage but provides safety)
 */
export const useIsImperativeUpdateRef = (): RefObject<boolean> => {
  const context = use(TableContext);
  // Fallback ref in case context isn't ready (shouldn't normally happen)
  const fallbackRef = useRef(false);
  return context?.isImperativeUpdateRef ?? fallbackRef;
};

/**
 * Generic hook for selecting from table store with granular subscriptions
 */
export const useTableStore = <TSelected, TData = unknown>(
  selector: (state: TableState<TData>) => TSelected,
): UseStoreSelector<TSelected, TableState<TData>> => {
  const { tableStore } = useTableContextValue();

  const state = useSyncExternalStore(
    tableStore.subscribe,
    () => selector(tableStore.get() as TableState<TData>),
    () => selector(tableStore.getServerSnapshot() as TableState<TData>),
  );

  const set = useCallback(
    (value: Partial<TableState<TData>>) => {
      tableStore.set(value as Partial<TableState<unknown>>);
    },
    [tableStore],
  );

  return [state, set];
};

/**
 * Generic hook for selecting from meta store with granular subscriptions
 */
export const useMetaStore = <TSelected>(
  selector: (state: TableMeta) => TSelected,
): UseStoreSelector<TSelected, TableMeta> => {
  const { metaStore } = useTableContextValue();

  const state = useSyncExternalStore(
    metaStore.subscribe,
    () => selector(metaStore.get() ?? ({} as TableMeta)),
    () => selector(metaStore.getServerSnapshot() ?? ({} as TableMeta)),
  );

  return [state, metaStore.set];
};
