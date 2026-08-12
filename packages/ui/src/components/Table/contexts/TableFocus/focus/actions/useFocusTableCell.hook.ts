import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';

import type { FocusTableCellArgs } from './useFocusTableCell.types';

import { setTableFocusTarget } from './utils/setTableFocusTarget.service';

/**
 * Points the grid's focus at a cell that has just taken DOM focus on its own —
 * a click, or a programmatic focus from outside the keyboard path.
 *
 * No scroll is involved: the cell raised this because it already has focus, so
 * it is on screen by construction. That is also why this is the one focus
 * action a cell can dispatch knowing nothing but the focus store.
 *
 * A cell that is already the target is ignored rather than re-committed. That
 * is not an optimisation — the keyboard path focuses its target node, which
 * raises this same event, and re-committing would ask for focus again in
 * response to having granted it.
 */
export const useFocusTableCell = () => {
  const { focusStore } = useTableFocusContextValue();

  return ({ columnKey, rowIndex, rowKey }: FocusTableCellArgs) => {
    const focusState = focusStore.get();

    if (
      focusState.isGridFocused &&
      focusState.rowKey === rowKey &&
      focusState.columnKey === columnKey
    ) {
      return;
    }

    setTableFocusTarget({ columnKey, focusStore, rowIndex, rowKey });
  };
};
