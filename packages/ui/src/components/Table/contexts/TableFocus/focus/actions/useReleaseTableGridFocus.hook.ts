import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';

import type { ReleaseTableGridFocusArgs } from './useReleaseTableGridFocus.types';

export const useReleaseTableGridFocus = () => {
  const { focusStore } = useTableFocusContextValue();

  return ({ columnKey, rowKey }: ReleaseTableGridFocusArgs) => {
    const focusState = focusStore.get();

    if (
      focusState.isGridFocused &&
      focusState.rowKey === rowKey &&
      focusState.columnKey === columnKey
    ) {
      focusStore.set({ isGridFocused: false });
    }
  };
};
