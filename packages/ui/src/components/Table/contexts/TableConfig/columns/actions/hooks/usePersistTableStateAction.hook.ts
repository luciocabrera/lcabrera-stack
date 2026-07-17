import type { TablePersistenceEntry } from '@repo/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@repo/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { serializeStateSlice } from '@repo/ui/components/Table/utils';
import {
  MAX_COOKIE_ENTRY_VALUE_LENGTH,
  PERSIST_COOKIE_ACTION,
  PERSISTENCE_SIZE_WARNING,
} from '@repo/ui/constants/globalSettings.constants';
import { useNotifyAction } from '@repo/ui/contexts/NotificationContext/actions';
import { useFetcher, useLocation } from 'react-router';

/**
 * Shared persistence hook for the column actions — internal to `actions/`, not
 * part of its public API, which is why it lives here rather than in the
 * barrel-exported action list or in `Table/hooks/` (where it used to sit, and
 * where reaching for it through the hooks barrel closed an actions ↔ hooks
 * import cycle).
 *
 * Persists table state to the **cookie**, written via a server action
 * (Set-Cookie header). The cookie is the single source of truth because it is
 * the only channel the SSR loader can read: the store is seeded from what the
 * loader passes down, so what is saved here is what the next document paints
 * with. A client-only copy could only contradict that markup and shift it at
 * hydration.
 *
 * Supports both a single entry and a batch of entries.
 */
export const usePersistTableStateAction = () => {
  const { metaStore } = useTableConfigContextValue();
  const fetcher = useFetcher({ key: 'persist-table-state' });
  const location = useLocation();
  const notify = useNotifyAction();

  return (args: TablePersistenceEntry | TablePersistenceEntry[]) => {
    const entries = Array.isArray(args) ? args : [args];
    const currentUrl = `${location.pathname}${location.search}`;
    // Scope keys to the current app so tables in different apps that reuse the
    // same persistenceKey never share cookies / storage entries.
    const appId = metaStore.get()?.appId;

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
                appId,
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

    // Write to cookie via server action — the loader reads it back on the next
    // document request and seeds the store from it.
    void fetcher.submit(
      { currentUrl, entries: entriesString },
      { action: PERSIST_COOKIE_ACTION, method: 'POST' },
    );

    return true;
  };
};
