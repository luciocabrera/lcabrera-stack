import { useStoreSelector } from '@lcabrera/ui/hooks/useStoreSelector.hook';

import type { ColumnDrawerState } from './ColumnDrawerContext.types';

import { useColumnDrawerContextValue } from './useColumnDrawerContextValue.hook';

export const useColumnsStore = <TSelected, TData = Record<string, unknown>>(
  selector: (state: ColumnDrawerState<TData>) => TSelected,
) => {
  const { columnStore } = useColumnDrawerContextValue<TData>();

  return useStoreSelector({ selector, store: columnStore });
};
