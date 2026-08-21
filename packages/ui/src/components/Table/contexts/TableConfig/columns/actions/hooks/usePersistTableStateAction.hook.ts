import type { TablePersistenceEntry } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { serializeStateSlice } from '#ui/components/Table/utils';
import {
  MAX_COOKIE_ENTRY_VALUE_LENGTH,
  PERSISTENCE_SIZE_WARNING,
} from '#ui/constants/globalSettings.constants';
import { useNotifyAction } from '#ui/contexts/NotificationContext/actions';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

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
  const persistCookie = usePersistCookieAction({
    fetcherKey: 'persist-table-state',
  });
  const notify = useNotifyAction();

  return (args: TablePersistenceEntry | TablePersistenceEntry[]) => {
    const entries = Array.isArray(args) ? args : [args];
    // Scope keys to the current app so tables in different apps that reuse the
    // same persistenceKey never share cookies / storage entries.
    const appId = metaStore.get()?.appId;
    // A table sharing another route's URL contributes no param updates at all.
    // Dropped here rather than at each of the four builders because this is the
    // one place every entry passes through, and `applySearchParamUpdates`
    // already ignores an empty key — so one check covers filters, sorting,
    // grouping and the batched settings write.
    const isUrlStateReadOnly = metaStore.get()?.isUrlStateReadOnly === true;

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
          searchParamKey: isUrlStateReadOnly ? '' : (searchParamKey ?? ''),
          searchParamValue: isUrlStateReadOnly ? '' : (searchParamValue ?? ''),
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
    persistCookie(serializedEntries);

    return true;
  };
};
