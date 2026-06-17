import { useFetcher, useLocation } from 'react-router';

import {
  PERSIST_COOKIE_ACTION,
  PERSISTENCE_SIZE_WARNING,
  MAX_COOKIE_ENTRY_VALUE_LENGTH,
} from '@/constants/globalSettings.constants';
import { useNotifications } from '@/hooks/useNotifications.hook';
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
  <TSlice>(entry: PersistCookieEntry<TSlice>): boolean;
  (entries: PersistCookieEntry[]): boolean;
};

export const usePersistTableStateAction = (): PersistTableStateAction => {
  const fetcher = useFetcher({ key: 'persist-table-state' });
  const location = useLocation();
  const { notify } = useNotifications();

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

        return {
          key,
          searchParamKey: searchParamKey ?? '',
          searchParamValue: searchParamValue ?? '',
          value,
        };
      },
    );

    const oversizedEntries = serializedEntries.filter(
      ({ value }) => value.length > MAX_COOKIE_ENTRY_VALUE_LENGTH,
    );

    if (oversizedEntries.length > 0) {
      notify(PERSISTENCE_SIZE_WARNING);
      return false;
    }

    serializedEntries.forEach(({ key, value }) => {
      // Write to sessionStorage immediately (tab-isolated, survives refresh)
      writeToSessionStorage({ key, value });
    });

    const cookieSafeEntries = serializedEntries.filter(
      ({ value }) => value.length <= MAX_COOKIE_ENTRY_VALUE_LENGTH,
    );

    if (cookieSafeEntries.length === 0) {
      return false;
    }

    // Also write to cookie via server action (SSR baseline for new tabs)
    void fetcher.submit(
      { currentUrl, entries: JSON.stringify(cookieSafeEntries) },
      { action: PERSIST_COOKIE_ACTION, method: 'POST' },
    );

    return true;
  };
};
