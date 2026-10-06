import type { TablePersistenceEntry } from '#ui/components/Table/Table.types';
import type { PersistCookieEntry } from '#ui/routing/actions/routing.types';

import { resolvePersistenceEntries } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { TABLE_NESTED_URL_STATE_PREFIX } from '#ui/components/Table/Table.constants';
import { serializeStateSlice } from '#ui/components/Table/utils';
import {
  MAX_COOKIE_ENTRY_VALUE_LENGTH,
  PERSIST_TABLE_STATE_FETCHER_KEY,
  PERSISTENCE_SIZE_WARNING,
} from '#ui/constants/globalSettings.constants';
import { useNotifyAction } from '#ui/contexts/NotificationContext/actions';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

type PersistTableStateArgs =
  | readonly TablePersistenceEntry[]
  | TablePersistenceEntry
  | {
      readonly cookieEntries: readonly PersistCookieEntry[];
      readonly entries: readonly TablePersistenceEntry[];
    };

const readPersistRequest = (args: PersistTableStateArgs) => {
  if ('cookieEntries' in args) {
    return {
      cookieEntries: args.cookieEntries,
      entries: args.entries,
    };
  }

  if (Array.isArray(args)) {
    return {
      cookieEntries: [],
      entries: args,
    };
  }

  return {
    cookieEntries: [],
    entries: [args],
  };
};

export const usePersistTableStateAction = () => {
  const { metaStore } = useTableConfigContextValue();
  const persistCookie = usePersistCookieAction({
    fetcherKey: PERSIST_TABLE_STATE_FETCHER_KEY,
  });
  const notify = useNotifyAction();

  return (args: PersistTableStateArgs) => {
    const { cookieEntries, entries } = readPersistRequest(args);
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
        searchParamValue = '',
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
          searchParamValue,
          value,
        };
      },
    );

    const payload = [...serializedEntries, ...cookieEntries];
    const entriesString = JSON.stringify(payload);
    if (entriesString.length > MAX_COOKIE_ENTRY_VALUE_LENGTH) {
      notify(PERSISTENCE_SIZE_WARNING);
      return false;
    }
    if (payload.length === 0) {
      return true;
    }

    notify({
      durationMs: 10_000,
      message: 'This table state has been updated successfully.',
      title: 'Table updated',
      variant: 'success' as const,
    });

    persistCookie(payload);

    return true;
  };
};
