import { buildColumnSizingCookieEntry } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

export const usePersistColumnSizingAction = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistCookie = usePersistCookieAction({
    fetcherKey: 'persist-column-sizing',
  });

  return () => {
    const metaState = metaStore.get();

    if (metaState?.isColumnLayoutTransient === true) return;

    const entry = buildColumnSizingCookieEntry<TData>({
      appId: metaState?.appId,
      columnSizing: columnsStore.get()?.columnSizing,
      persistenceKey: metaState?.persistenceKey,
    });

    if (entry) {
      persistCookie([entry]);
    }
  };
};
