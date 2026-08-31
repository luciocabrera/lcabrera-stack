import type { TablePersistenceEntry } from '#ui/components/Table/Table.types';

import { resolvePersistenceEntries } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { TABLE_NESTED_URL_STATE_PREFIX } from '#ui/components/Table/Table.constants';
import { serializeStateSlice } from '#ui/components/Table/utils';
import {
  MAX_COOKIE_ENTRY_VALUE_LENGTH,
  PERSISTENCE_SIZE_WARNING,
} from '#ui/constants/globalSettings.constants';
import { useNotifyAction } from '#ui/contexts/NotificationContext/actions';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

export const usePersistTableStateAction = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistCookie = usePersistCookieAction({
    fetcherKey: 'persist-table-state',
  });
  const notify = useNotifyAction();

  return (args: TablePersistenceEntry | TablePersistenceEntry[]) => {
    const entries = Array.isArray(args) ? args : [args];
    const meta = metaStore.get();
    const appId = meta?.appId;
    const paramPrefix =
      meta?.isUrlStateNested === true ? TABLE_NESTED_URL_STATE_PREFIX : '';

    const persistedEntries = resolvePersistenceEntries({
      entries,
      isColumnLayoutTransient: meta?.isColumnLayoutTransient === true,
    });

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
