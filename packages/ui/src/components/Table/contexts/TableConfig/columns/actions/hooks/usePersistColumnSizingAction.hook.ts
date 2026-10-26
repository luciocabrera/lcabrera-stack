import { use } from 'react';

import { buildColumnSizingCookieEntry } from '#ui/components/Table/contexts/TableConfig/columns/actions/utils';
import { TablePersistenceContext } from '#ui/components/Table/contexts/TableConfig/TablePersistenceContext.context';
import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';

export const usePersistColumnSizingAction = <TData>() => {
  const { columnsStore, metaStore } = useTableConfigContextValue<TData>();
  const persistence = use(TablePersistenceContext);

  return () => {
    if (persistence === undefined) return;

    const metaState = metaStore.get();

    if (metaState?.isColumnLayoutTransient === true) return;

    const entry = buildColumnSizingCookieEntry<TData>({
      appId: metaState?.appId,
      columnSizing: columnsStore.get()?.columnSizing,
      persistenceKey: metaState?.persistenceKey,
    });

    if (entry) {
      persistence.columnSizing([entry]);
    }
  };
};
