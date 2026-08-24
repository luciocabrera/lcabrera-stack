import type { TableFocusState } from '#ui/components/Table/Table.types';

export const getInitialFocusState = (): TableFocusState => ({
  columnKey: undefined,
  focusRequestId: 0,
  isGridFocused: false,
  rowIndex: undefined,
  rowKey: undefined,
});
