import { useFetcher, useLocation } from 'react-router';

import { serializeStateSlice } from '../utils';
import { PERSIST_COOKIE_ACTION } from './persistCookieAction.constants';

import type { TablePersistenceConfig } from '../Table.types';

type PersistCookieEntry<TSlice = unknown> = {
  persistenceKey: string;
  searchParamKey?: string;
  searchParamValue?: string;
  slice: keyof TablePersistenceConfig;
  valueSlice: TSlice;
};

/**
 * Hook that persists cookies via a server action (Set-Cookie header).
 *
 * Uses useFetcher to POST to the /api/persist-cookie resource route,
 * which sets the cookie server-side via Set-Cookie response header.
 *
 * Supports both a single entry and a batch of entries.
 *
 * @example
 * // Single entry
 * const persistTableState = usePersistTableStateAction();
 * persistTableState({
 *   persistenceKey: 'table-state-orders',
 *   slice: 'columnFilters',
 *   valueSlice: { status: 'active' },
 *   searchParamKey: 'filters',
 *   searchParamValue: '{"status":"active"}',
 * });
 *
 * @example
 * // Batch entries
 * persistTableState([
 *   { persistenceKey: 'table-state-orders', slice: 'columnFilters', valueSlice: filters, searchParamKey: 'filters', searchParamValue: JSON.stringify(filters) },
 *   { persistenceKey: 'table-state-orders', slice: 'sorting', valueSlice: sorting, searchParamKey: 'sort', searchParamValue: JSON.stringify(sorting) },
 *   { persistenceKey: 'table-state-orders', slice: 'columnOrder', valueSlice: columnOrder },
 * ]);
 */
type PersistTableStateAction = {
  <TSlice>(entry: PersistCookieEntry<TSlice>): void;
  (entries: PersistCookieEntry[]): void;
};

export const usePersistTableStateAction = (): PersistTableStateAction => {
  const fetcher = useFetcher({ key: 'persist-table-state' });
  const location = useLocation();

  return ((args: PersistCookieEntry | PersistCookieEntry[]) => {
    const entries = Array.isArray(args) ? args : [args];
    const currentUrl = `${location.pathname}${location.search}`;

    const serializedEntries = entries.map(
      ({
        persistenceKey,
        searchParamKey,
        searchParamValue,
        slice,
        valueSlice,
      }) => {
        const { key, value } = serializeStateSlice({
          persistenceKey,
          slice,
          value: valueSlice,
        });

        return {
          key,
          searchParamKey: searchParamKey ?? '',
          searchParamValue: searchParamValue ?? '',
          value,
        };
      },
    );

    void fetcher.submit(
      { currentUrl, entries: JSON.stringify(serializedEntries) },
      { action: PERSIST_COOKIE_ACTION, method: 'POST' },
    );
  }) as PersistTableStateAction;
};
