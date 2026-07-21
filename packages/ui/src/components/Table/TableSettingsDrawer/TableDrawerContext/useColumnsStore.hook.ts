import { useStoreSelector } from '@lcabrera/ui/hooks/useStoreSelector.hook';

import type { TableDrawerColumnsState } from './TableDrawerContext.types';

import { useTableDrawerContextValue } from './useTableDrawerContextValue.hook';

export const useColumnsStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: TableDrawerColumnsState<TData>) => TSelected,
) => {
  const { columnsStore } = useTableDrawerContextValue<TData>();

  return useStoreSelector({ selector, store: columnsStore });
};
