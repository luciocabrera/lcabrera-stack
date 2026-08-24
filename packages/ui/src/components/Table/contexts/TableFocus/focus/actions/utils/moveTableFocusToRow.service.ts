import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { commitTableFocusTarget } from './commitTableFocusTarget.service';

type MoveTableFocusToRowArgs = {
  readonly container: HTMLElement | null | undefined;
  /** The snapshot the calling action already read — never a second `store.get()`. */
  readonly focusState: TableFocusState;
  readonly focusStore: TStore<TableFocusState>;
  readonly rowHeight: number;
  readonly rowIndex: number;
  readonly rowKey: string;
};

/**
 * So the request is only raised while focus is already inside the grid; otherwise the
 * target is repositioned quietly and the grid is re-entered on it later, which is what
 * `isGridFocused` exists to distinguish (ADR-062).
 * A target row with no column is not a target: `setTableFocusTarget` writes the two
 * together, so a stored row without one means the grid has never been entered and there is
 * nothing to keep pointed at a row.
 */
export const moveTableFocusToRow = ({
  container,
  focusState,
  focusStore,
  rowHeight,
  rowIndex,
  rowKey,
}: MoveTableFocusToRowArgs) => {
  const { columnKey, isGridFocused } = focusState;

  if (columnKey === undefined) return;

  if (!isGridFocused) {
    focusStore.set({ rowIndex, rowKey });

    return;
  }

  commitTableFocusTarget({
    columnKey,
    container,
    focusStore,
    rowHeight,
    rowIndex,
    rowKey,
  });

  // The node that held DOM focus is being removed by the same interaction, and
  // a browser does not reliably raise `focusout` for a node it has removed —
  // the reason `useTableCellFocus` releases the tab stop from the node rather
  // than from an event. The release cannot fire here, because the store has
  // just been re-pointed away from that cell, so it is made explicitly: the
  // grid container takes the tab stop back and is therefore never left without
  // one. A cell that does mount for the new target claims it straight back
  // through its own focus event.
  focusStore.set({ isGridFocused: false });
};
