import type { TableColumnsState } from '#ui/components/Table/Table.types';

import { useTableConfigContextValue } from '#ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

export const useColumnsStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: TableColumnsState<TData>) => TSelected,
) => {
  const { columnsStore } = useTableConfigContextValue<TData>();

  return useStoreSelector({ selector, store: columnsStore });
};
