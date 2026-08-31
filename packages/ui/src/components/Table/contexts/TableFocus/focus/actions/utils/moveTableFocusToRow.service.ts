import type { TableFocusState } from '#ui/components/Table/Table.types';
import type { TStore } from '#ui/hooks/useStore.hook';

import { commitTableFocusTarget } from './commitTableFocusTarget.service';

type MoveTableFocusToRowArgs = {
  readonly container: HTMLElement | null | undefined;
  readonly focusState: TableFocusState;
  readonly focusStore: TStore<TableFocusState>;
  readonly rowHeight: number;
  readonly rowIndex: number;
  readonly rowKey: string;
};

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

  focusStore.set({ isGridFocused: false });
};
