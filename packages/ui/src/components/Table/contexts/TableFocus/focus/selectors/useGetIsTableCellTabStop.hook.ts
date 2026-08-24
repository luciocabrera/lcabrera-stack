import { useFocusStore } from '#ui/components/Table/contexts/TableFocus/focus/useFocusStore.hook';

type UseGetIsTableCellTabStopArgs = {
  readonly columnKey: string;
  readonly rowKey: string;
};

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
