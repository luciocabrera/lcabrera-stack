import { useFocusStore } from '#ui/components/Table/contexts/TableFocus/focus/useFocusStore.hook';

type UseGetTableCellFocusRequestArgs = {
  readonly columnKey: string;
  readonly rowKey: string;
};

/**
 * The id of the outstanding focus request aimed at this cell, or `0` when the
 * cell is not the focus target.
 *
 * Reading the id only for the targeted cell is what keeps the subscription
 * granular: every other cell's answer stays `0` across a focus move, so it does
 * not re-render.
 */
export const useGetTableCellFocusRequest = ({
  columnKey,
  rowKey,
}: UseGetTableCellFocusRequestArgs) =>
  useFocusStore((state) =>
    state.rowKey === rowKey && state.columnKey === columnKey
      ? state.focusRequestId
      : 0,
  );
