import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';

import type { ReleaseTableGridFocusArgs } from './useReleaseTableGridFocus.types';

/**
 * The stored row and column are kept — the row is still the focus target, it just has no
 * node right now, which is the ordinary consequence of scrolling under virtualization
 * (ADR-062).
 */
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
