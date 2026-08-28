import type { TablePersistenceEntry } from '#ui/components/Table/Table.types';

import { toUrlWriteOnly } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { TABLE_NESTED_URL_STATE_PREFIX } from '#ui/components/Table/Table.constants';
import { serializeStateSlice } from '#ui/components/Table/utils';
import {
  MAX_COOKIE_ENTRY_VALUE_LENGTH,
  PERSISTENCE_SIZE_WARNING,
} from '#ui/constants/globalSettings.constants';
import { useNotifyAction } from '#ui/contexts/NotificationContext/actions';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

/** Persists table state to the **cookie**, written via a server action (Set-Cookie header). */
export const usePersistTableStateAction = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistCookie = usePersistCookieAction({
    fetcherKey: 'persist-table-state',
  });
  const notify = useNotifyAction();

  return (args: TablePersistenceEntry | TablePersistenceEntry[]) => {
    const entries = Array.isArray(args) ? args : [args];
    // One snapshot for the whole execution. Two reads can observe two states,
    // and these two are related: an entry keyed with one table's `appId` and
    // another's prefix writes a param no loader reading that cookie scope looks
    // for, which is a state change that silently does nothing.
    const meta = metaStore.get();
    // Scope keys to the current app so tables in different apps that reuse the
    // same persistenceKey never share cookies / storage entries.
    const appId = meta?.appId;
    // A table sharing another route's URL writes its params under a prefix
    // rather than over the ones already there. Applied here rather than at each
    // of the four builders because this is the one place every entry passes
    // through, so it covers filters, sorting, grouping and the batched settings
    // write together.
    const paramPrefix =
      meta?.isUrlStateNested === true ? TABLE_NESTED_URL_STATE_PREFIX : '';

    const persistedEntries =
      meta?.isColumnLayoutTransient === true
        ? entries
            .filter(({ searchParamKey }) => searchParamKey !== undefined)
            .map((entry) => toUrlWriteOnly(entry))
        : entries;

    const serializedEntries = persistedEntries.map(
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
          searchParamKey: searchParamKey
            ? `${paramPrefix}${searchParamKey}`
            : '',
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
    if (serializedEntries.length === 0) {
      return true;
    }

    notify({
      durationMs: 10_000,
      message: 'This table state has been updated successfully.',
      title: 'Table updated',
      variant: 'success' as const,
    });

    persistCookie(serializedEntries);

    return true;
  };
};
