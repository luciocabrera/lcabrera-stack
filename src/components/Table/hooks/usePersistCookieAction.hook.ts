import { useFetcher, useLocation } from 'react-router';

import type { TablePersistenceConfig } from '../Table.types';

import { serializeStateSlice } from '../utils';

const PERSIST_COOKIE_ACTION = '/_action/persist-cookie';

type PersistCookieArgs<TSlice> = {
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
 * @example
 * const persistTableState = usePersistTableStateAction();
 * persistTableState({
 *   persistenceKey: 'table-state-orders-columnFilters',
 *   valueSlice: { status: 'active' },
 *   searchParamKey: 'filters',
 *   searchParamValue: '{"status":"active"}',
 * });
 */
type PersistTableStateAction = <TSlice>(
  args: PersistCookieArgs<TSlice>,
) => void;

export const usePersistTableStateAction = (): PersistTableStateAction => {
  const fetcher = useFetcher();
  const location = useLocation();

  return <TSlice>({
    persistenceKey,
    searchParamKey,
    searchParamValue,
    slice,
    valueSlice,
  }: PersistCookieArgs<TSlice>) => {
    const { key, value } = serializeStateSlice({
      persistenceKey,
      slice,
      value: valueSlice,
    });
    const currentUrl = `${location.pathname}${location.search}`;
    void fetcher.submit(
      {
        currentUrl,
        key,
        searchParamKey: searchParamKey ?? '',
        searchParamValue: searchParamValue ?? '',
        value,
      },
      { action: PERSIST_COOKIE_ACTION, method: 'POST' },
    );
  };
};
