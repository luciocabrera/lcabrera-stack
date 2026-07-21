import type { TableColumnsState } from '@lcabrera/ui/components/Table/Table.types';

import { useTableConfigContextValue } from '@lcabrera/ui/components/Table/contexts/TableConfig/useTableConfigContextValue.hook';
import { useStoreSelector } from '@lcabrera/ui/hooks/useStoreSelector.hook';

export const useColumnsStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: TableColumnsState<TData>) => TSelected,
) => {
  const { columnsStore } = useTableConfigContextValue<TData>();

  return useStoreSelector({ selector, store: columnsStore });
};
