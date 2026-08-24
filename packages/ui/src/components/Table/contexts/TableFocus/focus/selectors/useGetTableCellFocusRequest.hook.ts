import { useFocusStore } from '#ui/components/Table/contexts/TableFocus/focus/useFocusStore.hook';

type UseGetTableCellFocusRequestArgs = {
  readonly columnKey: string;
  readonly rowKey: string;
};

export const useGetTableCellFocusRequest = ({
  columnKey,
  rowKey,
}: UseGetTableCellFocusRequestArgs) =>
  useFocusStore((state) =>
    state.rowKey === rowKey && state.columnKey === columnKey
      ? state.focusRequestId
      : 0,
  );
