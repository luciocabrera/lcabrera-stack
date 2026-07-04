import { useFetcher, useLocation } from 'react-router';

import {
  MAX_COOKIE_ENTRY_VALUE_LENGTH,
  PERSIST_COOKIE_ACTION,
  PERSISTENCE_SIZE_WARNING,
} from '@repo/ui/constants/globalSettings.constants';
import { useNotifyAction } from '@repo/ui/contexts/NotificationContext/actions';
import { writeToSessionStorage } from '@repo/ui/utils/storage';

import type { TablePersistenceConfig } from '../Table.types';

import { serializeStateSlice } from '../utils';

type PersistCookieEntry<TSlice = unknown> = {
  persistenceKey?: string;
  searchParamKey?: string;
  searchParamValue?: string;
  slice?: keyof TablePersistenceConfig;
  valueSlice?: TSlice;
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
  const notify = useNotifyAction();

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
        const { key, value } =
          persistenceKey && slice
            ? serializeStateSlice({
                persistenceKey,
                slice,
                value: valueSlice,
              })
            : { key: undefined, value: undefined };

        return {
          key,
          searchParamKey: searchParamKey ?? '',
          searchParamValue: searchParamValue ?? '',
          value,
        };
      },
    );

    // Check total cookie size (actual serialized payload)
    const entriesString = JSON.stringify(serializedEntries);
    if (entriesString.length > MAX_COOKIE_ENTRY_VALUE_LENGTH) {
      notify(PERSISTENCE_SIZE_WARNING);
      return false;
    }
    notify({
      durationMs: 10_000,
      message: 'This table state has been updated successfully.',
      title: 'Table updated',
      variant: 'success' as const,
    });

    for (const { key, value } of serializedEntries) {
      // Write to sessionStorage immediately (tab-isolated, survives refresh)
      if (key && value) writeToSessionStorage({ key, value });
    }

    // Write to cookie via server action (SSR baseline for new tabs)
    void fetcher.submit(
      { currentUrl, entries: entriesString },
      { action: PERSIST_COOKIE_ACTION, method: 'POST' },
    );

    return true;
  };
};
