import { useTableFocusContextValue } from '#ui/components/Table/contexts/TableFocus/useTableFocusContextValue.hook';

import type { FocusTableCellArgs } from './useFocusTableCell.types';

import { setTableFocusTarget } from './utils/setTableFocusTarget.service';

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
