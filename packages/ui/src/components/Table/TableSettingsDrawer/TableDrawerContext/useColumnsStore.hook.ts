import { useSyncExternalStore } from 'react';

import type { TableColumnsState } from '@repo/ui/components/Table/Table.types';

import { useTableDrawerContextValue } from './useTableDrawerContextValue.hook';

export const useColumnsStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: TableColumnsState<TData>) => TSelected,
) => {
  const { columnsStore } = useTableDrawerContextValue();

  const state = useSyncExternalStore(
    columnsStore.subscribe,
    () => selector(columnsStore.get() as TableColumnsState<TData>),
    () =>
      selector(columnsStore.getServerSnapshot() as TableColumnsState<TData>),
  );

  return state;
};
