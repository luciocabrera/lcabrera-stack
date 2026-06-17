import { useFetcher, useLocation } from 'react-router';

import { PERSIST_COOKIE_ACTION } from '@/constants/globalSettings.constants';
import { writeToSessionStorage } from '@/utils/storage';

import type { TablePersistenceConfig } from '../Table.types';

import { serializeStateSlice } from '../utils';

type PersistCookieEntry<TSlice = unknown> = {
  persistenceKey: string;
  searchParamKey?: string;
  searchParamValue?: string;
  slice: keyof TablePersistenceConfig;
  valueSlice: TSlice;
};

/**
 * Hook that persists table state via two channels:
 *
 * 1. **sessionStorage** — written synchronously and tab-scoped. A tab refresh
 *    restores from sessionStorage so each tab is isolated from other tabs.
 *
 * 2. **Cookie** — written asynchronously via a server action (Set-Cookie
 *    header). The cookie is the SSR baseline seed: when a new tab opens it
 *    gets the most-recently-saved cookie state as its starting point.
 *
 * Supports both a single entry and a batch of entries.
 */
type PersistTableStateAction = {
  <TSlice>(entry: PersistCookieEntry<TSlice>): void;
  (entries: PersistCookieEntry[]): void;
};

export const usePersistTableStateAction = (): PersistTableStateAction => {
  const fetcher = useFetcher({ key: 'persist-table-state' });
  const location = useLocation();

  return (args: PersistCookieEntry | PersistCookieEntry[]) => {
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

        // Write to sessionStorage immediately (tab-isolated, survives refresh)
        writeToSessionStorage({ key, value });

        return {
          key,
          searchParamKey: searchParamKey ?? '',
          searchParamValue: searchParamValue ?? '',
          value,
        };
      },
    );

    // Also write to cookie via server action (SSR baseline for new tabs)
    void fetcher.submit(
      { currentUrl, entries: JSON.stringify(serializedEntries) },
      { action: PERSIST_COOKIE_ACTION, method: 'POST' },
    );
  };
};
