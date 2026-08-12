import type { TableFocusState } from '#ui/components/Table/Table.types';

import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';
import { useStoreSelector } from '#ui/hooks/useStoreSelector.hook';

export const useFocusStore = <TSelected>(
  selector: (state: TableFocusState) => TSelected,
) => {
  const { focusStore } = useTableFocusContextValue();

  return useStoreSelector({ selector, store: focusStore });
};
