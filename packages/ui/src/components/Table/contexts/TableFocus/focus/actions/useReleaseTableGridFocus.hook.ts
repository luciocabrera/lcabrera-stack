import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';

import type { ReleaseTableGridFocusArgs } from './useReleaseTableGridFocus.types';

/**
 * Reports that the node holding the grid's focus has gone away, which hands the
 * tab stop back to the grid container.
 *
 * The stored row and column are kept — the row is still the focus target, it
 * just has no node right now, which is the ordinary consequence of scrolling
 * under virtualization (ADR-062).
 *
 * It clears nothing unless the store still points at the caller. A cell also
 * stops being the tab stop when focus moves to the cell beside it, and by then
 * the store names that other cell — treating the two cases alike would revoke
 * the tab stop the neighbour had just been granted.
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
