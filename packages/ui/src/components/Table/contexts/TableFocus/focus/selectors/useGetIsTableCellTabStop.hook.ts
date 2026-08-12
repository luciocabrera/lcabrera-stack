import { useFocusStore } from '#ui/components/Table/contexts/TableFocus/focus/useFocusStore.hook';

type UseGetIsTableCellTabStopArgs = {
  readonly columnKey: string;
  readonly rowKey: string;
};

/**
 * Whether this cell is the one element in the grid carrying `tabIndex={0}`.
 *
 * The selector answers a boolean rather than the focus target itself, so a
 * focus move re-renders only the two cells whose answer changed, not every
 * mounted cell.
 */
export const useGetIsTableCellTabStop = ({
  columnKey,
  rowKey,
}: UseGetIsTableCellTabStopArgs) =>
  useFocusStore(
    (state) =>
      state.isGridFocused &&
      state.rowKey === rowKey &&
      state.columnKey === columnKey,
  );
